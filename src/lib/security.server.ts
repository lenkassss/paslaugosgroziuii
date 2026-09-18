/**
 * Edge security layer: response hardening headers + per-IP rate limiting.
 *
 * The limiter is an in-isolate sliding window. It is intentionally cheap and
 * stateless-friendly: each worker isolate throttles the traffic it sees, which
 * blunts scraping and credential-stuffing bursts without a network round-trip.
 */

const SUPABASE_ORIGIN = (process.env["SUPABASE_URL"] ?? "https://*.supabase.co").replace(/\/$/, "");

function csp(): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.paysera.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' ${SUPABASE_ORIGIN} https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.paysera.com https://nominatim.openstreetmap.org`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.paysera.com",
    "media-src 'self' blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.paysera.com https://checkout.stripe.com",
    "frame-ancestors 'self' ",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function securityHeaders(): Record<string, string> {
  return {
    "content-security-policy": csp(),
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
    "permissions-policy": "camera=(), microphone=(), payment=(self), geolocation=(self)",
    "cross-origin-opener-policy": "same-origin-allow-popups",
    "x-robots-tag": "noai, noimageai",
  };
}

// ---------------------------------------------------------------- rate limits

type Bucket = { hits: number[]; blockedUntil: number };
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 20000;

export type RateRule = { limit: number; windowMs: number; blockMs: number };

export const RATE_RULES = {
  /** Sign in / sign up / password reset: 5 per 15 min. */
  auth: { limit: 5, windowMs: 15 * 60_000, blockMs: 15 * 60_000 },
  /** Bookings and form submissions: 10 per minute. */
  write: { limit: 10, windowMs: 60_000, blockMs: 5 * 60_000 },
  /** Public search / read endpoints: 60 per minute. */
  read: { limit: 60, windowMs: 60_000, blockMs: 60_000 },
} satisfies Record<string, RateRule>;

export function clientIp(request: Request): string {
  const h = request.headers;
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Returns remaining cool-down in seconds when the caller must be throttled. */
export function checkRateLimit(key: string, rule: RateRule): number | null {
  const now = Date.now();
  if (buckets.size > MAX_KEYS) buckets.clear();

  const bucket = buckets.get(key) ?? { hits: [], blockedUntil: 0 };
  if (bucket.blockedUntil > now) {
    buckets.set(key, bucket);
    return Math.ceil((bucket.blockedUntil - now) / 1000);
  }

  bucket.hits = bucket.hits.filter((t) => now - t < rule.windowMs);
  bucket.hits.push(now);

  if (bucket.hits.length > rule.limit) {
    // exponential back-off: each further breach doubles the cool-down
    const overflow = bucket.hits.length - rule.limit;
    bucket.blockedUntil = now + rule.blockMs * Math.min(2 ** (overflow - 1), 8);
    buckets.set(key, bucket);
    return Math.ceil((bucket.blockedUntil - now) / 1000);
  }

  buckets.set(key, bucket);
  return null;
}

const AUTH_HINTS = ["auth", "signin", "signup", "login", "register", "password", "reset", "invite"];
const WRITE_HINTS = ["book", "appointment", "create", "insert", "submit", "apply", "purchase", "upload", "comment", "reply", "report", "review", "register"];

/** Picks a rule from the request method and target path. */
export function ruleForRequest(request: Request, pathname: string): RateRule {
  const p = pathname.toLowerCase();
  const target = (new URL(request.url).searchParams.get("_serverFnId") ?? "") + p;
  if (AUTH_HINTS.some((h) => target.includes(h))) return RATE_RULES.auth;
  // Translation is a read-only presentation request; one language switch can translate a whole screen.
  if (target.includes("translate")) return RATE_RULES.read;
  if (request.method !== "GET" || WRITE_HINTS.some((h) => target.includes(h))) return RATE_RULES.write;
  return RATE_RULES.read;
}

export function tooManyRequests(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: "Per daug užklausų. Pabandykite vėliau.", retryAfter }),
    {
      status: 429,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "retry-after": String(retryAfter),
        ...securityHeaders(),
      },
    },
  );
}
