// src/validators/support.validator.js
import Joi from "joi";
import { objectIdSchema, paginationSchema } from "./common.validator.js";

/**
 * Support Ticket Validation Schemas
 */

// Create support ticket validation
export const createTicketSchema = Joi.object({
    subject: Joi.string().min(5).max(200).trim().required().messages({
        "string.empty": "Subject is required",
        "string.min": "Subject must be at least 5 characters",
        "string.max": "Subject cannot exceed 200 characters",
        "any.required": "Subject is required",
    }),
    category: Joi.string()
        .valid(
            "account",
            "kyc",
            "trade",
            "payment",
            "technical",
            "security",
            "feedback",
            "other"
        )
        .required()
        .messages({
            "any.only": "Invalid category",
            "any.required": "Category is required",
        }),
    priority: Joi.string().valid("low", "medium", "high").default("medium"),
    description: Joi.string().min(20).max(2000).trim().required().messages({
        "string.empty": "Description is required",
        "string.min": "Description must be at least 20 characters",
        "string.max": "Description cannot exceed 2000 characters",
        "any.required": "Description is required",
    }),
    attachments: Joi.array().items(Joi.string().uri()).max(5).optional().messages({
        "array.max": "Maximum 5 attachments allowed",
    }),
    relatedTradeId: objectIdSchema.optional(),
});

// Update ticket status validation
export const updateTicketStatusSchema = Joi.object({
    status: Joi.string()
        .valid("open", "in_progress", "waiting_customer", "resolved", "closed")
        .required()
        .messages({
            "any.only": "Invalid ticket status",
            "any.required": "Status is required",
        }),
    resolutionNotes: Joi.string().max(1000).trim().when("status", {
        is: "resolved",
        then: Joi.required(),
        otherwise: Joi.optional(),
    }).messages({
        "any.required": "Resolution notes are required when resolving a ticket",
    }),
});

// Assign ticket validation
export const assignTicketSchema = Joi.object({
    assignedTo: objectIdSchema.required().messages({
        "any.required": "Support agent ID is required",
    }),
    notes: Joi.string().max(500).trim().optional().allow(""),
});

// Add ticket reply validation
export const addTicketReplySchema = Joi.object({
    message: Joi.string().min(10).max(2000).trim().required().messages({
        "string.empty": "Message is required",
        "string.min": "Message must be at least 10 characters",
        "string.max": "Message cannot exceed 2000 characters",
        "any.required": "Message is required",
    }),
    attachments: Joi.array().items(Joi.string().uri()).max(3).optional().messages({
        "array.max": "Maximum 3 attachments allowed per reply",
    }),
    isInternal: Joi.boolean().default(false),
});

// Update ticket priority validation
export const updateTicketPrioritySchema = Joi.object({
    priority: Joi.string().valid("low", "medium", "high", "critical").required().messages({
        "any.only": "Invalid priority level",
        "any.required": "Priority is required",
    }),
    reason: Joi.string().max(500).trim().optional().allow(""),
});

// Get tickets query validation
export const getTicketsQuerySchema = Joi.object({
    status: Joi.string()
        .valid("open", "in_progress", "waiting_customer", "resolved", "closed")
        .optional(),
    category: Joi.string()
        .valid("account", "kyc", "trade", "payment", "technical", "security", "feedback", "other")
        .optional(),
    priority: Joi.string().valid("low", "medium", "high", "critical").optional(),
    assignedTo: objectIdSchema.optional(),
    userId: objectIdSchema.optional(),
    search: Joi.string().max(200).trim().optional(),
    ...paginationSchema.describe().keys,
});

// Ticket ID param validation
export const ticketIdParamSchema = Joi.object({
    id: objectIdSchema.required().messages({
        "any.required": "Ticket ID is required",
    }),
});

// Rate support validation
export const rateSupportSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required().messages({
        "number.base": "Rating must be a number",
        "number.min": "Rating must be at least 1",
        "number.max": "Rating cannot exceed 5",
        "any.required": "Rating is required",
    }),
    feedback: Joi.string().max(1000).trim().optional().allow(""),
});

export default {
    createTicketSchema,
    updateTicketStatusSchema,
    assignTicketSchema,
    addTicketReplySchema,
    updateTicketPrioritySchema,
    getTicketsQuerySchema,
    ticketIdParamSchema,
    rateSupportSchema,
};
