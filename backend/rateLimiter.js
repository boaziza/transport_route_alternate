// rateLimiter.js
// Basic token bucket limiter to protect from >40/minute hitting ORS
const buckets = {}; // per IP or per user key

function getBucket(key, capacity = 40, refillSeconds = 60) {
  if (!buckets[key]) {
    buckets[key] = {
      tokens: capacity,
      capacity,
      lastRefill: Date.now()
    };
  }
  // refill
  const now = Date.now();
  const elapsed = (now - buckets[key].lastRefill) / 1000;
  const refillTokens = (elapsed / refillSeconds) * capacity;
  if (refillTokens > 0) {
    buckets[key].tokens = Math.min(capacity, buckets[key].tokens + refillTokens);
    buckets[key].lastRefill = now;
  }
  return buckets[key];
}

function allow(key) {
  const bucket = getBucket(key);
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }
  return false;
}

module.exports = { allow };
