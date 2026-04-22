// Required: npm install stripe @cloudflare/next-on-pages
// Required: add setupDevPlatform() to next.config.ts for local D1 access
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

// ─── Shipping options ─────────────────────────────────────────────────────────
// To switch to pre-created Stripe rates, replace each object with:
//   { shipping_rate: "shr_XXXXXXXXXXXXXXXXXXXXXXXX" }
const STANDARD_SHIPPING: Stripe.Checkout.SessionCreateParams.ShippingOption = {
  shipping_rate_data: {
    type: "fixed_amount",
    fixed_amount: { amount: 599, currency: "eur" },
    display_name: "Livraison Standard",
    delivery_estimate: {
      minimum: { unit: "business_day", value: 5 },
      maximum: { unit: "business_day", value: 7 },
    },
  },
};

const EXPRESS_SHIPPING: Stripe.Checkout.SessionCreateParams.ShippingOption = {
  shipping_rate_data: {
    type: "fixed_amount",
    fixed_amount: { amount: 1299, currency: "eur" },
    display_name: "Livraison Express",
    delivery_estimate: {
      minimum: { unit: "business_day", value: 1 },
      maximum: { unit: "business_day", value: 2 },
    },
  },
};

// ─── Handler ──────────────────────────────────────────────────────────────────
interface CheckoutItem {
  productId: string;
  quantity: number;
  variantLabel?: string;
}

export async function POST(request: Request) {
  const { env } = getRequestContext() as { env: CloudflareEnv };
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  let items: CheckoutItem[];
  try {
    const body = (await request.json()) as { items: CheckoutItem[] };
    items = body.items;
    if (!Array.isArray(items) || items.length === 0) throw new Error();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate price and stock from D1 for every line item — prevents client-side tampering
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const item of items) {
    if (item.quantity < 1) continue;

    const row = await env.DB
      .prepare("SELECT id, name, price, stock FROM products WHERE id = ?")
      .bind(item.productId)
      .first<{ id: string; name: string; price: number; stock: number }>();

    if (!row) {
      return NextResponse.json(
        { error: `Produit introuvable : ${item.productId}` },
        { status: 404 },
      );
    }

    if (row.stock < item.quantity) {
      return NextResponse.json(
        { error: `Stock insuffisant pour : ${row.name}` },
        { status: 409 },
      );
    }

    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: "eur",
        unit_amount: row.price, // cents sourced from D1, not the client
        product_data: {
          name: item.variantLabel ? `${row.name} — ${item.variantLabel}` : row.name,
        },
      },
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "Panier vide" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    shipping_address_collection: {
      // Restrict to specific countries, or remove this key entirely for worldwide collection
      allowed_countries: ["FR", "BE", "CH", "LU", "DE", "ES", "IT", "NL", "AT", "PT"],
    },
    shipping_options: [STANDARD_SHIPPING, EXPRESS_SHIPPING],
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/shop`,
    locale: "fr",
  });

  return NextResponse.json({ url: session.url });
}
