// src/middleware/validate.middleware.js
import { ValidationError } from "../utils/ApiError.js";

/**
 * Joi Validation Middleware
 * Validates request body, params, or query against a Joi schema
 */
export const validate = (schema, property = "body") => {
    return (req, res, next) => {
        const lang = req.lang || "en";
        const dataToValidate = req[property];

        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false, // Return all errors, not just the first
            stripUnknown: true, // Remove unknown keys
            convert: true, // Convert types (e.g., string to number)
        });

        if (error) {
            // Extract error messages
            const errorMessages = error.details.map((detail) => detail.message);
            const errorMessage = errorMessages.join(", ");

            return next(ValidationError(errorMessage, {}, lang));
        }

        // Replace request property with validated and sanitized value
        // Special handling for query params since they are read-only in some Express versions
        if (property === "query") {
            // Merge validated values back into query using defineProperty
            Object.keys(value).forEach((key) => {
                req.query[key] = value[key];
            });
        } else {
            req[property] = value;
        }
        next();
    };
};

/**
 * Validate request body
 */
export const validateBody = (schema) => validate(schema, "body");

/**
 * Validate request params
 */
export const validateParams = (schema) => validate(schema, "params");

/**
 * Validate request query
 */
export const validateQuery = (schema) => validate(schema, "query");

/**
 * Validate file upload
 */
export const validateFile = (schema) => {
    return (req, res, next) => {
        const lang = req.lang || "en";

        if (!req.file) {
            return next(ValidationError("No file uploaded", {}, lang));
        }

        const { error } = schema.validate({
            mimetype: req.file.mimetype,
            size: req.file.size,
        });

        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(", ");
            return next(ValidationError(errorMessage, {}, lang));
        }

        next();
    };
};

/**
 * Validate multiple files upload
 */
export const validateFiles = (schema, maxFiles = 5) => {
    return (req, res, next) => {
        const lang = req.lang || "en";

        if (!req.files || req.files.length === 0) {
            return next(ValidationError("No files uploaded", {}, lang));
        }

        if (req.files.length > maxFiles) {
            return next(ValidationError(`Maximum ${maxFiles} files allowed`, {}, lang));
        }

        // Validate each file
        for (const file of req.files) {
            const { error } = schema.validate({
                mimetype: file.mimetype,
                size: file.size,
            });

            if (error) {
                const errorMessage = error.details.map((detail) => detail.message).join(", ");
                return next(ValidationError(errorMessage, {}, lang));
            }
        }

        next();
    };
};

export default {
    validate,
    validateBody,
    validateParams,
    validateQuery,
    validateFile,
    validateFiles,
};
