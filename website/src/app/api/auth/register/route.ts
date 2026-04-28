export const runtime = "edge";

import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { hashPassword } from "@/lib/user-auth";

interface RegisterBody {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password, first_name = "", last_name = "" } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const emailNorm = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const { env } = getRequestContext();

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(emailNorm)
    .first<{ id: string }>();

  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const password_hash = await hashPassword(password);
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, first_name, last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(id, emailNorm, password_hash, first_name.trim(), last_name.trim(), now, now)
    .run();

  return NextResponse.json({ success: true }, { status: 201 });
}
