import { ApiError } from "./errors";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, opts: { limit: number; windowMs: number }) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return;
  }
  existing.count += 1;
  if (existing.count > opts.limit) {
    throw new ApiError("Demasiados intentos. Intenta más tarde.", 429, "RATE_LIMIT");
  }
}
