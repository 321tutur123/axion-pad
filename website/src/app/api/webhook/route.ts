import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const body      = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Verify the event came from Stripe
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Only act on successful payments
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Fetch the line items (not included in the event payload by default)
  const { data: lineItems } = await stripe.checkout.sessions.listLineItems(
    session.id,
    { limit: 100 },
  );

  const items = lineItems.map(item => ({
    name:       item.description ?? "Produit",
    quantity:   item.quantity    ?? 1,
    unit_price: (item.price?.unit_amount ?? 0) / 100,
    subtotal:   (item.amount_total        ?? 0) / 100,
  }));

  const orderNumber = session.metadata?.orderId
    ?? `AXN-${Date.now().toString(36).toUpperCase()}`;

  const customerEmail = session.customer_details?.email ?? "";
  const productSlug   = session.metadata?.productSlug ?? "";

  try {
    const { env } = getRequestContext();
    await env.DB.prepare(`
      INSERT OR IGNORE INTO orders (
        id, stripe_event_id, order_number, status, payment_status,
        customer_email, customer_name,
        amount_total, currency,
        shipping_name, shipping_address,
        items, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.id,
      event.id,
      orderNumber,
      "confirmed",
      session.payment_status,
      customerEmail,
      session.customer_details?.name  ?? "",
      session.amount_total            ?? 0,
      (session.currency ?? "eur").toUpperCase(),
      session.shipping_details?.name  ?? "",
      JSON.stringify(session.shipping_details?.address ?? null),
      JSON.stringify(items),
      session.created,
    ).run();
  } catch (dbErr) {
    // Return 200 so Stripe doesn't keep retrying — order is safe in Stripe Dashboard.
    console.error("D1 insert failed:", dbErr);
  }

  // Schedule a review request email 7 days after purchase
  if (process.env.RESEND_API_KEY && customerEmail) {
    const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://axionpad.com";
    const reviewUrl = productSlug
      ? `${origin}/shop/${productSlug}#reviews`
      : `${origin}/shop`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AxionPad <noreply@axionpad.com>",
        to: customerEmail,
        subject: "Votre avis nous intéresse !",
        scheduledAt,
        html: `<p>Bonjour,</p>
<p>Nous espérons que vous êtes satisfait(e) de votre commande AxionPad !</p>
<p>Votre retour aide d'autres passionnés à faire le bon choix. Cela ne prend qu'une minute.</p>
<p><a href="${reviewUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;">Laisser un avis →</a></p>
<p style="color:#71717a;font-size:12px;">Vous recevez cet e-mail car vous avez passé commande sur axionpad.com.</p>`,
      }),
    }).catch(() => null); // fire-and-forget, don't fail the webhook
  }

  return NextResponse.json({ received: true });
}
