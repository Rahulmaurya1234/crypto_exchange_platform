// src/validators/wallet.validator.js
import Joi from "joi";

/**
 * Wallet Validation Schemas
 */

// Update crypto wallet address validation
export const updateCryptoAddressSchema = Joi.object({
    cryptoWalletAddress: Joi.string().trim().required()
        .pattern(/^(0x)?[0-9a-fA-F]{40}$/) // Ethereum address format
        .messages({
            "string.empty": "Wallet address is required",
            "string.pattern.base": "Please provide a valid Ethereum wallet address",
            "any.required": "Wallet address is required",
        }),
    network: Joi.string().valid("ethereum", "bsc", "polygon").default("ethereum").messages({
        "any.only": "Invalid network. Must be ethereum, bsc, or polygon",
    }),
});

// Update bank details validation
export const updateBankDetailsSchema = Joi.object({
    accountHolderName: Joi.string().min(2).max(100).trim().required().messages({
        "string.empty": "Account holder name is required",
        "string.min": "Account holder name must be at least 2 characters",
        "any.required": "Account holder name is required",
    }),
    accountNumber: Joi.string().min(8).max(20).trim().required().messages({
        "string.empty": "Account number is required",
        "string.min": "Account number must be at least 8 characters",
        "any.required": "Account number is required",
    }),
    ifscCode: Joi.string().length(11).uppercase().trim().required().messages({
        "string.empty": "IFSC code is required",
        "string.length": "IFSC code must be exactly 11 characters",
        "any.required": "IFSC code is required",
    }),
    bankName: Joi.string().max(100).trim().required().messages({
        "string.empty": "Bank name is required",
        "any.required": "Bank name is required",
    }),
    branchName: Joi.string().max(100).trim().optional().allow(""),
});

// Add UPI ID validation
export const addUpiIdSchema = Joi.object({
    upiId: Joi.string()
        .pattern(/^[\w.-]+@[\w.-]+$/)
        .lowercase()
        .trim()
        .required()
        .messages({
            "string.empty": "UPI ID is required",
            "string.pattern.base": "Please provide a valid UPI ID (e.g., username@bank)",
            "any.required": "UPI ID is required",
        }),
    isDefault: Joi.boolean().default(false),
});

// Update payment method priority validation
export const updatePaymentMethodPrioritySchema = Joi.object({
    paymentMethods: Joi.array()
        .items(
            Joi.object({
                type: Joi.string().valid("upi", "bank", "crypto").required(),
                id: Joi.string().required(),
                priority: Joi.number().integer().min(1).required(),
            })
        )
        .min(1)
        .required()
        .messages({
            "array.min": "At least one payment method is required",
            "any.required": "Payment methods are required",
        }),
});

export default {
    updateCryptoAddressSchema,
    updateBankDetailsSchema,
    addUpiIdSchema,
    updatePaymentMethodPrioritySchema,
};
