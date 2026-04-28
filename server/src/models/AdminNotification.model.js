// src/models/AdminNotification.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Admin Notification Types
 */
export const ADMIN_NOTIFICATION_TYPE = {
    // User-related
    USER_REGISTERED: "user_registered",
    USER_SUSPENDED: "user_suspended",
    USER_UNSUSPENDED: "user_unsuspended",
    USER_BANNED: "user_banned",
    USER_EMAIL_APPROVED: "user_email_approved",
    INSTANT_SELLER_APPROVED: "instant_seller_approved",
    
    // KYC-related
    KYC_SUBMITTED: "kyc_submitted",
    KYC_APPROVED: "kyc_approved",
    KYC_REJECTED: "kyc_rejected",
    
    // Trade-related
    TRADE_DISPUTED: "trade_disputed",
    TRADE_APPEALED: "trade_appealed",
    
    // Deposit-related
    DEPOSIT_PENDING: "deposit_pending",
    DEPOSIT_APPROVED: "deposit_approved",
    DEPOSIT_REJECTED: "deposit_rejected",
    
    // General
    SYSTEM: "system",
};

const adminNotificationSchema = new Schema(
    {
        type: {
            type: String,
            enum: Object.values(ADMIN_NOTIFICATION_TYPE),
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["unread", "read", "archived"],
            default: "unread",
            index: true,
        },
        // Reference to the related entity
        relatedModel: {
            type: String,
            enum: ["User", "Trade", "KYC", "Listing", "InstantSellerDeposit", "Dispute"],
        },
        relatedId: {
            type: Schema.Types.ObjectId,
        },
        // For user-related notifications
        targetUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        targetUserName: {
            type: String,
        },
        targetUserEmail: {
            type: String,
        },
        // Admin who performed the action (if applicable)
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        performedByName: {
            type: String,
        },
        // Additional metadata
        metadata: {
            type: Schema.Types.Mixed,
        },
        // Action URL for navigation
        actionUrl: {
            type: String,
        },
        readAt: {
            type: Date,
        },
        readBy: [{
            type: Schema.Types.ObjectId,
            ref: "User",
        }],
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
adminNotificationSchema.index({ status: 1, createdAt: -1 });
adminNotificationSchema.index({ type: 1, createdAt: -1 });

const AdminNotification = mongoose.model("AdminNotification", adminNotificationSchema);
export default AdminNotification;
