import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  verified: number;
  created_at: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId")?.trim();

  if (!productId) return NextResponse.json({ reviews: [] });

  try {
    const { env } = getRequestContext();
    const { results } = await env.DB.prepare(
      "SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 50",
    ).bind(productId).all<Review>();
    return NextResponse.json({ reviews: results });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(request: Request) {
  let body: { productId?: string; customerName?: string; rating?: unknown; comment?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { productId, customerName, comment = "" } = body;
  const rating = Number(body.rating);

  if (!productId || !customerName?.trim() || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    const { env } = getRequestContext();
    await env.DB.prepare(
      "INSERT INTO reviews (id, product_id, customer_name, rating, comment, verified, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
    ).bind(
      crypto.randomUUID(),
      productId,
      customerName.trim().slice(0, 100),
      Math.round(rating),
      comment.slice(0, 1000),
      Math.floor(Date.now() / 1000),
    ).run();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
