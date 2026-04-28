// src/config/rate-limit.config.js

/**
 * Rate Limiting Configuration
 * Different limits for different route types
 */
export const rateLimitConfig = {
    // Global API rate limit
    global: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: "Too many requests from this IP, please try again later.",
        standardHeaders: true,
        legacyHeaders: false,
    },

    // Authentication endpoints (stricter)
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts
        message: "Too many login attempts, please try again after 15 minutes.",
        skipSuccessfulRequests: true,
    },

    // OTP sending (very strict)
    otp: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 3, // 3 OTPs
        message: "Too many OTP requests, please try again after 5 minutes.",
    },

    // KYC submission
    kyc: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5, // 5 submissions
        message: "Too many KYC submissions, please try again later.",
    },

    // Listing creation
    listing: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20, // 20 listings per hour
        message: "Too many listing creations, please slow down.",
    },

    // Trade initiation
    trade: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // 10 trades
        message: "Too many trade initiations, please wait.",
    },

    // Chat messages
    chat: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 30, // 30 messages per minute
        message: "Too many messages sent, please slow down.",
    },

    // Payment proof upload
    payment: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // 10 uploads
        message: "Too many payment proof uploads, please wait.",
    },

    // Admin operations
    admin: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500, // Higher limit for admins
        message: "Admin rate limit exceeded.",
    },
};

export default rateLimitConfig;
