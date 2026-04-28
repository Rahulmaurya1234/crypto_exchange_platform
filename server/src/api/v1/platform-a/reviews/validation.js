import Joi from "joi";

/**
 * Validation schema for submitting a review
 */
export const reviewValidationSchema = Joi.object({
    rating: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .required()
        .messages({
            "number.base": "Rating must be a number",
            "number.integer": "Rating must be an integer",
            "number.min": "Rating must be at least 1",
            "number.max": "Rating must be at most 5",
            "any.required": "Rating is required"
        }),
    comment: Joi.string()
        .max(500)
        .trim()
        .allow("")
        .optional()
        .messages({
            "string.max": "Comment must not exceed 500 characters"
        })
});

/**
 * Validation schema for updating a review
 */
export const reviewUpdateValidationSchema = Joi.object({
    rating: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .required()
        .messages({
            "number.base": "Rating must be a number",
            "number.integer": "Rating must be an integer",
            "number.min": "Rating must be at least 1",
            "number.max": "Rating must be at most 5",
            "any.required": "Rating is required"
        }),
    comment: Joi.string()
        .max(500)
        .trim()
        .allow("")
        .optional()
        .messages({
            "string.max": "Comment must not exceed 500 characters"
        })
});

/**
 * Validation schema for review response
 */
export const reviewResponseValidationSchema = Joi.object({
    response: Joi.string()
        .max(500)
        .trim()
        .required()
        .messages({
            "string.base": "Response must be a string",
            "string.max": "Response must not exceed 500 characters",
            "string.empty": "Response cannot be empty",
            "any.required": "Response is required"
        })
});