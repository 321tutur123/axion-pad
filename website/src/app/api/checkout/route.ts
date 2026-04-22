import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getProduct } from "@/lib/products-data";

// Standard Node.js runtime — process.env is available without any Cloudflare adapter
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

interface CheckoutItem {
  productId: string;
  name: string;
  price: number;     // cents, from client (includes option additions)
  quantity: number;
  variantLabel?: string;
}

export async function POST(request: Request) {
  let items: CheckoutItem[];
  try {
    ({ items } = (await request.json()) as { items: CheckoutItem[] });
    if (!Array.isArray(items) || items.length === 0) throw new Error();
  } catch {
    return NextResponse.json({ error: "Panier vide" }, { status: 400 });
  }

  // Validate against server-side catalog — prevents client-side price tampering
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const item of items) {
    if (item.quantity < 1) continue;

    const product = getProduct(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Produit introuvable : ${item.productId}` },
        { status: 404 },
      );
    }
    if (product.stock === 0) {
      return NextResponse.json(
        { error: `Rupture de stock : ${product.name}` },
        { status: 409 },
      );
    }

    // Use whichever is higher: client price (with options) or base product price.
    // This prevents a customer from sending a price below the base.
    const unitAmount = Math.max(item.price, product.price);

    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: "eur",
        unit_amount: unitAmount,
        product_data: {
          name: item.variantLabel
            ? `${product.name} — ${item.variantLabel}`
            : product.name,
        },
      },
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "Panier vide" }, { status: 400 });
  }

  const orderId  = `AXN-${Date.now().toString(36).toUpperCase()}`;
  const origin   = request.headers.get("origin")
    ?? process.env.NEXT_PUBLIC_SITE_URL
    ?? "https://axionpad.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    shipping_address_collection: {
      allowed_countries: ["FR", "BE", "CH", "LU", "DE", "ES", "IT", "NL", "AT", "PT"],
    },
    shipping_options: [STANDARD_SHIPPING, EXPRESS_SHIPPING],
    metadata: { orderId },
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/shop`,
    locale: "fr",
  });

  return NextResponse.json({ url: session.url });
}
