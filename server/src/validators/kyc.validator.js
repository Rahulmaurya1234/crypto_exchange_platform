// src/validators/kyc.validator.js
import Joi from "joi";

/**
 * KYC Validation Schemas
 */

// Submit KYC validation
export const submitKycSchema = Joi.object({
    fullName: Joi.string().min(2).max(100).trim().required().messages({
        "string.empty": "Full name is required",
        "string.min": "Full name must be at least 2 characters",
    }),
    dateOfBirth: Joi.date().max("now").required().messages({
        "date.base": "Please provide a valid date of birth",
        "date.max": "Date of birth cannot be in the future",
    }),
    nationality: Joi.string().default("Indian"),
    bankDetails: Joi.object({
        accountNumber: Joi.string().trim().required().messages({
            "string.empty": "Bank account number is required",
        }),
        ifscCode: Joi.string().trim().uppercase().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required().messages({
            "string.empty": "IFSC code is required",
            "string.pattern.base": "Invalid IFSC code format",
        }),
        bankName: Joi.string().trim().required().messages({
            "string.empty": "Bank name is required",
        }),
        branch: Joi.string().trim().required().messages({
            "string.empty": "Branch name is required",
        }),
        accountHolderName: Joi.string().trim().required().messages({
            "string.empty": "Account holder name is required",
        }),
        bankProofUrl: Joi.string().uri().required().messages({
            "string.empty": "Bank proof document is required",
            "string.uri": "Please provide a valid bank proof URL",
        }),
    }).required().messages({
        "object.base": "Bank details are required",
    }),
    documents: Joi.array().items(
        Joi.object({
            documentType: Joi.string().valid("aadhaar", "pan", "passport", "driving_license", "selfie", "address_proof").required(),
            documentNumber: Joi.string().trim().optional().allow(""),
            frontImageUrl: Joi.string().uri().required().messages({
                "string.empty": "Document front image is required",
                "string.uri": "Please provide a valid image URL",
            }),
            backImageUrl: Joi.string().uri().optional().allow(""),
        })
    ).min(2).required().messages({
        "array.min": "At least 2 documents are required (ID + Selfie)",
    }),
});

// Admin review KYC validation
export const reviewKycSchema = Joi.object({
    action: Joi.string().valid("approve", "reject", "request_resubmission").required().messages({
        "any.only": "Invalid action. Must be approve, reject, or request_resubmission",
    }),
    level: Joi.string().valid("level_1", "level_2", "level_3").when("action", {
        is: "approve",
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    reason: Joi.string().max(1000).when("action", {
        is: Joi.string().valid("reject", "request_resubmission"),
        then: Joi.required(),
        otherwise: Joi.optional(),
    }).messages({
        "string.empty": "Reason is required for rejection or resubmission request",
    }),
    reviewNotes: Joi.string().max(2000).optional().allow(""),
});

export default {
    submitKycSchema,
    reviewKycSchema,
};
