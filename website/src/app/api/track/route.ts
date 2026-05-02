import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "edge";

const PAYMENT_STATUS_MAP: Record<string, string> = {
  paid:                "confirmed",
  unpaid:              "pending",
  no_payment_required: "confirmed",
};

export async function GET(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("order")?.trim();
  const email     = searchParams.get("email")?.trim().toLowerCase();

  if (!sessionId || !email) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "line_items.data.price.product"],
    });
  } catch {
    return NextResponse.json(
      { error: "Session introuvable. Vérifiez l'identifiant de commande." },
      { status: 404 },
    );
  }

  // Verify the email matches the Stripe customer
  const stripeEmail = session.customer_details?.email?.toLowerCase();
  if (!stripeEmail || stripeEmail !== email) {
    return NextResponse.json(
      { error: "L'email ne correspond pas à cette commande." },
      { status: 403 },
    );
  }

  const status = PAYMENT_STATUS_MAP[session.payment_status] ?? "pending";

  const items = (session.line_items?.data ?? []).map((item, i) => {
    const product = item.price?.product;
    const productName =
      typeof product === "object" && product !== null && "name" in product
        ? (product as Stripe.Product).name
        : (item.description ?? "Produit");

    return {
      id:           String(i),
      product_name: productName,
      quantity:     item.quantity ?? 1,
      price:        (item.price?.unit_amount ?? 0) / 100,
      subtotal:     (item.amount_total ?? 0) / 100,
    };
  });

  return NextResponse.json({
    order: {
      order_number:   session.id,
      status,
      payment_status: session.payment_status,
      created_at:     new Date(session.created * 1000).toISOString(),
      total:          (session.amount_total ?? 0) / 100,
      currency:       session.currency?.toUpperCase() ?? "EUR",
      shipping:       session.shipping_details ?? null,
      items,
    },
  });
}
