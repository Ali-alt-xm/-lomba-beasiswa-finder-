type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const MAX_TRACKED_KEYS = 5_000;

/**
 * Best-effort in-memory rate limiter.
 *
 * State lives per serverless instance, so it does not stop a distributed flood —
 * it guards against accidental loops, retry storms and naive abuse from a single
 * client. A shared store would be required for a hard security boundary.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const now = Date.now();

  // Keep the map from growing without bound on a long-lived instance.
  if (buckets.size > MAX_TRACKED_KEYS) buckets.clear();

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  return { ok: true, retryAfter: 0 };
}

/** Builds a per-client key. Handles Netlify, Vercel and generic proxies. */
export function clientKey(request: Request, scope: string): string {
  const headers = request.headers;
  const ip =
    headers.get("x-nf-client-connection-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown";

  return `${scope}:${ip}`;
}
