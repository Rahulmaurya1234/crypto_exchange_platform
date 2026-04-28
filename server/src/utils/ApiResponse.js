// src/utils/ApiResponse.js
import { getMessage, DEFAULT_LANGUAGE } from "../locales/index.js";

/**
 * Standardized API Response class with i18n support
 */
class ApiResponse {
    /**
     * @param {number} statusCode - HTTP status code
     * @param {any} data - Response data
     * @param {string} messageOrKey - Success message or message key (e.g., 'auth.loginSuccess')
     * @param {object} params - Parameters for i18n interpolation
     * @param {string} lang - Language code
     * @param {object} meta - Additional metadata (pagination, etc.)
     */
    constructor(
        statusCode,
        data = null,
        messageOrKey = "Success",
        params = {},
        lang = DEFAULT_LANGUAGE,
        meta = {}
    ) {
        // Ensure messageOrKey is a string
        const messageStr = typeof messageOrKey === 'string' ? messageOrKey : "Success";

        // Check if messageOrKey is a message key (contains dot)
        const isMessageKey = messageStr.includes(".");

        // Get translated message if it's a message key
        const message = isMessageKey
            ? getMessage(messageStr, lang, params)
            : messageStr;

        this.success = true;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.timestamp = new Date().toISOString();

        if (Object.keys(meta).length > 0) {
            this.meta = meta;
        }
    }

    /**
     * Convert response to JSON format
     */
    toJSON() {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            data: this.data,
            timestamp: this.timestamp,
            ...(this.meta && { meta: this.meta }),
        };
    }
}

/**
 * Factory methods for common responses
 */

// 200 - OK
export const SuccessResponse = (data, messageOrKey, params, lang, meta) =>
    new ApiResponse(200, data, messageOrKey, params, lang, meta);

// 201 - Created
export const CreatedResponse = (data, messageOrKey, params, lang, meta) =>
    new ApiResponse(201, data, messageOrKey, params, lang, meta);

// 204 - No Content
export const NoContentResponse = () =>
    new ApiResponse(204, null, "No Content");

/**
 * Paginated response helper
 */
export const PaginatedResponse = (data, page, limit, total, messageOrKey, params, lang) => {
    const totalPages = Math.ceil(total / limit);
    return new ApiResponse(
        200,
        data,
        messageOrKey || "Data fetched successfully",
        params,
        lang,
        {
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        }
    );
};

export { ApiResponse };
export default ApiResponse;
