// src/validators/analytics.validator.js
import Joi from "joi";
import { dateRangeSchema, objectIdSchema } from "./common.validator.js";

/**
 * Analytics Validation Schemas
 */

// Get analytics query validation
export const getAnalyticsQuerySchema = Joi.object({
    ...dateRangeSchema.describe().keys,
    period: Joi.string().valid("day", "week", "month", "quarter", "year", "custom").default("month"),
    metrics: Joi.array()
        .items(
            Joi.string().valid(
                "users",
                "trades",
                "volume",
                "revenue",
                "disputes",
                "kyc",
                "active_listings"
            )
        )
        .optional(),
});

// Get trade analytics validation
export const getTradeAnalyticsQuerySchema = Joi.object({
    ...dateRangeSchema.describe().keys,
    groupBy: Joi.string().valid("day", "week", "month").default("day"),
    cryptoType: Joi.string().valid("USDT", "BTC", "ETH").optional(),
    status: Joi.string()
        .valid("pending", "active", "completed", "cancelled", "disputed")
        .optional(),
});

// Get user analytics validation
export const getUserAnalyticsQuerySchema = Joi.object({
    ...dateRangeSchema.describe().keys,
    userType: Joi.string().valid("buyer", "seller", "both").optional(),
    kycStatus: Joi.string().valid("pending", "approved", "rejected").optional(),
    status: Joi.string().valid("active", "inactive", "suspended", "banned").optional(),
});

// Get revenue analytics validation
export const getRevenueAnalyticsQuerySchema = Joi.object({
    ...dateRangeSchema.describe().keys,
    groupBy: Joi.string().valid("day", "week", "month", "quarter").default("month"),
    revenueType: Joi.string().valid("fees", "premium", "all").default("all"),
});

// Get dispute analytics validation
export const getDisputeAnalyticsQuerySchema = Joi.object({
    ...dateRangeSchema.describe().keys,
    status: Joi.string()
        .valid("open", "in_review", "resolved", "closed")
        .optional(),
    reason: Joi.string().optional(),
});

// Get platform statistics validation
export const getPlatformStatsQuerySchema = Joi.object({
    period: Joi.string().valid("today", "week", "month", "year", "all").default("all"),
});

// Get user activity validation
export const getUserActivityQuerySchema = Joi.object({
    userId: objectIdSchema.optional(),
    activityType: Joi.string()
        .valid("login", "trade", "listing", "kyc", "dispute", "all")
        .default("all"),
    ...dateRangeSchema.describe().keys,
    limit: Joi.number().integer().min(1).max(100).default(50),
});

// Get top performers validation
export const getTopPerformersQuerySchema = Joi.object({
    metric: Joi.string()
        .valid("trade_volume", "trade_count", "rating", "response_time")
        .default("trade_volume"),
    period: Joi.string().valid("week", "month", "quarter", "year", "all").default("month"),
    limit: Joi.number().integer().min(1).max(100).default(10),
    userType: Joi.string().valid("buyer", "seller", "both").default("both"),
});

// Export report validation
export const exportReportSchema = Joi.object({
    reportType: Joi.string()
        .valid("trades", "users", "revenue", "disputes", "platform_stats")
        .required()
        .messages({
            "any.required": "Report type is required",
        }),
    format: Joi.string().valid("csv", "excel", "pdf").default("csv"),
    ...dateRangeSchema.describe().keys,
    filters: Joi.object().optional(),
});

// Get conversion metrics validation
export const getConversionMetricsQuerySchema = Joi.object({
    ...dateRangeSchema.describe().keys,
    funnel: Joi.string()
        .valid("registration", "kyc", "first_trade", "repeat_trade")
        .default("registration"),
});

export default {
    getAnalyticsQuerySchema,
    getTradeAnalyticsQuerySchema,
    getUserAnalyticsQuerySchema,
    getRevenueAnalyticsQuerySchema,
    getDisputeAnalyticsQuerySchema,
    getPlatformStatsQuerySchema,
    getUserActivityQuerySchema,
    getTopPerformersQuerySchema,
    exportReportSchema,
    getConversionMetricsQuerySchema,
};
