// src/validators/auth.validator.js
import Joi from "joi";

/**
 * Auth Validation Schemas
 */

// Register validation - Only email and password are required
export const registerSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        "string.empty": "Email is required",
        "string.email": "Please provide a valid email address",
    }),
    password: Joi.string().min(8).max(128).required()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"))
        .messages({
            "string.empty": "Password is required",
            "string.min": "Password must be at least 8 characters",
            "string.pattern.base": "Password must contain uppercase, lowercase, number and special character",
        }),
});

// Login validation
export const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        "string.empty": "Email is required",
        "string.email": "Please provide a valid email address",
    }),
    password: Joi.string().required().messages({
        "string.empty": "Password is required",
    }),
});

// OTP request validation
export const requestOtpSchema = Joi.object({
    emailOrMobile: Joi.string().required().messages({
        "string.empty": "Email or mobile number is required",
    }),
    otpType: Joi.string().valid("email", "sms").default("sms"),
});

// OTP verification validation
export const verifyOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        "string.empty": "Email is required",
        "string.email": "Please provide a valid email address",
    }),
    otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
        "string.empty": "OTP is required",
        "string.length": "OTP must be 6 digits",
        "string.pattern.base": "OTP must contain only numbers",
    }),
});

// Forgot password validation
export const forgotPasswordSchema = Joi.object({
    identifier: Joi.string().trim().required().messages({
        "string.empty": "Email or phone number is required",
        "any.required": "Email or phone number is required",
    }),
});

// Reset password validation with OTP
export const resetPasswordSchema = Joi.object({
    identifier: Joi.string().trim().required().messages({
        "string.empty": "Email or phone number is required",
        "any.required": "Email or phone number is required",
    }),
    otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
        "string.empty": "OTP is required",
        "string.length": "OTP must be 6 digits",
        "string.pattern.base": "OTP must contain only numbers",
    }),
    newPassword: Joi.string().min(8).max(128).required()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?\u0026])[A-Za-z\\d@$!%*?\u0026]"))
        .messages({
            "string.empty": "New password is required",
            "string.min": "Password must be at least 8 characters",
            "string.pattern.base": "Password must contain uppercase, lowercase, number and special character",
        }),
});

// Change password validation
export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required().messages({
        "string.empty": "Current password is required",
    }),
    newPassword: Joi.string().min(8).max(128).required()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"))
        .messages({
            "string.empty": "New password is required",
            "string.min": "Password must be at least 8 characters",
            "string.pattern.base": "Password must contain uppercase, lowercase, number and special character",
        }),
});



// Refresh Token validation (typically used in /api/auth/refresh-token endpoint)
export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string()
        .required()
        .trim()
        .messages({
            "string.empty": "Refresh token is required",
            "any.required": "Refresh token is required",
        }),
});

// Resend OTP validation
export const resendOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        "string.empty": "Email is required",
        "string.email": "Please provide a valid email address",
    }),
    otpType: Joi.string()
        .valid("email_verification", "password_reset")
        .default("email_verification")
        .optional()
        .messages({
            "any.only": 'otpType must be either "email_verification" or "password_reset"',
        }),
});

export default {
    registerSchema,
    loginSchema,
    requestOtpSchema,
    verifyOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    refreshTokenSchema,
    resendOtpSchema
};
