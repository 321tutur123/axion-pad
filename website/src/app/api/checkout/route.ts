import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  buildCheckoutEngravingDescription,
  computeUnitPriceFromSelections,
  getProduct,
} from "@/lib/products-data";

export const runtime = "edge";

const MAX_DISTINCT_ITEMS = 30;
const MAX_QTY_PER_LINE = 10;

const STANDARD_SHIPPING: Stripe.Checkout.SessionCreateParams.ShippingOption = {
  shipping_rate_data: {
    type: "fixed_amount",
    fixed_amount: { amount: 500, currency: "eur" },
    display_name: "Livraison Standard",
    delivery_estimate: {
      minimum: { unit: "business_day", value: 5 },
      maximum: { unit: "business_day", value: 7 },
    },
  },
};

interface CheckoutItem {
  productId: string;
  name: string;
  /** Centimes — non utilisé si le prix est recalculé côté serveur */
  price: number;
  quantity: number;
  variantLabel?: string;
  selections?: Record<string, string>;
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Paiement indisponible (configuration Stripe manquante)." },
      { status: 503 },
    );
  }
  const stripe = new Stripe(secret);

  let items: CheckoutItem[];
  try {
    ({ items } = (await request.json()) as { items: CheckoutItem[] });
    if (!Array.isArray(items) || items.length === 0) throw new Error();
  } catch {
    return NextResponse.json({ error: "Panier vide" }, { status: 400 });
  }

  if (items.length > MAX_DISTINCT_ITEMS) {
    return NextResponse.json({ error: "Trop d’articles distincts dans le panier." }, { status: 400 });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const item of items) {
    if (typeof item.productId !== "string" || !SLUG_RE.test(item.productId)) {
      return NextResponse.json({ error: "Référence produit invalide." }, { status: 400 });
    }
    const qty = Math.floor(Number(item.quantity));
    if (qty < 1 || qty > MAX_QTY_PER_LINE) {
      return NextResponse.json({ error: "Quantité invalide pour un ou plusieurs articles." }, { status: 400 });
    }

    const product = getProduct(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Produit introuvable : ${item.productId}` },
        { status: 404 },
      );
    }
    if (product.comingSoon) {
      return NextResponse.json(
        { error: `Produit indisponible : ${product.name}` },
        { status: 409 },
      );
    }
    if (product.stock === 0) {
      return NextResponse.json(
        { error: `Rupture de stock : ${product.name}` },
        { status: 409 },
      );
    }
    if (qty > product.stock) {
      return NextResponse.json(
        { error: `Stock insuffisant pour « ${product.name} » (max ${product.stock}).` },
        { status: 409 },
      );
    }

    const unitCents = computeUnitPriceFromSelections(product, item.selections);
    if (unitCents === null) {
      return NextResponse.json(
        {
          error:
            `Configuration incomplète pour « ${product.name} ». Ouvrez la fiche produit et réajoutez l’article au panier.`,
        },
        { status: 400 },
      );
    }

    const variantName = item.variantLabel
      ? `${product.name} — ${item.variantLabel}`
      : product.name;
    const engravingDesc = buildCheckoutEngravingDescription(product, item.selections);

    lineItems.push({
      quantity: qty,
      price_data: {
        currency: "eur",
        unit_amount: unitCents,
        product_data: {
          name: variantName.slice(0, 250),
          ...(engravingDesc ? { description: engravingDesc } : {}),
        },
      },
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "Panier vide" }, { status: 400 });
  }

  const orderId = `AXN-${Date.now().toString(36).toUpperCase()}`;
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://axionpad.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    shipping_address_collection: {
      allowed_countries: ["FR", "BE", "CH", "LU", "DE", "ES", "IT", "NL", "AT", "PT"],
    },
    shipping_options: [STANDARD_SHIPPING],
    metadata: { orderId, productSlug: items[0]?.productId ?? "" },
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop`,
    locale: "fr",
  });

  return NextResponse.json({ url: session.url });
}
