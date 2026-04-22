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

  try {
    const { env } = getRequestContext();
    await env.DB.prepare(`
      INSERT OR REPLACE INTO orders (
        id, order_number, status, payment_status,
        customer_email, customer_name,
        amount_total, currency,
        shipping_name, shipping_address,
        items, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.id,
      orderNumber,
      "confirmed",
      session.payment_status,
      session.customer_details?.email ?? "",
      session.customer_details?.name  ?? "",
      session.amount_total            ?? 0,
      (session.currency ?? "eur").toUpperCase(),
      session.shipping_details?.name  ?? "",
      JSON.stringify(session.shipping_details?.address ?? null),
      JSON.stringify(items),
      session.created,
    ).run();
  } catch (dbErr) {
    // Log but still return 200 — order data is safe in Stripe Dashboard.
    // Stripe would retry on 5xx, causing duplicate inserts.
    console.error("D1 insert failed:", dbErr);
  }

  return NextResponse.json({ received: true });
}
