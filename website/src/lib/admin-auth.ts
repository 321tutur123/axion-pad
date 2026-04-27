const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(s + "=".repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(secret: string): Promise<string> {
  const payload = b64url(
    new TextEncoder().encode(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE }),
    ),
  );
  const key = await importKey(secret);
  const sig = b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
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
      "HMAC", key, b64urlDecode(sig), new TextEncoder().encode(payload),
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
