export const USER_COOKIE_NAME = "auth_token";
export const USER_JWT_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

// ─── Encoding helpers (same pattern as admin-auth.ts) ────────────────────────

function enc(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer as ArrayBuffer;
}

function b64url(buf: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(buf)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): ArrayBuffer {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(s + "=".repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0))
    .buffer as ArrayBuffer;
}

// ─── Password hashing (PBKDF2-SHA256) ────────────────────────────────────────
// Stored format: b64url(16-byte salt) + ":" + b64url(32-byte hash)

const PBKDF2_ITERATIONS = 100_000;

export async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = saltBytes.buffer as ArrayBuffer;
  const key = await crypto.subtle.importKey("raw", enc(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return `${b64url(salt)}:${b64url(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const colon = stored.indexOf(":");
    if (colon < 1) return false;
    const salt = b64urlDecode(stored.slice(0, colon));
    const expected = stored.slice(colon + 1);
    const key = await crypto.subtle.importKey("raw", enc(password), "PBKDF2", false, ["deriveBits"]);
    const hash = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
      key,
      256,
    );
    const candidate = b64url(hash);
    // Fixed-length strings (always 43 base64url chars for 256-bit output) — safe XOR compare
    if (candidate.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  } catch {
    return false;
  }
}

// ─── JWT (HS256) ──────────────────────────────────────────────────────────────

const JWT_HEADER = b64url(enc(JSON.stringify({ alg: "HS256", typ: "JWT" })));

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createUserToken(userId: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(enc(JSON.stringify({ sub: userId, iat: now, exp: now + USER_JWT_MAX_AGE_SECONDS })));
  const message = `${JWT_HEADER}.${payload}`;
  const key = await importHmacKey(secret);
  const sig = b64url(await crypto.subtle.sign("HMAC", key, enc(message)));
  return `${message}.${sig}`;
}

// Returns the user_id (sub claim) or null if the token is invalid/expired.
export async function verifyUserToken(token: string, secret: string): Promise<string | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const key = await importHmacKey(secret);
    const ok = await crypto.subtle.verify("HMAC", key, b64urlDecode(sig), enc(`${header}.${payload}`));
    if (!ok) return null;
    const { sub, exp } = JSON.parse(new TextDecoder().decode(b64urlDecode(payload))) as {
      sub: string;
      exp: number;
    };
    if (exp < Math.floor(Date.now() / 1000)) return null;
    return sub;
  } catch {
    return null;
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export function getUserCookie(request: Request): string | null {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Convenience: extract + verify in one call. Returns user_id or null.
export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  const token = getUserCookie(request);
  if (!token) return null;
  return verifyUserToken(token, secret);
}
