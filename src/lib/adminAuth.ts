import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/** Name of the httpOnly cookie holding the admin session. */
export const SESSION_COOKIE = "admin_session";

/** How long a login lasts, in seconds (7 days). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const SESSION_MESSAGE = "admin-session-v1";

/** True when ADMIN_SECRET is configured. Without it, every admin path fails closed. */
export function adminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_SECRET);
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Deterministic session token derived from ADMIN_SECRET. There is no server-side
 * session store, so the token is a signature: knowing it requires knowing the
 * secret, and changing the secret invalidates every existing session.
 */
export function expectedSessionToken(): string | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(SESSION_MESSAGE).digest("hex");
}

export function verifyPassword(password: string): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return safeEqual(password, secret);
}

export function isValidSession(token: string | undefined): boolean {
  const expected = expectedSessionToken();
  if (!expected || !token) return false;
  return safeEqual(token, expected);
}

/** Convenience guard for Route Handlers. */
export function isAuthorized(request: NextRequest): boolean {
  return isValidSession(request.cookies.get(SESSION_COOKIE)?.value);
}
