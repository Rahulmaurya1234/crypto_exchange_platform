// src/constants/error-codes.js

/**
 * Error Codes for i18n translation
 * Format: CATEGORY_NUMBER
 */
export const ERROR_CODES = {
    // Authentication Errors (AUTH_xxx)
    AUTH_001: "AUTH_001", // Invalid credentials
    AUTH_002: "AUTH_002", // Token expired
    AUTH_003: "AUTH_003", // Token invalid
    AUTH_004: "AUTH_004", // Refresh token missing
    AUTH_005: "AUTH_005", // User not found
    AUTH_006: "AUTH_006", // Account suspended
    AUTH_007: "AUTH_007", // Account banned
    AUTH_008: "AUTH_008", // Email already exists
    AUTH_009: "AUTH_009", // Invalid OTP
    AUTH_010: "AUTH_010", // OTP expired
    AUTH_011: "AUTH_011", // Too many OTP attempts
    AUTH_012: "AUTH_012", // Unauthorized access

    // Validation Errors (VAL_xxx)
    VAL_001: "VAL_001", // Required field missing
    VAL_002: "VAL_002", // Invalid email format
    VAL_003: "VAL_003", // Invalid phone number
    VAL_004: "VAL_004", // Invalid password format
    VAL_005: "VAL_005", // Password too short
    VAL_006: "VAL_006", // Invalid amount
    VAL_007: "VAL_007", // Amount below minimum
    VAL_008: "VAL_008", // Amount above maximum
    VAL_009: "VAL_009", // Invalid wallet address
    VAL_010: "VAL_010", // Invalid file type
    VAL_011: "VAL_011", // File size too large

    // KYC Errors (KYC_xxx)
    KYC_001: "KYC_001", // KYC not submitted
    KYC_002: "KYC_002", // KYC pending approval
    KYC_003: "KYC_003", // KYC rejected
    KYC_004: "KYC_004", // KYC level insufficient
    KYC_005: "KYC_005", // KYC documents missing
    KYC_006: "KYC_006", // KYC verification failed
    KYC_007: "KYC_007", // KYC already approved
    KYC_008: "KYC_008", // KYC resubmission required

    // Listing Errors (LIST_xxx)
    LIST_001: "LIST_001", // Listing not found
    LIST_002: "LIST_002", // Listing inactive
    LIST_003: "LIST_003", // Listing expired
    LIST_004: "LIST_004", // Listing suspended
    LIST_005: "LIST_005", // Cannot modify active listing
    LIST_006: "LIST_006", // Insufficient balance
    LIST_007: "LIST_007", // Invalid price
    LIST_008: "LIST_008", // Listing limit reached

    // Trade Errors (TRADE_xxx)
    TRADE_001: "TRADE_001", // Trade not found
    TRADE_002: "TRADE_002", // Cannot trade own listing
    TRADE_003: "TRADE_003", // Trade already exists
    TRADE_004: "TRADE_004", // Trade expired
    TRADE_005: "TRADE_005", // Trade cancelled
    TRADE_006: "TRADE_006", // Insufficient escrow balance
    TRADE_007: "TRADE_007", // Escrow deposit pending
    TRADE_008: "TRADE_008", // Payment proof required
    TRADE_009: "TRADE_009", // Trade not in valid state
    TRADE_010: "TRADE_010", // Seller confirmation pending
    TRADE_011: "TRADE_011", // Trade amount mismatch
    TRADE_012: "TRADE_012", // Buyer must pay first

    // Payment Errors (PAY_xxx)
    PAY_001: "PAY_001", // Payment proof required
    PAY_002: "PAY_002", // Invalid payment proof
    PAY_003: "PAY_003", // Payment proof rejected
    PAY_004: "PAY_004", // Payment not received
    PAY_005: "PAY_005", // Payment already confirmed
    PAY_006: "PAY_006", // Invalid transaction ID
    PAY_007: "PAY_007", // Payment amount mismatch

    // Escrow Errors (ESC_xxx)
    ESC_001: "ESC_001", // Escrow not found
    ESC_002: "ESC_002", // Insufficient escrow balance
    ESC_003: "ESC_003", // Escrow already released
    ESC_004: "ESC_004", // Escrow release failed
    ESC_005: "ESC_005", // Escrow refund failed
    ESC_006: "ESC_006", // Invalid escrow transaction
    ESC_007: "ESC_007", // Escrow wallet error
    ESC_008: "ESC_008", // Blockchain transaction failed

    // Dispute Errors (DISP_xxx)
    DISP_001: "DISP_001", // Dispute not found
    DISP_002: "DISP_002", // Dispute already exists
    DISP_003: "DISP_003", // Cannot dispute completed trade
    DISP_004: "DISP_004", // Dispute window expired
    DISP_005: "DISP_005", // Insufficient evidence
    DISP_006: "DISP_006", // Dispute already resolved

    // Chat Errors (CHAT_xxx)
    CHAT_001: "CHAT_001", // Chat not found
    CHAT_002: "CHAT_002", // Not a chat participant
    CHAT_003: "CHAT_003", // Message too long
    CHAT_004: "CHAT_004", // Chat disabled
    CHAT_005: "CHAT_005", // Cannot send message

    // Permission Errors (PERM_xxx)
    PERM_001: "PERM_001", // Access denied
    PERM_002: "PERM_002", // Insufficient permissions
    PERM_003: "PERM_003", // Admin access required
    PERM_004: "PERM_004", // KYC required for action
    PERM_005: "PERM_005", // Instant seller required

    // Server Errors (SRV_xxx)
    SRV_001: "SRV_001", // Internal server error
    SRV_002: "SRV_002", // Database error
    SRV_003: "SRV_003", // Redis connection error
    SRV_004: "SRV_004", // Third-party service error
    SRV_005: "SRV_005", // Network error
    SRV_006: "SRV_006", // Service unavailable

    // Rate Limit Errors (RATE_xxx)
    RATE_001: "RATE_001", // Too many requests
    RATE_002: "RATE_002", // Rate limit exceeded
    RATE_003: "RATE_003", // Daily limit reached

    // Resource Errors (RES_xxx)
    RES_001: "RES_001", // Resource not found
    RES_002: "RES_002", // Resource already exists
    RES_003: "RES_003", // Resource deleted
};

/**
 * HTTP Status Codes mapping
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

export default { ERROR_CODES, HTTP_STATUS };
