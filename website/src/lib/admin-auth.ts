const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

// TextEncoder.encode() returns Uint8Array whose .buffer is typed as ArrayBufferLike
// (includes SharedArrayBuffer) in strict lib.dom.d.ts. Web Crypto expects plain ArrayBuffer,
// so we extract it with an explicit cast — safe because TextEncoder never uses SharedArrayBuffer.
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

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(secret: string): Promise<string> {
  const payload = b64url(
    enc(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })),
  );
  const key = await importKey(secret);
  const sig = b64url(await crypto.subtle.sign("HMAC", key, enc(payload)));
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const key = await importKey(secret);
    const ok = await crypto.subtle.verify(
      "HMAC", key, b64urlDecode(sig), enc(payload),
    );
    if (!ok) return false;
    const { exp } = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payload)),
    ) as { exp: number };
    return exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function getSessionCookie(request: Request): string | null {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(/(?:^|;\s*)admin_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function isAuthorized(request: Request): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  const token = getSessionCookie(request);
  if (!token) return false;
  return verifySessionToken(token, secret);
}

export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE;
