// src/middleware/error.middleware.js
import ApiError from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { HTTP_STATUS } from "../constants/error-codes.js";

/**
 * Global error handling middleware
 * Catches all errors and sends standardized error response
 */
export const errorHandler = (err, req, res, next) => {
    let error = err;

    // Get language from request
    const lang = req.lang || "en";

    // Convert non-ApiError errors to ApiError
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        const message = error.message || "Internal Server Error";
        error = new ApiError(statusCode, message, {}, lang, false, error.stack);
    }

    // Log error
    if (error.statusCode >= 500) {
        logger.error("Server Error:", {
            errorCode: error.errorCode,
            message: error.message,
            statusCode: error.statusCode,
            stack: error.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userId: req.user?._id,
        });
    } else if (error.statusCode >= 400) {
        logger.warn("Client Error:", {
            errorCode: error.errorCode,
            message: error.message,
            statusCode: error.statusCode,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userId: req.user?._id,
        });
    }

    // Send error response
    res.status(error.statusCode).json(error.toJSON());
};

/**
 * Handle 404 Not Found errors
 */
export const notFoundHandler = (req, res, next) => {
    const lang = req.lang || "en";
    const error = new ApiError(
        HTTP_STATUS.NOT_FOUND,
        `Cannot ${req.method} ${req.originalUrl}`,
        {},
        lang
    );
    next(error);
};

/**
 * Handle mongoose validation errors
 */
export const mongooseValidationErrorHandler = (err, req, res, next) => {
    if (err.name === "ValidationError") {
        const lang = req.lang || "en";
        const errors = Object.values(err.errors).map((e) => e.message);
        const error = new ApiError(
            HTTP_STATUS.UNPROCESSABLE_ENTITY,
            errors.join(", "),
            {},
            lang
        );
        return next(error);
    }
    next(err);
};

/**
 * Handle mongoose cast errors (invalid ObjectId)
 */
export const mongooseCastErrorHandler = (err, req, res, next) => {
    if (err.name === "CastError") {
        const lang = req.lang || "en";
        const error = new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            `Invalid ${err.path}: ${err.value}`,
            {},
            lang
        );
        return next(error);
    }
    next(err);
};

/**
 * Handle mongoose duplicate key errors
 */
export const mongooseDuplicateKeyErrorHandler = (err, req, res, next) => {
    if (err.code === 11000) {
        const lang = req.lang || "en";
        const field = Object.keys(err.keyPattern)[0];
        const error = new ApiError(
            HTTP_STATUS.CONFLICT,
            `${field} already exists`,
            { field },
            lang
        );
        return next(error);
    }
    next(err);
};

/**
 * Handle JWT errors
 */
export const jwtErrorHandler = (err, req, res, next) => {
    if (err.name === "JsonWebTokenError") {
        const lang = req.lang || "en";
        const error = new ApiError(HTTP_STATUS.UNAUTHORIZED, "AUTH_003", {}, lang);
        return next(error);
    }
    if (err.name === "TokenExpiredError") {
        const lang = req.lang || "en";
        const error = new ApiError(HTTP_STATUS.UNAUTHORIZED, "AUTH_002", {}, lang);
        return next(error);
    }
    next(err);
};

/**
 * Handle multer file upload errors
 */
export const multerErrorHandler = (err, req, res, next) => {
    if (err.name === "MulterError") {
        const lang = req.lang || "en";
        let errorCode = "VAL_010";
        let params = {};

        if (err.code === "LIMIT_FILE_SIZE") {
            errorCode = "VAL_011";
            params = { size: process.env.MAX_FILE_SIZE_MB || 10 };
        }

        const error = new ApiError(HTTP_STATUS.BAD_REQUEST, errorCode, params, lang);
        return next(error);
    }
    next(err);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Combined error middleware stack
 */
export const errorMiddlewareStack = [
    mongooseValidationErrorHandler,
    mongooseCastErrorHandler,
    mongooseDuplicateKeyErrorHandler,
    jwtErrorHandler,
    multerErrorHandler,
    errorHandler,
];

export default {
    errorHandler,
    notFoundHandler,
    mongooseValidationErrorHandler,
    mongooseCastErrorHandler,
    mongooseDuplicateKeyErrorHandler,
    jwtErrorHandler,
    multerErrorHandler,
    catchAsync,
    errorMiddlewareStack,
};
