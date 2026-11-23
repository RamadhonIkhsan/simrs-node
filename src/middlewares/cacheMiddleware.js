const NodeCache = require('node-cache');

// Initialize NodeCache instance (default TTL: 60s, checkperiod: 120s)
const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  useClones: false,
});

/**
 * Generates a stable, sorted cache key based on URL, query params, and user role
 */
const generateCacheKey = (req) => {
  const urlPath = req.originalUrl.split('?')[0];
  const queryKeys = Object.keys(req.query || {}).sort();
  const sortedQuery = queryKeys.map((k) => `${k}=${req.query[k]}`).join('&');
  const userRole = req.user?.role_name ? String(req.user.role_name).trim().toLowerCase() : 'anonymous';

  return `cache:${urlPath}:${sortedQuery}:${userRole}`;
};

/**
 * Cache middleware for Express
 *
 * @param {number} [duration=60] - Cache TTL in seconds
 * @returns {import('express').RequestHandler}
 */
const cacheMiddleware = (duration = 60) => (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const cacheKey = generateCacheKey(req);
  const cachedResponse = cache.get(cacheKey);

  if (cachedResponse) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cachedResponse);
  }

  res.setHeader('X-Cache', 'MISS');

  // Intercept res.json to store the result in cache upon successful 200 response
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200) {
      cache.set(cacheKey, body, duration);
    }
    return originalJson(body);
  };

  return next();
};

/**
 * Flush all cached items (useful for tests or cache busting)
 */
const flushCache = () => {
  cache.flushAll();
};

module.exports = {
  cache,
  cacheMiddleware,
  flushCache,
};
