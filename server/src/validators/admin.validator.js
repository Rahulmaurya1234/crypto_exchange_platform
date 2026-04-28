// src/validators/admin.validator.js
import Joi from "joi";
import { objectIdSchema, paginationSchema } from "./common.validator.js";

/**
 * Admin Validation Schemas
 */

// Update user status validation
export const updateUserStatusSchema = Joi.object({
    status: Joi.string()
        .valid("active", "inactive", "suspended", "banned")
        .required()
        .messages({
            "any.only": "Invalid status value",
            "any.required": "Status is required",
        }),
    reason: Joi.string().min(10).max(500).when("status", {
        is: Joi.string().valid("suspended", "banned"),
        then: Joi.required(),
        otherwise: Joi.optional(),
    }).messages({
        "string.empty": "Reason is required for suspension or ban",
        "string.min": "Reason must be at least 10 characters",
        "any.required": "Reason is required for suspension or ban",
    }),
    duration: Joi.number().integer().positive().when("status", {
        is: "suspended",
        then: Joi.optional(),
        otherwise: Joi.forbidden(),
    }).messages({
        "any.unknown": "Duration is only applicable for suspensions",
    }),
});

// Update user role validation
export const updateUserRoleSchema = Joi.object({
    role: Joi.string()
        .valid("buyer", "seller", "instant_seller", "support", "support_manager", "admin")
        .required()
        .messages({
            "any.only": "Invalid role value",
            "any.required": "Role is required",
        }),
    notes: Joi.string().max(500).trim().optional().allow(""),
});

// Update KYC status validation (admin)
export const updateKycStatusSchema = Joi.object({
    status: Joi.string()
        .valid("pending", "under_review", "approved", "rejected")
        .required()
        .messages({
            "any.only": "Invalid KYC status",
            "any.required": "Status is required",
        }),
    rejectionReason: Joi.string().min(20).max(500).when("status", {
        is: "rejected",
        then: Joi.required(),
        otherwise: Joi.optional(),
    }).messages({
        "string.min": "Rejection reason must be at least 20 characters",
        "any.required": "Rejection reason is required when rejecting KYC",
    }),
    notes: Joi.string().max(1000).trim().optional().allow(""),
});

// Update platform settings validation
export const updatePlatformSettingsSchema = Joi.object({
    feesPercentage: Joi.number().min(0).max(10).precision(2).optional().messages({
        "number.min": "Fee percentage cannot be negative",
        "number.max": "Fee percentage cannot exceed 10%",
    }),
    minTradeAmount: Joi.number().positive().precision(2).optional(),
    maxTradeAmount: Joi.number().positive().precision(2).optional(),
    maintenanceMode: Joi.boolean().optional(),
    allowNewRegistrations: Joi.boolean().optional(),
    kycRequired: Joi.boolean().optional(),
    minKycLevel: Joi.number().integer().min(0).max(3).optional(),
    supportedCryptos: Joi.array()
        .items(Joi.string().valid("USDT", "BTC", "ETH"))
        .optional(),
    supportedPaymentMethods: Joi.array()
        .items(Joi.string().valid("upi", "imps", "neft", "rtgs", "bank_transfer"))
        .optional(),
});

// Create admin user validation
export const createAdminUserSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        "string.empty": "Email is required",
        "string.email": "Please provide a valid email",
        "any.required": "Email is required",
    }),
    name: Joi.string().min(2).max(100).trim().required().messages({
        "string.empty": "Name is required",
        "string.min": "Name must be at least 2 characters",
        "any.required": "Name is required",
    }),
    mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
        "string.pattern.base": "Please provide a valid 10-digit mobile number",
        "any.required": "Mobile number is required",
    }),
    role: Joi.string()
        .valid("support", "support_manager", "admin")
        .required()
        .messages({
            "any.only": "Invalid role value",
            "any.required": "Role is required",
        }),
    permissions: Joi.array()
        .items(
            Joi.string().valid(
                "view_users",
                "manage_users",
                "view_trades",
                "manage_trades",
                "view_disputes",
                "manage_disputes",
                "view_kyc",
                "manage_kyc",
                "view_analytics",
                "manage_settings",
                "view_support",
                "manage_support"
            )
        )
        .optional(),
});

// Update admin permissions validation
export const updateAdminPermissionsSchema = Joi.object({
    permissions: Joi.array()
        .items(
            Joi.string().valid(
                "view_users",
                "manage_users",
                "view_trades",
                "manage_trades",
                "view_disputes",
                "manage_disputes",
                "view_kyc",
                "manage_kyc",
                "view_analytics",
                "manage_settings",
                "view_support",
                "manage_support"
            )
        )
        .min(1)
        .required()
        .messages({
            "array.min": "At least one permission is required",
            "any.required": "Permissions are required",
        }),
});

// Bulk user action validation
export const bulkUserActionSchema = Joi.object({
    userIds: Joi.array()
        .items(objectIdSchema)
        .min(1)
        .max(100)
        .required()
        .messages({
            "array.min": "At least one user ID is required",
            "array.max": "Maximum 100 users can be processed at once",
            "any.required": "User IDs are required",
        }),
    action: Joi.string()
        .valid("activate", "deactivate", "suspend", "verify_kyc", "send_notification")
        .required()
        .messages({
            "any.only": "Invalid action",
            "any.required": "Action is required",
        }),
    reason: Joi.string().max(500).trim().optional().allow(""),
});

// Get users query validation (admin)
export const getUsersQuerySchema = Joi.object({
    status: Joi.string().valid("active", "inactive", "suspended", "banned").optional(),
    role: Joi.string()
        .valid("buyer", "seller", "instant_seller", "support", "support_manager", "admin")
        .optional(),
    kycStatus: Joi.string().valid("pending", "under_review", "approved", "rejected").optional(),
    search: Joi.string().max(200).trim().optional(),
    verified: Joi.boolean().optional(),
    ...paginationSchema.describe().keys,
});

// User ID param validation
export const userIdParamSchema = Joi.object({
    userId: objectIdSchema.required().messages({
        "any.required": "User ID is required",
    }),
});

// Send system notification validation
export const sendSystemNotificationSchema = Joi.object({
    title: Joi.string().min(3).max(100).trim().required().messages({
        "string.empty": "Title is required",
        "string.min": "Title must be at least 3 characters",
        "any.required": "Title is required",
    }),
    message: Joi.string().min(10).max(500).trim().required().messages({
        "string.empty": "Message is required",
        "string.min": "Message must be at least 10 characters",
        "any.required": "Message is required",
    }),
    targetType: Joi.string().valid("all", "role", "specific_users").required().messages({
        "any.only": "Invalid target type",
        "any.required": "Target type is required",
    }),
    targetRole: Joi.string()
        .valid("buyer", "seller", "instant_seller")
        .when("targetType", {
            is: "role",
            then: Joi.required(),
            otherwise: Joi.forbidden(),
        }),
    targetUserIds: Joi.array()
        .items(objectIdSchema)
        .when("targetType", {
            is: "specific_users",
            then: Joi.required().min(1),
            otherwise: Joi.forbidden(),
        }),
    priority: Joi.string().valid("low", "medium", "high").default("medium"),
});

export default {
    updateUserStatusSchema,
    updateUserRoleSchema,
    updateKycStatusSchema,
    updatePlatformSettingsSchema,
    createAdminUserSchema,
    updateAdminPermissionsSchema,
    bulkUserActionSchema,
    getUsersQuerySchema,
    userIdParamSchema,
    sendSystemNotificationSchema,
};
