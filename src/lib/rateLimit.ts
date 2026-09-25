import { prisma } from "@/lib/prisma";
import { clientKey as ipKey } from "./clientKey";

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 5_000;

export { clientKey } from "./clientKey";

export type RateLimitResult = {
  ok: boolean;
  retryAfter: number; // seconds
  store: "postgres" | "memory";
};

/**
 * Fixed-window rate limiter backed by Postgres, so the count is shared across
 * every serverless instance (the in-memory version is not — each instance
 * counts separately).
 *
 * A window is a bucket row keyed by (key, windowEnd). The counter increments
 * atomically via upsert, so parallel requests can never inflate past the limit.
 *
 * If Postgres is unreachable, we fail OPEN on the shared limit and fall back to
 * the per-instance in-memory limiter — availability beats strictness here, and
 * the in-memory fallback still blunts single-instance bursts.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowEnd = new Date(Math.ceil(now / windowMs) * windowMs);

  try {
    const row = await prisma.rateLimit.upsert({
      where: {
        key_expiresAt: { key, expiresAt: windowEnd },
      },
      create: { key, count: 1, expiresAt: windowEnd },
      update: { count: { increment: 1 } },
    });

    // Opportunistic cleanup: this row only exists while its window is live, so
    // this is the natural place to sweep expired windows. Cheap — uses the
    // expiresAt index — and deleting nothing is a no-op.
    prisma.rateLimit
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch(() => {});

    if (row.count > limit) {
      return {
        ok: false,
        retryAfter: Math.max(1, Math.ceil((windowEnd.getTime() - now) / 1000)),
        store: "postgres",
      };
    }

    return { ok: true, retryAfter: 0, store: "postgres" };
  } catch {
    // Postgres unavailable — fall back to per-instance memory.
    return memoryRateLimit(key, limit, windowMs);
  }
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  if (memoryBuckets.size > MAX_TRACKED_KEYS) memoryBuckets.clear();

  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0, store: "memory" };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
      store: "memory",
    };
  }
  return { ok: true, retryAfter: 0, store: "memory" };
}
