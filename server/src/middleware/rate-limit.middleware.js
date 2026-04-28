// src/middleware/rate-limit.middleware.js
import rateLimit from "express-rate-limit";
import { getRedisClient } from "../config/redis.config.js";
import { rateLimitConfig } from "../config/rate-limit.config.js";
import { RateLimitError } from "../utils/ApiError.js";

/**
 * Redis Store for rate limiting (shared across instances)
 */
class RedisStore {
    constructor(options = {}) {
        this.prefix = options.prefix || "rl:";
        this.client = null;
        this.initClient();
    }

    async initClient() {
        try {
            this.client = getRedisClient();
        } catch (error) {
            console.error("Redis not available for rate limiting, falling back to memory store");
        }
    }

    async increment(key) {
        if (!this.client) return { totalHits: 1, resetTime: undefined };

        const fullKey = this.prefix + key;
        const hits = await this.client.incr(fullKey);

        if (hits === 1) {
            await this.client.expire(fullKey, 900); // 15 minutes default
        }

        const ttl = await this.client.ttl(fullKey);
        const resetTime = new Date(Date.now() + ttl * 1000);

        return {
            totalHits: hits,
            resetTime,
        };
    }

    async decrement(key) {
        if (!this.client) return;
        const fullKey = this.prefix + key;
        await this.client.decr(fullKey);
    }

    async resetKey(key) {
        if (!this.client) return;
        const fullKey = this.prefix + key;
        await this.client.del(fullKey);
    }
}

/**
 * Create rate limiter with custom config
 */
const createRateLimiter = (config) => {
    return rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        message: config.message,
        standardHeaders: config.standardHeaders !== false,
        legacyHeaders: config.legacyHeaders !== false,
        skipSuccessfulRequests: config.skipSuccessfulRequests || false,
        skipFailedRequests: config.skipFailedRequests || false,
        keyGenerator: (req) => {
            // Use user ID if authenticated, otherwise IP
            return req.user?._id?.toString() || req.ip;
        },
        handler: (req, res, next) => {
            const lang = req.lang || "en";
            next(new RateLimitError("RATE_001", {}, lang));
        },
        // Use Redis store if available
        store: process.env.REDIS_HOST ? new RedisStore({ prefix: config.prefix || "rl:" }) : undefined,
    });
};

/**
 * Global API rate limiter
 */
export const globalRateLimit = createRateLimiter({
    ...rateLimitConfig.global,
    prefix: "rl:global:",
});

/**
 * Auth rate limiter (login, register)
 */
export const authRateLimit = createRateLimiter({
    ...rateLimitConfig.auth,
    prefix: "rl:auth:",
});

/**
 * OTP rate limiter
 */
export const otpRateLimit = createRateLimiter({
    ...rateLimitConfig.otp,
    prefix: "rl:otp:",
});

/**
 * KYC submission rate limiter
 */
export const kycRateLimit = createRateLimiter({
    ...rateLimitConfig.kyc,
    prefix: "rl:kyc:",
});

/**
 * Listing creation rate limiter
 */
export const listingRateLimit = createRateLimiter({
    ...rateLimitConfig.listing,
    prefix: "rl:listing:",
});

/**
 * Trade initiation rate limiter
 */
export const tradeRateLimit = createRateLimiter({
    ...rateLimitConfig.trade,
    prefix: "rl:trade:",
});

/**
 * Chat message rate limiter
 */
export const chatRateLimit = createRateLimiter({
    ...rateLimitConfig.chat,
    prefix: "rl:chat:",
});

/**
 * Payment proof upload rate limiter
 */
export const paymentRateLimit = createRateLimiter({
    ...rateLimitConfig.payment,
    prefix: "rl:payment:",
});

/**
 * Admin operations rate limiter
 */
export const adminRateLimit = createRateLimiter({
    ...rateLimitConfig.admin,
    prefix: "rl:admin:",
});

/**
 * Custom rate limiter factory
 */
export const customRateLimit = (windowMs, max, message = "Too many requests") => {
    return createRateLimiter({
        windowMs,
        max,
        message,
        prefix: "rl:custom:",
    });
};

export default {
    globalRateLimit,
    authRateLimit,
    otpRateLimit,
    kycRateLimit,
    listingRateLimit,
    tradeRateLimit,
    chatRateLimit,
    paymentRateLimit,
    adminRateLimit,
    customRateLimit,
};
