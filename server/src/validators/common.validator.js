// src/validators/common.validator.js
import Joi from "joi";

/**
 * Common Validation Schemas & Helpers
 */

// MongoDB ObjectId validation
export const objectIdSchema = Joi.string().hex().length(24).messages({
    "string.hex": "Invalid ID format",
    "string.length": "Invalid ID length",
});

// Pagination validation
export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().optional(),
    order: Joi.string().valid("asc", "desc").default("desc"),
});

// Date range validation
export const dateRangeSchema = Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref("startDate")).optional().messages({
        "date.min": "End date must be after start date",
    }),
});

// File upload validation helper
export const fileUploadSchema = Joi.object({
    mimetype: Joi.string().valid(
        "image/jpeg", "image/jpg", "image/png", "image/gif",
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ).required().messages({
        "any.only": "File type not supported",
    }),
    size: Joi.number().max(10 * 1024 * 1024).required().messages({
        "number.max": "File size cannot exceed 10MB",
    }),
});

// Search/filter validation
export const searchSchema = Joi.object({
    query: Joi.string().min(1).max(200).trim().optional(),
    filters: Joi.object().optional(),
    ...paginationSchema.describe().keys,
});

// ID param validation
export const idParamSchema = Joi.object({
    id: objectIdSchema.required(),
});

export default {
    objectIdSchema,
    paginationSchema,
    dateRangeSchema,
    fileUploadSchema,
    searchSchema,
    idParamSchema,
};
