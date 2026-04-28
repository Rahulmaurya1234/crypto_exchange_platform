// src/validators/trade.validator.js
import Joi from "joi";

/**
 * Trade Validation Schemas
 */

// Initiate trade validation
export const initiateTradeSchema = Joi.object({
    chatId: Joi.string().hex().length(24).required().messages({
        "string.empty": "Chat ID is required",
        "string.hex": "Invalid chat ID format",
        "any.required": "Chat ID is required. Please create a chat first.",
    }),
    listingId: Joi.string().hex().length(24).required().messages({
        "string.empty": "Listing ID is required",
        "string.hex": "Invalid listing ID format",
    }),
    cryptoAmount: Joi.number().positive().precision(2).required().messages({
        "number.base": "Crypto amount must be a number",
        "number.positive": "Crypto amount must be positive",
        "any.required": "Crypto amount is required",
    }),
    cryptoType: Joi.string().valid("USDT", "BTC", "ETH").default("USDT").messages({
        "any.only": "Invalid crypto type",
    }),
    networkName: Joi.string().trim().required().messages({
        "string.empty": "Network name is required",
    }),
    buyerWalletAddress: Joi.string().trim().required()
        .pattern(/^(0x)?[0-9a-fA-F]{40}$/)
        .messages({
            "string.empty": "Buyer wallet address is required",
            "string.pattern.base": "Please provide a valid Ethereum wallet address",
        }),
    paymentMethod: Joi.string().valid("upi", "imps", "neft", "rtgs", "bank_transfer").required().messages({
        "any.only": "Invalid payment method",
    }),
    isShareDocument: Joi.boolean().default(false).messages({
        "boolean.base": "isShareDocument must be a boolean value",
    }),
});

// Upload payment proof validation
export const uploadPaymentProofSchema = Joi.object({
    // Accept both 'transactionId' and 'utr' for backward compatibility
    transactionId: Joi.string().trim().optional().messages({
        "string.empty": "Transaction ID is required",
    }),
    utr: Joi.string().trim().optional().messages({
        "string.empty": "UTR is required",
    }),
    amount: Joi.number().positive().precision(2).required().messages({
        "number.base": "Amount must be a number",
        "number.positive": "Amount must be positive",
        "any.required": "Amount is required",
    }),
    bank: Joi.string().max(100).trim().optional().allow("").messages({
        "string.empty": "Bank name is required",
    }),
    proofUrl: Joi.string().uri().required().messages({
        "string.empty": "Payment proof image is required",
        "string.uri": "Please provide a valid image URL",
    }),
}).or('transactionId', 'utr').messages({
    "object.missing": "Either transactionId or utr is required",
});

// Confirm payment validation
export const confirmPaymentSchema = Joi.object({
    confirmed: Joi.boolean().required().messages({
        "any.required": "Payment confirmation is required",
    }),
    remarks: Joi.string().max(500).optional().allow(""),
});

// Cancel trade validation
export const cancelTradeSchema = Joi.object({
    reason: Joi.string().max(500).required().messages({
        "string.empty": "Cancellation reason is required",
    }),
});

// Create dispute validation
export const createDisputeSchema = Joi.object({
    reason: Joi.string().max(1000).required().messages({
        "string.empty": "Dispute reason is required",
    }),
    evidence: Joi.array().items(
        Joi.object({
            type: Joi.string().valid("screenshot", "document", "bank_statement", "other").required(),
            url: Joi.string().uri().required(),
            description: Joi.string().max(500).optional().allow(""),
        })
    ).min(1).optional(),
});

// Get trades query validation
export const getTradesQuerySchema = Joi.object({
    status: Joi.string().valid(
        "initiated", "pending_deposit", "escrow_locked", "pending_payment",
        "payment_proof_uploaded", "pending_confirmation", "completed", "cancelled", "disputed", "expired", "refunded"
    ).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

export default {
    initiateTradeSchema,
    uploadPaymentProofSchema,
    confirmPaymentSchema,
    cancelTradeSchema,
    createDisputeSchema,
    getTradesQuerySchema,
};
