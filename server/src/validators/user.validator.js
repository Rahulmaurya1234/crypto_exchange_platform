// src/validators/user.validator.js
import Joi from "joi";

/**
 * User/Profile Validation Schemas
 */

// Update profile validation - All fields are optional
export const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).max(100).trim().optional().messages({
        "string.min": "Name must be at least 2 characters",
        "string.max": "Name cannot exceed 100 characters",
    }),
    mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
        "string.pattern.base": "Please provide a valid 10-digit mobile number",
    }),
    altMobileNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().allow("").messages({
        "string.pattern.base": "Please provide a valid 10-digit alternate mobile number",
    }),
    gender: Joi.string().valid("male", "female", "other", "prefer_not_to_say").optional().messages({
        "any.only": "Please select a valid gender option",
    }),
    address: Joi.string().max(255).trim().optional().allow("").messages({
        "string.max": "Address cannot exceed 255 characters",
    }),
    city: Joi.string().max(80).trim().optional().allow("").messages({
        "string.max": "City cannot exceed 80 characters",
    }),
    state: Joi.string().max(80).trim().optional().allow("").messages({
        "string.max": "State cannot exceed 80 characters",
    }),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).optional().allow("").messages({
        "string.pattern.base": "Please provide a valid 6-digit pincode",
    }),
    bio: Joi.string().max(500).optional().allow("").messages({
        "string.max": "Bio cannot exceed 500 characters",
    }),
    preferredLanguage: Joi.string().valid("en", "hi").optional().messages({
        "any.only": "Preferred language must be either 'en' or 'hi'",
    }),
});

// Update bank details validation
export const updateBankDetailsSchema = Joi.object({
    accountHolderName: Joi.string().min(2).max(100).trim().required().messages({
        "string.empty": "Account holder name is required",
    }),
    accountNumber: Joi.string().min(8).max(20).trim().required().messages({
        "string.empty": "Account number is required",
    }),
    ifscCode: Joi.string().length(11).uppercase().trim().required().messages({
        "string.empty": "IFSC code is required",
        "string.length": "IFSC code must be 11 characters",
    }),
    bankName: Joi.string().max(100).trim().required().messages({
        "string.empty": "Bank name is required",
    }),
    upiId: Joi.string().email().lowercase().trim().optional().allow(""),
});

// Update wallet address validation
export const updateWalletAddressSchema = Joi.object({
    cryptoWalletAddress: Joi.string().trim().required()
        .pattern(/^(0x)?[0-9a-fA-F]{40}$/) // Ethereum address format
        .messages({
            "string.empty": "Wallet address is required",
            "string.pattern.base": "Please provide a valid Ethereum wallet address",
        }),
});

// Add review validation
export const addReviewSchema = Joi.object({
    userId: Joi.string().hex().length(24).required().messages({
        "string.empty": "User ID is required",
        "string.hex": "Invalid user ID format",
    }),
    tradeId: Joi.string().hex().length(24).required().messages({
        "string.empty": "Trade ID is required",
        "string.hex": "Invalid trade ID format",
    }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
        "number.base": "Rating must be a number",
        "number.min": "Rating must be at least 1",
        "number.max": "Rating cannot exceed 5",
    }),
    comment: Joi.string().max(500).trim().optional().allow(""),
});

// Admin update user status validation
export const updateUserStatusSchema = Joi.object({
    status: Joi.string().valid("active", "inactive", "suspended", "banned").required().messages({
        "any.only": "Invalid status value",
    }),
    reason: Joi.string().max(500).when("status", {
        is: Joi.string().valid("suspended", "banned"),
        then: Joi.required(),
        otherwise: Joi.optional(),
    }).messages({
        "string.empty": "Reason is required for suspension or ban",
    }),
});

// Admin update user role validation
export const updateUserRoleSchema = Joi.object({
    role: Joi.string().valid("buyer", "seller", "instant_seller", "support", "support_manager", "admin").required().messages({
        "any.only": "Invalid role value",
    }),
});

export default {
    updateProfileSchema,
    updateBankDetailsSchema,
    updateWalletAddressSchema,
    addReviewSchema,
    updateUserStatusSchema,
    updateUserRoleSchema,
};
