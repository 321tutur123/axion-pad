import { NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/admin-auth";

export const runtime = "edge";

function setCookieHeader(value: string, maxAge: number): string {
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${maxAge}`,
  ];
  return attrs.join("; ");
}

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const secret = process.env.AUTH_SECRET;
  const expected = process.env.ADMIN_PASSWORD;

  // Both env vars must be set; constant-time-ish via early exits only on config errors
  if (!secret || !expected || !body.password || body.password !== expected) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const token = await createSessionToken(secret);
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", setCookieHeader(token, SESSION_MAX_AGE_SECONDS));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", setCookieHeader("", 0));
  return response;
}
