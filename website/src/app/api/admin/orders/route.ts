import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { isAuthorized } from "@/lib/admin-auth";

export const runtime = "edge";

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { env } = getRequestContext();
    const { results } = await env.DB.prepare(
      `SELECT id, order_number, status, payment_status,
              customer_email, customer_name,
              amount_total, currency,
              shipping_name, shipping_address,
              items, tracking_number, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT 500`,
    ).all();
    return NextResponse.json({ orders: results });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
