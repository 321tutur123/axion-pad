import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

const VALID_STATUSES = ["confirmed", "shipped", "cancelled"] as const;
type OrderStatus = typeof VALID_STATUSES[number];

function authorized(request: Request): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_KEY;
  if (!expected) return false;
  return key === expected;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { status?: string; tracking_number?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { status, tracking_number = "" } = body;
  if (status && !VALID_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  try {
    const { env } = getRequestContext();
    if (status && tracking_number !== undefined) {
      await env.DB.prepare(
        "UPDATE orders SET status = ?, tracking_number = ? WHERE id = ?",
      ).bind(status, tracking_number.slice(0, 100), id).run();
    } else if (status) {
      await env.DB.prepare(
        "UPDATE orders SET status = ? WHERE id = ?",
      ).bind(status, id).run();
    } else if (tracking_number !== undefined) {
      await env.DB.prepare(
        "UPDATE orders SET tracking_number = ? WHERE id = ?",
      ).bind(tracking_number.slice(0, 100), id).run();
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
