// src/constants/statuses.js

/**
 * User Account Statuses
 */
export const ACCOUNT_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended",
    BANNED: "banned",
    PENDING_VERIFICATION: "pending_verification",
};

/**
 * KYC Verification Statuses
 */
export const KYC_STATUS = {
    NOT_SUBMITTED: "not_submitted",
    PENDING: "pending",
    SUBMITTED: "submitted",
    UNDER_REVIEW: "under_review",
    APPROVED: "approved",
    REJECTED: "rejected",
    RESUBMIT_REQUIRED: "resubmit_required",
};

/**
 * KYC Levels
 */
export const KYC_LEVEL = {
    LEVEL_0: "level_0", // No KYC
    LEVEL_1: "level_1", // Basic KYC (Email + Phone)
    LEVEL_2: "level_2", // Full KYC (ID + Selfie)
    LEVEL_3: "level_3", // Enhanced KYC (Address Proof)
};

/**
 * Listing Statuses
 */
export const LISTING_STATUS = {
    PENDING: "pending", // Instant seller - awaiting admin approval
    REJECTED: "rejected", // Instant seller - deposit rejected
    DRAFT: "draft",
    ACTIVE: "active",
    PAUSED: "paused",
    COMPLETED: "completed",
    EXPIRED: "expired",
    CANCELLED: "cancelled",
    SUSPENDED: "suspended", // Admin suspended
};

/**
 * Instant Seller Deposit Statuses
 */
export const DEPOSIT_STATUS = {
    PENDING: "pending", // Awaiting admin verification
    APPROVED: "approved", // Verified and approved
    REJECTED: "rejected", // Rejected by admin
    REFUNDED: "refunded", // Refunded to seller
    EXPIRED: "expired", // Verification timeout
};

/**
 * Trade Statuses
 */
export const TRADE_STATUS = {
    INITIATED: "initiated", // Buyer opened chat, no order yet
    PENDING_SELLER_DEPOSIT: "pending_seller_deposit", // Regular Seller: Waiting for seller to deposit USDT to escrow (15 min timer)
    DEPOSIT_SUBMITTED: "deposit_submitted", // Regular Seller: Seller submitted tx hash, waiting for Platform B verification
    ESCROW_CONFIRMED: "escrow_confirmed", // Escrow verified & locked, buyer can now pay (30 min timer)
    PENDING_PAYMENT: "pending_payment", // Waiting for buyer to transfer INR to seller
    PAYMENT_PROOF_UPLOADED: "payment_proof_uploaded", // Buyer uploaded payment proof, waiting for seller
    PENDING_SELLER_CONFIRMATION: "pending_seller_confirmation", // Waiting for seller to confirm INR received (15 min timer)
    COMPLETED: "completed", // Trade successful, crypto released
    CANCELLED: "cancelled", // Cancelled by user or system
    EXPIRED: "expired", // Timeout expired
    DISPUTED: "disputed", // Dispute raised
    APPEALED: "appealed", // Appeal raised
    REFUNDED: "refunded", // Escrow refunded to seller

    // Legacy aliases for backward compatibility
    PENDING_DEPOSIT: "pending_seller_deposit",
    ESCROW_LOCKED: "escrow_confirmed",
    PENDING_CONFIRMATION: "pending_seller_confirmation",
};

/**
 * Payment Statuses
 */
export const PAYMENT_STATUS = {
    PENDING: "pending",
    PROOF_UPLOADED: "proof_uploaded",
    CONFIRMED: "confirmed",
    REJECTED: "rejected",
    VERIFIED: "verified", // Admin verified
};

/**
 * Dispute Statuses
 */
export const DISPUTE_STATUS = {
    OPEN: "open",
    ASSIGNED: "assigned",
    UNDER_INVESTIGATION: "under_investigation",
    RESOLVED: "resolved",
    CLOSED: "closed",
    ESCALATED: "escalated",
};

/**
 * Dispute Resolution
 */
export const DISPUTE_RESOLUTION = {
    BUYER_FAVOR: "buyer_favor", // Release to buyer
    SELLER_FAVOR: "seller_favor", // Refund to seller
    PARTIAL_REFUND: "partial_refund",
    NO_ACTION: "no_action",
};

/**
 * Escrow Transaction Types
 */
export const ESCROW_TRANSACTION_TYPE = {
    DEPOSIT: "deposit", // Seller deposits
    RELEASE: "release", // Released to buyer
    REFUND: "refund", // Refunded to seller
    FEE_COLLECTION: "fee_collection", // Platform fee
    INSTANT_SELLER_DEPOSIT: "instant_seller_deposit",
    INSTANT_SELLER_WITHDRAWAL: "instant_seller_withdrawal",
};

/**
 * Escrow Transaction Status
 */
export const ESCROW_TRANSACTION_STATUS = {
    PENDING: "pending",
    CONFIRMING: "confirming", // Waiting for blockchain confirmations
    CONFIRMED: "confirmed",
    COMPLETED: "completed",
    FAILED: "failed",
};

/**
 * Notification Types
 */
export const NOTIFICATION_TYPE = {
    TRADE_INITIATED: "trade_initiated",
    ESCROW_RECEIVED: "escrow_received",
    PAYMENT_RECEIVED: "payment_received",
    TRADE_COMPLETED: "trade_completed",
    TRADE_CANCELLED: "trade_cancelled",
    TRADE_TIMEOUT: "trade_timeout",
    DISPUTE_CREATED: "dispute_created",
    DISPUTE_RESOLVED: "dispute_resolved",
    KYC_APPROVED: "kyc_approved",
    KYC_REJECTED: "kyc_rejected",
    MESSAGE_RECEIVED: "message_received",
    LISTING_EXPIRED: "listing_expired",
    DEPOSIT_PENDING: "deposit_pending",
    DEPOSIT_APPROVED: "deposit_approved",
    DEPOSIT_REJECTED: "deposit_rejected",
};

/**
 * Notification Status
 */
export const NOTIFICATION_STATUS = {
    UNREAD: "unread",
    READ: "read",
    ARCHIVED: "archived",
};

/**
 * Audit Log Actions
 */
export const AUDIT_ACTION = {
    USER_LOGIN: "user_login",
    USER_LOGOUT: "user_logout",
    USER_REGISTER: "user_register",
    KYC_SUBMIT: "kyc_submit",
    KYC_APPROVE: "kyc_approve",
    KYC_REJECT: "kyc_reject",
    LISTING_CREATE: "listing_create",
    LISTING_UPDATE: "listing_update",
    LISTING_DELETE: "listing_delete",
    TRADE_INITIATE: "trade_initiate",
    TRADE_CREATE: "trade_create",
    TRADE_COMPLETE: "trade_complete",
    TRADE_CANCEL: "trade_cancel",
    ESCROW_DEPOSIT: "escrow_deposit",
    ESCROW_RELEASE: "escrow_release",
    ESCROW_REFUND: "escrow_refund",
    ESCROW_VERIFY: "escrow_verify",
    PAYMENT_PROOF_UPLOAD: "payment_proof_upload",
    DISPUTE_CREATE: "dispute_create",
    DISPUTE_RESOLVE: "dispute_resolve",
    DISPUTE_UPDATE: "dispute_update",
    USER_SUSPEND: "user_suspend",
    USER_BAN: "user_ban",
    SETTINGS_CHANGE: "settings_change",
};

export default {
    ACCOUNT_STATUS,
    KYC_STATUS,
    KYC_LEVEL,
    LISTING_STATUS,
    DEPOSIT_STATUS,
    TRADE_STATUS,
    PAYMENT_STATUS,
    DISPUTE_STATUS,
    DISPUTE_RESOLUTION,
    ESCROW_TRANSACTION_TYPE,
    ESCROW_TRANSACTION_STATUS,
    NOTIFICATION_TYPE,
    NOTIFICATION_STATUS,
    AUDIT_ACTION,
};
