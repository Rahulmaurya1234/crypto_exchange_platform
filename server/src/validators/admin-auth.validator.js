// src/validators/admin-auth.validator.js
import Joi from "joi";

/**
 * Admin Auth Validation Schemas
 */

// Admin Register validation - Email and password required
export const adminRegisterSchema = Joi.object({
    email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
            "string.empty": "Email is required",
            "string.email": "Please provide a valid email address",
            "any.required": "Email is required",
        }),
    password: Joi.string()
        .min(8)
        .max(128)
        .required()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"))
        .messages({
            "string.empty": "Password is required",
            "string.min": "Password must be at least 8 characters",
            "string.max": "Password must not exceed 128 characters",
            "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
            "any.required": "Password is required",
        }),
});

// Admin Login validation
export const adminLoginSchema = Joi.object({
    email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
            "string.empty": "Email is required",
            "string.email": "Please provide a valid email address",
            "any.required": "Email is required",
        }),
    password: Joi.string()
        .required()
        .messages({
            "string.empty": "Password is required",
            "any.required": "Password is required",
        }),
});

// Refresh Token validation
export const adminRefreshTokenSchema = Joi.object({
    refreshToken: Joi.string()
        .required()
        .trim()
        .messages({
            "string.empty": "Refresh token is required",
            "any.required": "Refresh token is required",
        }),
});

export default {
    adminRegisterSchema,
    adminLoginSchema,
    adminRefreshTokenSchema,
};
