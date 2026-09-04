import webpush from "web-push";

const publicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";

if (publicKey && privateKey) {
  webpush.setVapidDetails("mailto:admin@lombafinder.app", publicKey, privateKey);
}

export function pushEnabled(): boolean {
  return Boolean(publicKey && privateKey);
}

export function getPublicKey(): string {
  return publicKey;
}

/** Current date as YYYY-MM-DD in WIB (UTC+7) — used to dedupe daily pushes. */
export function wibDateStr(d: Date = new Date()): string {
  return new Date(d.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}