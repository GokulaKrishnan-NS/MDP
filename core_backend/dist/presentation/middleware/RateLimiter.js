"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
// In a real implementation this would use ioredis
// import Redis from 'ioredis';
// const redis = new Redis();
// Stub for rate limiter
const mockRedisStore = new Map();
const rateLimiter = (limit, windowMs) => {
    return async (req, res, next) => {
        try {
            // Using IP for rate limiting; in production, use user_id + IP combination
            const key = `rate_limit:${req.ip}`;
            const now = Date.now();
            let timestamps = mockRedisStore.get(key) || [];
            // Remove timestamps outside window bounds
            timestamps = timestamps.filter(ts => (now - ts) < windowMs);
            if (timestamps.length >= limit) {
                res.status(429).json({ error: 'Too Many Requests' });
                return;
            }
            timestamps.push(now);
            mockRedisStore.set(key, timestamps);
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.rateLimiter = rateLimiter;
