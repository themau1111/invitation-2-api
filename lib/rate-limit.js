const buckets = new Map();

function clientKey(req, scope) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "unknown";
  return `${scope}:${ip}`;
}

function checkRateLimit(req, scope, windowMs, maxRequests) {
  const now = Date.now();
  const key = clientKey(req, scope);
  const previous = buckets.get(key);
  const active = previous && previous.resetAt > now ? previous : { count: 0, resetAt: now + windowMs };
  active.count += 1;
  buckets.set(key, active);

  return {
    allowed: active.count <= maxRequests,
    retryAfterSeconds: Math.max(1, Math.ceil((active.resetAt - now) / 1000)),
  };
}

module.exports = { checkRateLimit };
