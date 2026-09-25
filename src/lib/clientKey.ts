/** Builds a per-client rate-limit key. Handles Netlify, Vercel and generic proxies. */
export function clientKey(request: Request, scope: string): string {
  const headers = request.headers;
  const ip =
    headers.get("x-nf-client-connection-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown";

  return `${scope}:${ip}`;
}
