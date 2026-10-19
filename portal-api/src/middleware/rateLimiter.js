// In-memory fixed-window rate limiter. Each limiter has its OWN store, so
// abusing one public endpoint no longer locks users out of login (audit B9).
// For multi-instance deployments, replace the Map with a shared store (Redis).
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = "Too many requests, please try again later",
} = {}) {
  const store = new Map();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, Math.min(windowMs, 60 * 1000));
  sweep.unref?.();

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
