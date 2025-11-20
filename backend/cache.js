// cache.js
const NodeCache = require('node-cache');
const ttl = Number(process.env.CACHE_TTL_SECONDS || 900); // 15 min
const cache = new NodeCache({ stdTTL: ttl, checkperiod: Math.round(ttl/2) });

module.exports = {
  get: (key) => cache.get(key),
  set: (key, value) => cache.set(key, value),
  del: (key) => cache.del(key),
  flush: () => cache.flushAll()
};
