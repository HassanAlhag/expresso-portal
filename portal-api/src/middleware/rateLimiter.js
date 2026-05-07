// In-memory sliding-window rate limiter. For multi-process deployments,
// replace the Map with a shared store (e.g. Redis via ioredis).
const store = new Map();

export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = "Too many requests, please try again later",
} = {}) {
  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", retryAfter);
      return res.status(429).json({ ok: false, message });
    }

    return next();
  };
}
