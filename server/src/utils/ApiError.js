// src/utils/ApiError.js
import { HTTP_STATUS } from "../constants/error-codes.js";
import { getErrorMessage, DEFAULT_LANGUAGE } from "../locales/index.js";

/**
 * Custom API Error class with i18n support
 */
class ApiError extends Error {
    /**
     * @param {number} statusCode - HTTP status code
     * @param {string} messageOrCode - Error message or error code (e.g., 'AUTH_001')
     * @param {object} params - Parameters for i18n interpolation
     * @param {string} lang - Language code
     * @param {boolean} isOperational - Is this an operational error?
     * @param {string} stack - Stack trace
     */
    constructor(
        statusCode,
        messageOrCode,
        params = {},
        lang = DEFAULT_LANGUAGE,
        isOperational = true,
        stack = ""
    ) {
        // Check if messageOrCode is an error code
        const isErrorCode = /^[A-Z]+_\d+$/.test(messageOrCode);

        // Get translated message if it's an error code
        const message = isErrorCode
            ? getErrorMessage(messageOrCode, lang, params)
            : messageOrCode;

        super(message);

        this.statusCode = statusCode;
        this.message = message;
        this.errorCode = isErrorCode ? messageOrCode : null;
        this.params = params;
        this.lang = lang;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Convert error to JSON format for API response
     */
    toJSON() {
        return {
            success: false,
            statusCode: this.statusCode,
            message: this.message,
            errorCode: this.errorCode,
            timestamp: this.timestamp,
            ...(process.env.NODE_ENV === "development" && { stack: this.stack }),
        };
    }
}

/**
 * Factory methods for common errors
 */

// 400 - Bad Request
export const BadRequestError = (messageOrCode, params, lang) =>
    new ApiError(HTTP_STATUS.BAD_REQUEST, messageOrCode, params, lang);

// 401 - Unauthorized
export const UnauthorizedError = (messageOrCode = "AUTH_012", params, lang) =>
    new ApiError(HTTP_STATUS.UNAUTHORIZED, messageOrCode, params, lang);

// 403 - Forbidden
export const ForbiddenError = (messageOrCode = "PERM_001", params, lang) =>
    new ApiError(HTTP_STATUS.FORBIDDEN, messageOrCode, params, lang);

// 404 - Not Found
export const NotFoundError = (messageOrCode = "RES_001", params, lang) =>
    new ApiError(HTTP_STATUS.NOT_FOUND, messageOrCode, params, lang);

// 409 - Conflict
export const ConflictError = (messageOrCode = "RES_002", params, lang) =>
    new ApiError(HTTP_STATUS.CONFLICT, messageOrCode, params, lang);

// 422 - Unprocessable Entity
export const ValidationError = (messageOrCode, params, lang) =>
    new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, messageOrCode, params, lang);

// 429 - Too Many Requests
export const RateLimitError = (messageOrCode = "RATE_001", params, lang) =>
    new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, messageOrCode, params, lang);

// 500 - Internal Server Error
export const InternalServerError = (messageOrCode = "SRV_001", params, lang) =>
    new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, messageOrCode, params, lang, false);

// 503 - Service Unavailable
export const ServiceUnavailableError = (messageOrCode = "SRV_006", params, lang) =>
    new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, messageOrCode, params, lang);

export default ApiError;
