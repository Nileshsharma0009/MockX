const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000;
const LOGIN_LIMIT = 10;
const SIGNUP_LIMIT = 8;

export function createRateLimiter({ windowMs, limit, keyGenerator, clock = Date.now }) {
  const buckets = new Map();
  const makeKey = keyGenerator || ((req) => req.ip || req.socket?.remoteAddress || "unknown");
  const cleanupTimer = setInterval(() => {
    const now = clock();
    for (const [key, bucket] of buckets) {
      if (now - bucket.startedAt >= windowMs) buckets.delete(key);
    }
  }, Math.min(windowMs, 60_000));
  cleanupTimer.unref?.();

  const middleware = (req, res, next) => {
    const now = clock();
    const key = String(makeKey(req));
    let bucket = buckets.get(key);
    if (!bucket || now - bucket.startedAt >= windowMs) {
      bucket = { startedAt: now, count: 0 };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, limit - bucket.count);
    const resetSeconds = Math.max(1, Math.ceil((bucket.startedAt + windowMs - now) / 1000));
    res.set("RateLimit-Limit", String(limit));
    res.set("RateLimit-Remaining", String(remaining));
    res.set("RateLimit-Reset", String(resetSeconds));

    if (bucket.count > limit) {
      res.set("Retry-After", String(resetSeconds));
      return res.status(429).json({ message: "Too many authentication attempts. Please try again later." });
    }
    next();
  };

  middleware.reset = () => buckets.clear();
  return middleware;
}

export const loginRateLimit = createRateLimiter({ windowMs: LOGIN_WINDOW_MS, limit: LOGIN_LIMIT });
export const signupRateLimit = createRateLimiter({ windowMs: SIGNUP_WINDOW_MS, limit: SIGNUP_LIMIT });
