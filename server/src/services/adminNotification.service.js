// src/services/adminNotification.service.js
import AdminNotification from "../models/AdminNotification.model.js";
import { ADMIN_NOTIFICATION_TYPE } from "../models/AdminNotification.model.js";
import { logger } from "../utils/logger.js";
import { emitToAdmins } from "../config/socket.config.js";

/**
 * Create admin notification and emit via socket
 */
export const createAdminNotification = async (notificationData) => {
    try {
        const notification = await AdminNotification.create(notificationData);

        // Emit to all connected admins via socket
        emitToAdmins("admin:notification", {
            notification: notification.toObject(),
        });

        logger.info("Admin notification created", {
            type: notification.type,
            id: notification._id,
        });

        return notification;
    } catch (error) {
        logger.error("Failed to create admin notification:", error);
        throw error;
    }
};

/**
 * Notify when a new user registers
 */
export const notifyUserRegistered = async (user) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.USER_REGISTERED,
        title: "New User Registration",
        message: `${user.name} (${user.email}) has registered`,
        relatedModel: "User",
        relatedId: user._id,
        targetUserId: user._id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        actionUrl: `/users`,
        metadata: {
            mobileNumber: user.mobileNumber,
        },
    });
};

/**
 * Notify when a user is suspended
 */
export const notifyUserSuspended = async (user, adminId, adminName, reason) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.USER_SUSPENDED,
        title: "User Suspended",
        message: `${user.name} (${user.email}) has been suspended${reason ? `: ${reason}` : ""}`,
        relatedModel: "User",
        relatedId: user._id,
        targetUserId: user._id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        performedBy: adminId,
        performedByName: adminName,
        actionUrl: `/users`,
        metadata: {
            reason,
        },
    });
};

/**
 * Notify when a user is unsuspended
 */
export const notifyUserUnsuspended = async (user, adminId, adminName) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.USER_UNSUSPENDED,
        title: "User Unsuspended",
        message: `${user.name} (${user.email}) has been unsuspended`,
        relatedModel: "User",
        relatedId: user._id,
        targetUserId: user._id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        performedBy: adminId,
        performedByName: adminName,
        actionUrl: `/users`,
    });
};

/**
 * Notify when a user is banned
 */
export const notifyUserBanned = async (user, adminId, adminName, reason) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.USER_BANNED,
        title: "User Banned",
        message: `${user.name} (${user.email}) has been banned${reason ? `: ${reason}` : ""}`,
        relatedModel: "User",
        relatedId: user._id,
        targetUserId: user._id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        performedBy: adminId,
        performedByName: adminName,
        actionUrl: `/users`,
        metadata: {
            reason,
        },
    });
};

/**
 * Notify when user email is approved
 */
export const notifyUserEmailApproved = async (user, adminId, adminName) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.USER_EMAIL_APPROVED,
        title: "User Email Approved",
        message: `${user.name}'s email (${user.email}) has been approved`,
        relatedModel: "User",
        relatedId: user._id,
        targetUserId: user._id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        performedBy: adminId,
        performedByName: adminName,
        actionUrl: `/users`,
    });
};

/**
 * Notify when instant seller is approved
 */
export const notifyInstantSellerApproved = async (user, adminId, adminName) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.INSTANT_SELLER_APPROVED,
        title: "Instant Seller Approved",
        message: `${user.name} (${user.email}) is now an Instant Seller`,
        relatedModel: "User",
        relatedId: user._id,
        targetUserId: user._id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        performedBy: adminId,
        performedByName: adminName,
        actionUrl: `/users`,
    });
};

/**
 * Notify when KYC is submitted
 */
export const notifyKYCSubmitted = async (user, kycId) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.KYC_SUBMITTED,
        title: "New KYC Submission",
        message: `${user.name} (${user.email}) has submitted KYC documents`,
        relatedModel: "KYC",
        relatedId: kycId,
        targetUserId: user._id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        actionUrl: `/kyc`,
    });
};

/**
 * Notify when KYC is approved
 */
export const notifyKYCApproved = async (user, kycId, adminId, adminName) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.KYC_APPROVED,
        title: "KYC Approved",
        message: `${user.name}'s (${user.email}) KYC has been approved`,
        relatedModel: "KYC",
        relatedId: kycId,
        targetUserId: user._id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        performedBy: adminId,
        performedByName: adminName,
        actionUrl: `/kyc`,
    });
};

/**
 * Notify when KYC is rejected
 */
export const notifyKYCRejected = async (user, kycId, adminId, adminName, reason) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.KYC_REJECTED,
        title: "KYC Rejected",
        message: `${user.name}'s (${user.email}) KYC has been rejected${reason ? `: ${reason}` : ""}`,
        relatedModel: "KYC",
        relatedId: kycId,
        targetUserId: user._id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        performedBy: adminId,
        performedByName: adminName,
        actionUrl: `/kyc`,
        metadata: {
            reason,
        },
    });
};

/**
 * Notify when trade is disputed
 */
export const notifyTradeDisputed = async (trade, user) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.TRADE_DISPUTED,
        title: "New Trade Dispute",
        message: `Trade #${trade._id.toString().slice(-8)} has been disputed by ${user.name}`,
        relatedModel: "Trade",
        relatedId: trade._id,
        targetUserId: user._id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        actionUrl: `/disputes`,
        metadata: {
            tradeId: trade._id,
            cryptoAmount: trade.cryptoAmount,
            totalINR: trade.totalINRAmount,
        },
    });
};

/**
 * Notify when trade is appealed
 */
export const notifyTradeAppealed = async (trade, user, reason) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.TRADE_APPEALED,
        title: "New Trade Appeal",
        message: `Trade #${trade._id.toString().slice(-8)} has been appealed by ${user.name}`,
        relatedModel: "Trade",
        relatedId: trade._id,
        targetUserId: user._id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        actionUrl: `/appeals`,
        metadata: {
            tradeId: trade._id,
            reason,
            cryptoAmount: trade.cryptoAmount,
            totalINR: trade.totalINRAmount,
        },
    });
};

// ==================== INSTANT SELLER DEPOSIT NOTIFICATIONS (ADMIN) ====================

/**
 * Notify admin when instant seller deposit is pending
 */
export const notifyDepositPending = async (deposit, user, listing) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.DEPOSIT_PENDING,
        title: "New Instant Seller Deposit",
        message: `${user.name || user.email} submitted a deposit of ${deposit.totalDepositAmount} USDT for review`,
        relatedModel: "InstantSellerDeposit",
        relatedId: deposit._id,
        targetUserId: user._id,
        targetUserName: user.name || user.email,
        targetUserEmail: user.email,
        actionUrl: `/instant-seller-escrow`,
        metadata: {
            depositId: deposit._id,
            listingId: listing?._id || deposit.listingId,
            originalAmount: deposit.originalAmount,
            totalDepositAmount: deposit.totalDepositAmount,
            transactionHash: deposit.transactionHash,
            network: deposit.blockchainNetwork,
        },
    });
};

/**
 * Notify admin when deposit is approved (log action)
 */
export const notifyDepositApproved = async (deposit, user, adminId, adminName) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.DEPOSIT_APPROVED,
        title: "Deposit Approved",
        message: `${user.name || user.email}'s deposit of ${deposit.totalDepositAmount} USDT has been approved`,
        relatedModel: "InstantSellerDeposit",
        relatedId: deposit._id,
        targetUserId: user._id,
        targetUserName: user.name || user.email,
        targetUserEmail: user.email,
        performedBy: adminId,
        performedByName: adminName,
        actionUrl: `/instant-seller-escrow`,
        metadata: {
            depositId: deposit._id,
            listingId: deposit.listingId,
            originalAmount: deposit.originalAmount,
            totalDepositAmount: deposit.totalDepositAmount,
        },
    });
};

/**
 * Notify admin when deposit is rejected (log action)
 */
export const notifyDepositRejected = async (deposit, user, adminId, adminName, reason) => {
    return createAdminNotification({
        type: ADMIN_NOTIFICATION_TYPE.DEPOSIT_REJECTED,
        title: "Deposit Rejected",
        message: `${user.name || user.email}'s deposit of ${deposit.totalDepositAmount} USDT has been rejected${reason ? `: ${reason}` : ""}`,
        relatedModel: "InstantSellerDeposit",
        relatedId: deposit._id,
        targetUserId: user._id,
        targetUserName: user.name || user.email,
        targetUserEmail: user.email,
        performedBy: adminId,
        performedByName: adminName,
        actionUrl: `/instant-seller-escrow`,
        metadata: {
            depositId: deposit._id,
            listingId: deposit.listingId,
            reason,
        },
    });
};

/**
 * Get admin notifications
 */
export const getAdminNotifications = async (page = 1, limit = 20, status = null) => {
    const skip = (page - 1) * limit;
    const query = status ? { status } : {};

    const [notifications, total] = await Promise.all([
        AdminNotification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("performedBy", "name email")
            .populate("targetUserId", "name email"),
        AdminNotification.countDocuments(query),
    ]);

    return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Get unread count
 */
export const getUnreadCount = async () => {
    return AdminNotification.countDocuments({ status: "unread" });
};

/**
 * Mark notification as read by admin
 */
export const markAsRead = async (notificationId, adminId) => {
    return AdminNotification.findByIdAndUpdate(
        notificationId,
        {
            status: "read",
            readAt: new Date(),
            $addToSet: { readBy: adminId },
        },
        { new: true }
    );
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (adminId) => {
    return AdminNotification.updateMany(
        { status: "unread" },
        {
            status: "read",
            readAt: new Date(),
            $addToSet: { readBy: adminId },
        }
    );
};

/**
 * Delete old notifications (cleanup)
 */
export const deleteOldNotifications = async (daysOld = 30) => {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    return AdminNotification.deleteMany({ createdAt: { $lt: cutoffDate } });
};

export default {
    createAdminNotification,
    notifyUserRegistered,
    notifyUserSuspended,
    notifyUserUnsuspended,
    notifyUserBanned,
    notifyUserEmailApproved,
    notifyInstantSellerApproved,
    notifyKYCSubmitted,
    notifyKYCApproved,
    notifyKYCRejected,
    notifyTradeDisputed,
    notifyTradeAppealed,
    notifyDepositPending,
    notifyDepositApproved,
    notifyDepositRejected,
    getAdminNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteOldNotifications,
};

