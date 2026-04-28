// src/validators/chat.validator.js
import Joi from "joi";

/**
 * Chat & Message Validation Schemas
 */

// Send message validation
export const sendMessageSchema = Joi.object({
    chatId: Joi.string().hex().length(24).required().messages({
        "string.empty": "Chat ID is required",
        "string.hex": "Invalid chat ID format",
    }),
    content: Joi.string().min(1).max(2000).trim().required().messages({
        "string.empty": "Message content is required",
        "string.max": "Message cannot exceed 2000 characters",
    }),
    messageType: Joi.string().valid("text", "image", "file", "action").default("text"),
    attachments: Joi.array().items(
        Joi.object({
            url: Joi.string().uri().required(),
            type: Joi.string().valid("image", "document", "payment_proof").required(),
            filename: Joi.string().optional(),
            size: Joi.number().integer().positive().optional(),
        })
    ).max(5).optional().messages({
        "array.max": "Maximum 5 attachments allowed per message",
    }),
});

// Get messages query validation
export const getMessagesQuerySchema = Joi.object({
    chatId: Joi.string().hex().length(24).required().messages({
        "string.empty": "Chat ID is required",
        "string.hex": "Invalid chat ID format",
    }),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    before: Joi.date().optional(), // Load messages before this date
});

// Mark messages as read validation
export const markAsReadSchema = Joi.object({
    chatId: Joi.string().hex().length(24).required().messages({
        "string.empty": "Chat ID is required",
        "string.hex": "Invalid chat ID format",
    }),
    messageIds: Joi.array().items(
        Joi.string().hex().length(24)
    ).optional(),
});

export default {
    sendMessageSchema,
    getMessagesQuerySchema,
    markAsReadSchema,
};
