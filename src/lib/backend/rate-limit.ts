import { createHmac } from "node:crypto";

export type RateLimitOptions = {
  scope: string;
  limit: number;
  windowMs: number;
  now?: number;
};

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSeconds: number; resetAt: number };

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export const RATE_LIMITS = {
  createSession: { scope: "sessions:create", limit: 20, windowMs: 60 * 60 * 1000 },
  updateSession: { scope: "sessions:update", limit: 80, windowMs: 5 * 60 * 1000 },
  writeAnswer: { scope: "answers:write", limit: 500, windowMs: 5 * 60 * 1000 },
  deleteAnswer: { scope: "answers:delete", limit: 120, windowMs: 5 * 60 * 1000 },
  writePageTiming: { scope: "page-timings:write", limit: 160, windowMs: 5 * 60 * 1000 },
  withdrawSession: { scope: "sessions:withdraw", limit: 20, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, Omit<RateLimitOptions, "now">>;

export function checkRateLimit(
  request: Request,
  options: RateLimitOptions,
): RateLimitResult {
  const key = rateLimitKey(request.headers, options.scope);
  return consumeRateLimit(key, options);
}

export function consumeRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = options.now ?? Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      ok: true,
      remaining: options.limit - 1,
      resetAt: now + options.windowMs,
    };
  }

  if (existing.count >= options.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;

  return {
    ok: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

export function resetRateLimitForTests() {
  buckets.clear();
}

function rateLimitKey(headers: Headers, scope: string) {
  const coarseAddress = coarseClientAddress(headers);
  const secret = process.env.RATE_LIMIT_SECRET?.trim() || "llm-survey-dev-rate-limit-secret";

  return createHmac("sha256", secret)
    .update(`${scope}:${coarseAddress}`)
    .digest("hex");
}

function coarseClientAddress(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address =
    forwardedFor ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    "unknown";

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(address)) {
    return address.replace(/\.\d{1,3}$/, ".0");
  }

  if (address.includes(":")) {
    return `${address.split(":").slice(0, 4).join(":")}::`;
  }

  return address;
}
