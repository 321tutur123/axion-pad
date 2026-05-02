export const runtime = "edge";

import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import {
  verifyPassword,
  createUserToken,
  USER_COOKIE_NAME,
  USER_JWT_MAX_AGE_SECONDS,
} from "@/lib/user-auth";

interface LoginBody {
  email: string;
  password: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
}

// Dummy hash used when no user is found — keeps timing consistent and prevents
// an attacker from detecting unregistered emails via response time differences.
const DUMMY_HASH = "AAAAAAAAAAAAAAAAAAAAAA:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const { env } = getRequestContext();

  const user = await env.DB.prepare(
    "SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = ?",
  )
    .bind(email.trim().toLowerCase())
    .first<UserRow>();

  // Always run the full PBKDF2 verification to prevent user-enumeration via timing.
  const validPassword = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !validPassword) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const token = await createUserToken(user.id, secret);

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    },
  });

  response.headers.set(
    "Set-Cookie",
    `${USER_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${USER_JWT_MAX_AGE_SECONDS}`,
  );

  return response;
}
