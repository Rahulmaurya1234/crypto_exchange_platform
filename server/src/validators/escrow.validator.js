// src/validators/escrow.validator.js
import Joi from "joi";
import { objectIdSchema, paginationSchema } from "./common.validator.js";

/**
 * Escrow Validation Schemas
 */

// Create escrow transaction validation
export const createEscrowSchema = Joi.object({
    tradeId: objectIdSchema.required().messages({
        "any.required": "Trade ID is required",
    }),
    amount: Joi.number().positive().precision(8).required().messages({
        "number.base": "Amount must be a number",
        "number.positive": "Amount must be positive",
        "any.required": "Amount is required",
    }),
    cryptoType: Joi.string().valid("USDT", "BTC", "ETH").default("USDT"),
    buyerAddress: Joi.string().trim().required().messages({
        "string.empty": "Buyer address is required",
        "any.required": "Buyer address is required",
    }),
    sellerAddress: Joi.string().trim().required().messages({
        "string.empty": "Seller address is required",
        "any.required": "Seller address is required",
    }),
});

// Update transaction status validation
export const updateTransactionStatusSchema = Joi.object({
    status: Joi.string()
        .valid(
            "pending",
            "awaiting_deposit",
            "deposited",
            "locked",
            "released",
            "refunded",
            "disputed",
            "cancelled"
        )
        .required()
        .messages({
            "any.only": "Invalid transaction status",
            "any.required": "Status is required",
        }),
    transactionHash: Joi.string().trim().optional().allow(""),
    notes: Joi.string().max(500).trim().optional().allow(""),
});

// Update confirmations validation
export const updateConfirmationsSchema = Joi.object({
    confirmations: Joi.number().integer().min(0).required().messages({
        "number.base": "Confirmations must be a number",
        "number.min": "Confirmations cannot be negative",
        "any.required": "Confirmations count is required",
    }),
    transactionHash: Joi.string().trim().required().messages({
        "string.empty": "Transaction hash is required",
        "any.required": "Transaction hash is required",
    }),
});

// Release escrow validation
export const releaseEscrowSchema = Joi.object({
    releaseType: Joi.string().valid("full", "partial").default("full"),
    amount: Joi.number().positive().precision(8).when("releaseType", {
        is: "partial",
        then: Joi.required(),
        otherwise: Joi.optional(),
    }).messages({
        "any.required": "Amount is required for partial release",
    }),
    reason: Joi.string().max(500).trim().optional().allow(""),
    recipientAddress: Joi.string().trim().required().messages({
        "string.empty": "Recipient address is required",
        "any.required": "Recipient address is required",
    }),
});

// Refund escrow validation
export const refundEscrowSchema = Joi.object({
    refundType: Joi.string().valid("full", "partial").default("full"),
    amount: Joi.number().positive().precision(8).when("refundType", {
        is: "partial",
        then: Joi.required(),
        otherwise: Joi.optional(),
    }).messages({
        "any.required": "Amount is required for partial refund",
    }),
    reason: Joi.string().min(20).max(500).trim().required().messages({
        "string.empty": "Reason is required",
        "string.min": "Reason must be at least 20 characters",
        "any.required": "Reason is required",
    }),
});

// Get escrow transactions query validation
export const getEscrowQuerySchema = Joi.object({
    status: Joi.string()
        .valid("pending", "awaiting_deposit", "deposited", "locked", "released", "refunded", "disputed", "cancelled")
        .optional(),
    userId: objectIdSchema.optional(),
    tradeId: objectIdSchema.optional(),
    cryptoType: Joi.string().valid("USDT", "BTC", "ETH").optional(),
    minAmount: Joi.number().positive().optional(),
    maxAmount: Joi.number().positive().optional(),
    ...paginationSchema.describe().keys,
});

// Escrow transaction hash param validation
export const transactionHashParamSchema = Joi.object({
    hash: Joi.string().trim().required().messages({
        "string.empty": "Transaction hash is required",
        "any.required": "Transaction hash is required",
    }),
});

// Escrow ID param validation
export const escrowIdParamSchema = Joi.object({
    id: objectIdSchema.required().messages({
        "any.required": "Escrow transaction ID is required",
    }),
});

// User ID param validation
export const userIdParamSchema = Joi.object({
    userId: objectIdSchema.required().messages({
        "any.required": "User ID is required",
    }),
});

export default {
    createEscrowSchema,
    updateTransactionStatusSchema,
    updateConfirmationsSchema,
    releaseEscrowSchema,
    refundEscrowSchema,
    getEscrowQuerySchema,
    transactionHashParamSchema,
    escrowIdParamSchema,
    userIdParamSchema,
};
