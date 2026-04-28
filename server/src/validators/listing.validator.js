// src/validators/listing.validator.js
import Joi from "joi";

/**
 * Listing Validation Schemas
 */

// Create listing validation
export const createListingSchema = Joi.object({
    cryptoType: Joi.string().valid("USDT", "BTC", "ETH").default("USDT"),
    networkName: Joi.string().required().default("Ethereum"),
    availableAmount: Joi.number().positive().precision(2).required().messages({
        "number.base": "Available amount must be a number",
        "number.positive": "Available amount must be positive",
        "any.required": "Available amount is required",
    }),
    pricePerUnit: Joi.number().positive().precision(2).required().messages({
        "number.base": "Price per unit must be a number",
        "number.positive": "Price per unit must be positive",
        "any.required": "Price per unit is required",
    }),
    priceType: Joi.string().valid("fixed", "market_plus").default("fixed"),
    marketPlusPercentage: Joi.number().min(-10).max(50).when("priceType", {
        is: "market_plus",
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    minTradeLimit: Joi.number().positive().precision(2).required().messages({
        "number.base": "Minimum trade limit must be a number",
        "number.positive": "Minimum trade limit must be positive",
        "any.required": "Minimum trade limit is required",
    }),
    maxTradeLimit: Joi.number().positive().precision(2).required()
        .greater(Joi.ref("minTradeLimit")).messages({
            "number.base": "Maximum trade limit must be a number",
            "number.positive": "Maximum trade limit must be positive",
            "number.greater": "Maximum trade limit must be greater than minimum trade limit",
            "any.required": "Maximum trade limit is required",
        }),
    paymentMethods: Joi.array().items(
        Joi.string().valid("upi", "imps", "neft", "rtgs", "bank_transfer")
    ).min(1).required().messages({
        "array.min": "At least one payment method is required",
    }),
    timeLimit: Joi.number().integer().min(15).max(120).default(30).messages({
        "number.min": "Time limit must be at least 15 minutes",
        "number.max": "Time limit cannot exceed 120 minutes",
    }),
    terms: Joi.string().max(1000).trim().optional().allow(""),
    instructions: Joi.string().max(1000).trim().optional().allow(""),
    autoReplyMessage: Joi.string().max(500).trim().optional().allow(""),
    expiresAt: Joi.date().greater("now").optional().messages({
        "date.greater": "Expiry date must be in the future",
    }),
});

// Update listing validation
export const updateListingSchema = Joi.object({
    pricePerUnit: Joi.number().positive().precision(2).optional(),
    marketPlusPercentage: Joi.number().min(-10).max(50).optional(),
    minTradeLimit: Joi.number().positive().precision(2).optional(),
    maxTradeLimit: Joi.number().positive().precision(2).optional(),
    paymentMethods: Joi.array().items(
        Joi.string().valid("upi", "imps", "neft", "rtgs", "bank_transfer")
    ).min(1).optional(),
    timeLimit: Joi.number().integer().min(15).max(120).optional(),
    terms: Joi.string().max(1000).trim().optional().allow(""),
    instructions: Joi.string().max(1000).trim().optional().allow(""),
    autoReplyMessage: Joi.string().max(500).trim().optional().allow(""),
    isAvailable: Joi.boolean().optional(),
});

// Search listings validation
export const searchListingsSchema = Joi.object({
    cryptoType: Joi.string().valid("USDT", "BTC", "ETH").optional(),
    networkName: Joi.string().optional(),
    minAmount: Joi.number().positive().optional(),
    maxAmount: Joi.number().positive().optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    paymentMethod: Joi.string().valid("upi", "imps", "neft", "rtgs", "bank_transfer").optional(),
    isInstantSeller: Joi.boolean().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

// ==================== INSTANT SELLER VALIDATORS ====================

// Calculate deposit validation
export const calculateDepositSchema = Joi.object({
    amount: Joi.number().positive().required().messages({
        "number.base": "Amount must be a number",
        "number.positive": "Amount must be positive",
        "any.required": "Amount is required",
    }),
    network: Joi.string().valid("ethereum", "polygon", "bsc", "tron").default("ethereum"),
});

// Create instant seller listing validation
export const createInstantSellerListingSchema = Joi.object({
    // Listing fields (same as regular listing)
    cryptoType: Joi.string().valid("USDT", "BTC", "ETH").default("USDT"),
    networkName: Joi.string().required().default("Ethereum"),
    availableAmount: Joi.number().positive().precision(2).required(),
    pricePerUnit: Joi.number().positive().precision(2).required(),
    priceType: Joi.string().valid("fixed", "market_plus").default("fixed"),
    marketPlusPercentage: Joi.number().min(-10).max(50).optional(),
    minTradeLimit: Joi.number().positive().precision(2).required(),
    maxTradeLimit: Joi.number().positive().precision(2).required()
        .greater(Joi.ref("minTradeLimit")),
    paymentMethods: Joi.array().items(
        Joi.string().valid("upi", "imps", "neft", "rtgs", "bank_transfer")
    ).min(1).required(),
    timeLimit: Joi.number().integer().min(15).max(120).default(30),
    terms: Joi.string().max(1000).trim().optional().allow(""),
    instructions: Joi.string().max(1000).trim().optional().allow(""),
    autoReplyMessage: Joi.string().max(500).trim().optional().allow(""),
    expiresAt: Joi.date().greater("now").optional(),

    // Deposit fields
    transactionHash: Joi.string().required().messages({
        "any.required": "Transaction hash is required",
    }),
    // totalDepositAmount: Joi.number().positive().required(),
    // originalAmount: Joi.number().positive().required(),
    // platformFeeUSDT: Joi.number().min(0).required(),
    // gasFeeUSDT: Joi.number().min(0).required(),
    // network: Joi.string().valid("ethereum", "polygon", "bsc", "tron").default("ethereum"),
    // gasFeeCalculation: Joi.object().optional(),
});

// Resubmit listing validation
export const resubmitListingSchema = Joi.object({
    newTransactionHash: Joi.string().required().messages({
        "any.required": "New transaction hash is required",
    }),
    comments: Joi.string().max(500).trim().optional().allow(""),
});

// Admin approve/reject deposit validation
export const approveDepositSchema = Joi.object({
    verified: Joi.boolean().required().messages({
        "any.required": "'verified' field is required (true for approve, false for reject)",
    }),
    rejectionReason: Joi.string().max(500).when("verified", {
        is: false,
        then: Joi.required(),
        otherwise: Joi.optional(),
    }).messages({
        "any.required": "Rejection reason is required when rejecting",
    }),
    canResubmit: Joi.boolean().default(true),
    notes: Joi.string().max(1000).trim().optional().allow(""),
});

export default {
    createListingSchema,
    updateListingSchema,
    searchListingsSchema,
    calculateDepositSchema,
    createInstantSellerListingSchema,
    resubmitListingSchema,
    approveDepositSchema,
};
