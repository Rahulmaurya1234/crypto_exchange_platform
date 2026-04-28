// src/validators/profile.validator.js
import Joi from "joi";
import { objectIdSchema } from "./common.validator.js";

/**
 * Profile Validation Schemas
 */

// Update profile validation
export const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).max(100).trim().optional(),
    bio: Joi.string().max(500).trim().optional().allow(""),
    address: Joi.string().max(255).trim().optional().allow(""),
    city: Joi.string().max(80).trim().optional().allow(""),
    state: Joi.string().max(80).trim().optional().allow(""),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).optional().allow("").messages({
        "string.pattern.base": "Please provide a valid 6-digit pincode",
    }),
    altMobileNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().allow(""),
    preferredLanguage: Joi.string().valid("en", "hi").optional(),
});

// Update preferences validation
export const updatePreferencesSchema = Joi.object({
    emailNotifications: Joi.boolean().optional(),
    smsNotifications: Joi.boolean().optional(),
    pushNotifications: Joi.boolean().optional(),
    tradeAlerts: Joi.boolean().optional(),
    marketingEmails: Joi.boolean().optional(),
    twoFactorAuth: Joi.boolean().optional(),
    preferredLanguage: Joi.string().valid("en", "hi", "es", "fr", "de").optional(),
    theme: Joi.string().valid("light", "dark", "auto").optional(),
});

// Get public profile by userId param validation
export const userIdParamSchema = Joi.object({
    userId: objectIdSchema.required().messages({
        "any.required": "User ID is required",
    }),
});

export default {
    updateProfileSchema,
    updatePreferencesSchema,
    userIdParamSchema,
};
