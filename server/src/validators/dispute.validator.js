// src/validators/dispute.validator.js
import Joi from "joi";
import { objectIdSchema, paginationSchema } from "./common.validator.js";

/**
 * Dispute Validation Schemas
 */

// Create dispute validation
export const createDisputeSchema = Joi.object({
    tradeId: objectIdSchema.required().messages({
        "any.required": "Trade ID is required",
    }),
    reason: Joi.string()
        .valid(
            "payment_not_received",
            "payment_received_incorrect_amount",
            "buyer_not_responding",
            "seller_not_responding",
            "crypto_not_released",
            "fraud_suspicious_activity",
            "other"
        )
        .required()
        .messages({
            "any.only": "Invalid dispute reason",
            "any.required": "Dispute reason is required",
        }),
    description: Joi.string().min(20).max(1000).trim().required().messages({
        "string.empty": "Description is required",
        "string.min": "Description must be at least 20 characters",
        "string.max": "Description cannot exceed 1000 characters",
        "any.required": "Description is required",
    }),
    evidence: Joi.array().items(Joi.string().uri()).max(10).optional().messages({
        "array.max": "Maximum 10 evidence files allowed",
    }),
});

// Assign dispute validation
export const assignDisputeSchema = Joi.object({
    assignedTo: objectIdSchema.required().messages({
        "any.required": "Support agent ID is required",
    }),
    priority: Joi.string().valid("low", "medium", "high", "critical").default("medium"),
    notes: Joi.string().max(500).trim().optional().allow(""),
});

// Resolve dispute validation
export const resolveDisputeSchema = Joi.object({
    resolution: Joi.string()
        .valid(
            "refund_buyer",
            "release_to_seller",
            "partial_refund",
            "no_action",
            "escalated"
        )
        .required()
        .messages({
            "any.only": "Invalid resolution type",
            "any.required": "Resolution is required",
        }),
    resolutionNotes: Joi.string().min(20).max(1000).trim().required().messages({
        "string.empty": "Resolution notes are required",
        "string.min": "Resolution notes must be at least 20 characters",
        "any.required": "Resolution notes are required",
    }),
    refundAmount: Joi.number().positive().precision(2).when("resolution", {
        is: Joi.string().valid("refund_buyer", "partial_refund"),
        then: Joi.required(),
        otherwise: Joi.optional(),
    }).messages({
        "any.required": "Refund amount is required for refund resolutions",
    }),
});

// Update dispute status validation
export const updateDisputeStatusSchema = Joi.object({
    status: Joi.string()
        .valid(
            "open",
            "in_review",
            "awaiting_evidence",
            "under_investigation",
            "resolved",
            "closed"
        )
        .required()
        .messages({
            "any.only": "Invalid dispute status",
            "any.required": "Status is required",
        }),
    notes: Joi.string().max(500).trim().optional().allow(""),
});

// Add dispute comment validation
export const addDisputeCommentSchema = Joi.object({
    comment: Joi.string().min(10).max(1000).trim().required().messages({
        "string.empty": "Comment is required",
        "string.min": "Comment must be at least 10 characters",
        "any.required": "Comment is required",
    }),
    isInternal: Joi.boolean().default(false),
});

// Get disputes query validation
export const getDisputesQuerySchema = Joi.object({
    status: Joi.string()
        .valid("open", "in_review", "awaiting_evidence", "under_investigation", "resolved", "closed")
        .optional(),
    priority: Joi.string().valid("low", "medium", "high", "critical").optional(),
    assignedTo: objectIdSchema.optional(),
    reason: Joi.string().optional(),
    ...paginationSchema.describe().keys,
});

// Dispute ID param validation
export const disputeIdParamSchema = Joi.object({
    id: objectIdSchema.required().messages({
        "any.required": "Dispute ID is required",
    }),
});

export default {
    createDisputeSchema,
    assignDisputeSchema,
    resolveDisputeSchema,
    updateDisputeStatusSchema,
    addDisputeCommentSchema,
    getDisputesQuerySchema,
    disputeIdParamSchema,
};
