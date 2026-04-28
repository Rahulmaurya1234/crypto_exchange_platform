// src/services/notification.service.js
import Notification from "../models/Notification.model.js";
import { NOTIFICATION_TYPE } from "../constants/index.js";
import { logger } from "../utils/logger.js";
import { emitToUser } from "../config/socket.config.js";
import * as adminNotificationService from "./adminNotification.service.js";

/**
 * Create notification
 */
export const createNotification = async (notificationData) => {
    try {
        // Simple deduplication: Check if same user got same notification type for same resource in last 10 seconds
        const tenSecondsAgo = new Date(Date.now() - 10000);
        const existing = await Notification.findOne({
            userId: notificationData.userId,
            type: notificationData.type,
            relatedId: notificationData.relatedId,
            createdAt: { $gte: tenSecondsAgo }
        });

        if (existing) {
            logger.info("Duplicate notification suppressed", { userId: notificationData.userId, type: notificationData.type });
            return existing;
        }

        const notification = await Notification.create(notificationData);
        return notification;
    } catch (error) {
        logger.error("Failed to create notification:", error);
        throw error;
    }
};

/**
 * Notify trade initiated
 */
export const notifyTradeInitiated = async (trade) => {
    try {
        // Notify seller
        const notification = await createNotification({
            userId: trade.sellerId,
            type: NOTIFICATION_TYPE.TRADE_INITIATED,
            title: "🤝 New Trade Request",
            message: `A buyer wants to purchase ${trade.cryptoAmount} USDT. Action required!`,
            relatedModel: "Trade",
            relatedId: trade._id,
            actionUrl: `/trades/${trade._id}`,
        });

        emitToUser(trade.sellerId.toString(), "notification", {
            id: notification?._id,
            type: "trade_initiated",
            title: notification.title,
            message: notification.message,
            tradeId: trade._id,
        });
    } catch (error) {
        logger.error("Error in notifyTradeInitiated:", error);
    }
};

/**
 * Notify escrow confirmed (Seller deposit verified)
 */
export const notifyEscrowConfirmed = async (trade) => {
    try {
        // Notify buyer
        const buyerNotif = await createNotification({
            userId: trade.buyerId,
            type: NOTIFICATION_TYPE.ESCROW_RECEIVED,
            title: "🛡️ Escrow Secured",
            message: `Seller has deposited ${trade.cryptoAmount} USDT into escrow. You can now safely pay.`,
            relatedModel: "Trade",
            relatedId: trade._id,
            actionUrl: `/trades/${trade._id}`,
        });

        emitToUser(trade.buyerId.toString(), "notification", {
            id: buyerNotif?._id,
            type: "escrow_confirmed",
            title: buyerNotif.title,
            message: buyerNotif.message,
            tradeId: trade._id,
        });

        // Notify seller
        const sellerNotif = await createNotification({
            userId: trade.sellerId,
            type: NOTIFICATION_TYPE.ESCROW_RECEIVED,
            title: "✅ Deposit Verified",
            message: `Your deposit of ${trade.cryptoAmount} USDT has been verified and locked. Wait for buyer payment.`,
            relatedModel: "Trade",
            relatedId: trade._id,
            actionUrl: `/trades/${trade._id}`,
        });

        emitToUser(trade.sellerId.toString(), "notification", {
            id: sellerNotif?._id,
            type: "escrow_confirmed",
            title: sellerNotif.title,
            message: sellerNotif.message,
            tradeId: trade._id,
        });
    } catch (error) {
        logger.error("Error in notifyEscrowConfirmed:", error);
    }
};

/**
 * Notify payment proof uploaded
 */
export const notifyPaymentUploaded = async (trade) => {
    try {
        // Notify seller
        const notification = await createNotification({
            userId: trade.sellerId,
            type: NOTIFICATION_TYPE.PAYMENT_RECEIVED,
            title: "💰 Payment Proof Uploaded",
            message: "The buyer has uploaded payment proof. Please verify your bank.",
            relatedModel: "Trade",
            relatedId: trade._id,
            actionUrl: `/trades/${trade._id}`,
        });

        emitToUser(trade.sellerId.toString(), "notification", {
            id: notification?._id,
            type: "payment_uploaded",
            title: notification.title,
            message: notification.message,
            tradeId: trade._id,
        });
    } catch (error) {
        logger.error("Error in notifyPaymentUploaded:", error);
    }
};

/**
 * Notify buyer when seller confirms payment receipt
 */
export const notifyPaymentConfirmedBySeller = async (trade) => {
    try {
        // Notify buyer
        const notification = await createNotification({
            userId: trade.buyerId,
            type: NOTIFICATION_TYPE.PAYMENT_RECEIVED,
            title: "✅ Payment Confirmed",
            message: `Seller confirmed receipt of ₹${trade.totalINRAmount}. Escrow will be released shortly.`,
            relatedModel: "Trade",
            relatedId: trade._id,
            actionUrl: `/trades/${trade._id}`,
        });

        emitToUser(trade.buyerId.toString(), "notification", {
            id: notification?._id,
            type: "payment_confirmed",
            title: notification.title,
            message: notification.message,
            tradeId: trade._id,
        });
    } catch (error) {
        logger.error("Error in notifyPaymentConfirmedBySeller:", error);
    }
};

/**
 * Notify trade completed
 */
export const notifyTradeCompleted = async (trade) => {
    try {
        // Notify buyer
        const buyerNotif = await createNotification({
            userId: trade.buyerId,
            type: NOTIFICATION_TYPE.TRADE_COMPLETED,
            title: "🎉 Trade Completed!",
            message: `${trade.cryptoAmount} USDT has been released to your wallet.`,
            relatedModel: "Trade",
            relatedId: trade._id,
            actionUrl: `/trades/${trade._id}`,
        });

        emitToUser(trade.buyerId.toString(), "notification", {
            id: buyerNotif?._id,
            type: "trade_completed",
            title: buyerNotif.title,
            message: buyerNotif.message,
            tradeId: trade._id,
        });

        // Notify seller
        const sellerNotif = await createNotification({
            userId: trade.sellerId,
            type: NOTIFICATION_TYPE.TRADE_COMPLETED,
            title: "🎉 Trade Successful",
            message: `Trade with ${trade.buyerId?.name || 'Buyer'} completed. Check your bank for funds.`,
            relatedModel: "Trade",
            relatedId: trade._id,
            actionUrl: `/trades/${trade._id}`,
        });

        emitToUser(trade.sellerId.toString(), "notification", {
            id: sellerNotif?._id,
            type: "trade_completed",
            title: sellerNotif.title,
            message: sellerNotif.message,
            tradeId: trade._id,
        });
    } catch (error) {
        logger.error("Error in notifyTradeCompleted:", error);
    }
};

/**
 * Notify trade appealed
 */
export const notifyTradeAppealed = async (trade) => {
    try {
        // Notify counterparty
        const userId = trade.appealedBy.toString() === trade.buyerId.toString()
            ? trade.sellerId
            : trade.buyerId;

        const notification = await createNotification({
            userId,
            type: NOTIFICATION_TYPE.DISPUTE_CREATED,
            title: "⚖️ Trade Appealed",
            message: `The other party has raised an appeal. Platform B is reviewing.`,
            relatedModel: "Trade",
            relatedId: trade._id,
            actionUrl: `/trades/${trade._id}`,
        });

        emitToUser(userId.toString(), "notification", {
            id: notification?._id,
            type: "trade_appealed",
            title: notification.title,
            message: notification.message,
            tradeId: trade._id,
        });
    } catch (error) {
        logger.error("Error in notifyTradeAppealed:", error);
    }
};

/**
 * Notify trade cancelled
 */
export const notifyTradeCancelled = async (trade, reason) => {
    try {
        const notifications = [];

        // Notify buyer if cancellation wasn't by buyer or if system cancelled
        const buyerNotif = await createNotification({
            userId: trade.buyerId,
            type: NOTIFICATION_TYPE.TRADE_CANCELLED,
            title: "❌ Trade Cancelled",
            message: `Trade for ${trade.cryptoAmount} USDT has been cancelled. ${reason ? `Reason: ${reason}` : ""}`,
            relatedModel: "Trade",
            relatedId: trade._id,
            actionUrl: `/trades/${trade._id}`,
        });

        emitToUser(trade.buyerId.toString(), "notification", {
            id: buyerNotif?._id,
            type: "trade_cancelled",
            title: buyerNotif.title,
            message: buyerNotif.message,
            tradeId: trade._id,
        });

        // Notify seller
        const sellerNotif = await createNotification({
            userId: trade.sellerId,
            type: NOTIFICATION_TYPE.TRADE_CANCELLED,
            title: "❌ Trade Cancelled",
            message: `Trade for ${trade.cryptoAmount} USDT has been cancelled. ${reason ? `Reason: ${reason}` : ""}`,
            relatedModel: "Trade",
            relatedId: trade._id,
            actionUrl: `/trades/${trade._id}`,
        });

        emitToUser(trade.sellerId.toString(), "notification", {
            id: sellerNotif?._id,
            type: "trade_cancelled",
            title: sellerNotif.title,
            message: sellerNotif.message,
            tradeId: trade._id,
        });
    } catch (error) {
        logger.error("Error in notifyTradeCancelled:", error);
    }
};

/**
 * Notify appeal resolved
 */
export const notifyAppealResolved = async (trade) => {
    const notifications = [];
    const decision = trade.appealResolution?.status;

    // Notify buyer
    notifications.push(
        createNotification({
            userId: trade.buyerId,
            type: decision === "approved" ? NOTIFICATION_TYPE.TRADE_COMPLETED : NOTIFICATION_TYPE.TRADE_CANCELLED,
            title: `Appeal ${decision.toUpperCase()}`,
            message: `Admin has ${decision} the appeal. Status: ${trade.status}`,
            relatedModel: "Trade",
            relatedId: trade._id,
            actionUrl: `/trades/${trade._id}`,
        })
    );

    // Notify seller
    notifications.push(
        createNotification({
            userId: trade.sellerId,
            type: decision === "approved" ? NOTIFICATION_TYPE.TRADE_COMPLETED : NOTIFICATION_TYPE.TRADE_CANCELLED,
            title: `Appeal ${decision.toUpperCase()}`,
            message: `Admin has ${decision} the appeal. Status: ${trade.status}`,
            relatedModel: "Trade",
            relatedId: trade._id,
            actionUrl: `/trades/${trade._id}`,
        })
    );

    await Promise.all(notifications);
};

/**
 * Notify KYC status (Approval/Rejection)
 */
export const notifyKycStatus = async (userId, status, reason = "", kycId = null) => {
    const isApproved = status === "approved" || status === "active";
    const type = isApproved ? NOTIFICATION_TYPE.KYC_APPROVED : NOTIFICATION_TYPE.KYC_REJECTED;
    const title = isApproved ? "✅ KYC Approved" : "❌ KYC Rejected";
    const message = isApproved
        ? "Congratulations! Your KYC has been approved. You can now start trading 🚀"
        : `Your KYC verification failed. Reason: ${reason}. Please check and resubmit.`;

    // Save to database
    const notification = await createNotification({
        userId,
        type,
        title,
        message,
        relatedModel: "KYC",
        relatedId: kycId || userId,
        actionUrl: "/profile",
    });

    // Send socket notification to user
    try {
        const uId = userId.toString();
        logger.info(`🔔 Attempting to send KYC status notification to user: ${uId}`, { status, kycId });
        emitToUser(uId, "notification", {
            id: notification?._id,
            type: type,
            title: title,
            message: message,
            kycId: kycId,
            status: status,
        });
    } catch (socketError) {
        logger.error("Failed to send socket notification for KYC status:", socketError);
    }

    return notification;
};

/**
 * Notify KYC Submitted (Confirmation for user)
 */
export const notifyKycSubmitted = async (userId, kycId) => {
    const title = "📄 KYC Submitted";
    const message = "Your KYC documents have been submitted successfully and are under review.";

    const notification = await createNotification({
        userId,
        type: NOTIFICATION_TYPE.DEPOSIT_PENDING, // Using pending as a general "in progress" type
        title,
        message,
        relatedModel: "KYC",
        relatedId: kycId,
        actionUrl: "/profile",
    });

    try {
        emitToUser(userId.toString(), "notification", {
            id: notification?._id,
            type: "kyc_submitted",
            title,
            message,
            kycId,
        });
    } catch (socketError) {
        logger.error("Failed to send socket notification for KYC submission:", socketError);
    }

    return notification;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId) => {
    return Notification.findByIdAndUpdate(
        notificationId,
        { status: "read", readAt: new Date() },
        { new: true }
    );
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
    return Notification.updateMany(
        { userId, status: "unread" },
        { status: "read", readAt: new Date() }
    );
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
        Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Notification.countDocuments({ userId }),
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
export const getUnreadCount = async (userId) => {
    return Notification.countDocuments({ userId, status: "unread" });
};

// ==================== INSTANT SELLER DEPOSIT NOTIFICATIONS ====================

/**
 * Send deposit created notification
 */
export const sendDepositCreatedNotification = async (deposit, user, listing = null) => {
    try {
        // Send email notification to user
        const emailSent = await sendEmail({
            to: user.email,
            subject: "Deposit Submitted - Awaiting Verification",
            template: "deposit-created",
            data: {
                userName: user.name,
                depositAmount: deposit.totalDepositAmount,
                originalAmount: deposit.originalAmount,
                transactionHash: deposit.transactionHash,
                listingId: deposit.listingId,
                estimatedVerificationTime: "24-48 hours",
            },
        });

        // Send SMS notification
        const smsSent = user.mobileNumber
            ? await sendSMS({
                to: user.mobileNumber,
                message: `Your deposit of ${deposit.totalDepositAmount} USDT is under review. You'll be notified once verified.`,
            })
            : false;

        // Create database notification for user history
        let savedNotification;
        try {
            savedNotification = await createNotification({
                userId: user._id,
                type: NOTIFICATION_TYPE.DEPOSIT_PENDING,
                title: "Deposit Submitted",
                message: `Your deposit of ${deposit.totalDepositAmount} USDT is under review.`,
                relatedModel: "InstantSellerDeposit",
                relatedId: deposit._id,
                actionUrl: "/wallet",
            });
        } catch (dbError) {
            logger.error("Failed to save notification to DB for deposit created:", dbError);
        }

        // Send socket notification to user
        try {
            emitToUser(user._id.toString(), "notification", {
                id: savedNotification?._id,
                type: "deposit_pending",
                title: "Deposit Submitted",
                message: `Your deposit of ${deposit.totalDepositAmount} USDT is under review.`,
                depositId: deposit._id,
                listingId: deposit.listingId,
            });
        } catch (socketError) {
            logger.error("Failed to send socket notification for deposit created:", socketError);
        }

        // Notify admins about new pending deposit
        try {
            await adminNotificationService.notifyDepositPending(deposit, user, listing);
        } catch (adminNotifError) {
            logger.error("Failed to send admin notification for deposit created:", adminNotifError);
        }

        // Update notification status in deposit
        deposit.notificationsSent.depositCreated = {
            email: emailSent,
            sms: smsSent,
            sentAt: new Date(),
        };
        await deposit.save();

        logger.info("Deposit created notification sent", { depositId: deposit._id });
    } catch (error) {
        logger.error("Error sending deposit created notification:", error);
    }
};

/**
 * Send deposit approved notification
 */
export const sendDepositApprovedNotification = async (deposit, user) => {
    try {
        const emailSent = await sendEmail({
            to: user.email,
            subject: "🎉 Congratulations! You're now an Instant Seller",
            template: "deposit-approved",
            data: {
                userName: user.name,
                escrowBalance: user.escrowDepositAmount,
                listingId: deposit.listingId,
                dashboardLink: `${process.env.CLIENT_URL}/dashboard/listings`,
            },
        });

        const smsSent = user.mobileNumber
            ? await sendSMS({
                to: user.mobileNumber,
                message: `Congratulations! Your deposit is approved. You are now an Instant Seller with ${user.escrowDepositAmount} USDT balance.`,
            })
            : false;

        // Create database notification for user history
        let savedNotification;
        try {
            savedNotification = await createNotification({
                userId: user._id,
                type: NOTIFICATION_TYPE.DEPOSIT_APPROVED,
                title: "🎉 Deposit Approved!",
                message: `Congratulations! Your deposit of ${deposit.totalDepositAmount} USDT is approved. You're now an Instant Seller!`,
                relatedModel: "InstantSellerDeposit",
                relatedId: deposit._id,
                actionUrl: "/market/my-listings",
            });
        } catch (dbError) {
            logger.error("Failed to save notification to DB for deposit approved:", dbError);
        }

        // Send socket notification to user for real-time update
        try {
            const userId = user._id.toString();
            logger.info("📢 Emitting deposit_approved notification to user", { userId, depositId: deposit._id });

            emitToUser(userId, "notification", {
                id: savedNotification?._id,
                type: "deposit_approved",
                title: "🎉 Deposit Approved!",
                message: `Congratulations! Your deposit of ${deposit.totalDepositAmount} USDT is approved. You're now an Instant Seller!`,
                depositId: deposit._id,
                listingId: deposit.listingId,
                escrowBalance: user.escrowDepositAmount,
            });

            // Also emit a specific event for deposit status update
            emitToUser(userId, "deposit:status_updated", {
                depositId: deposit._id,
                listingId: deposit.listingId,
                status: "approved",
                escrowBalance: user.escrowDepositAmount,
            });

            logger.info("✅ Socket notifications emitted successfully", { userId });
        } catch (socketError) {
            logger.error("Failed to send socket notification for deposit approved:", socketError);
        }

        deposit.notificationsSent.depositApproved = {
            email: emailSent,
            sms: smsSent,
            sentAt: new Date(),
        };
        await deposit.save();

        logger.info("Deposit approved notification sent", { depositId: deposit._id });
    } catch (error) {
        logger.error("Error sending deposit approved notification:", error);
    }
};

/**
 * Send deposit rejected notification
 */
export const sendDepositRejectedNotification = async (deposit, user) => {
    try {
        const emailSent = await sendEmail({
            to: user.email,
            subject: "Deposit Verification Failed",
            template: "deposit-rejected",
            data: {
                userName: user.name,
                rejectionReason: deposit.rejectionReason,
                canResubmit: deposit.canResubmit,
                supportLink: `${process.env.CLIENT_URL}/support`,
                resubmitLink: deposit.canResubmit
                    ? `${process.env.CLIENT_URL}/listings/instant-seller/create`
                    : null,
            },
        });

        const smsSent = user.mobileNumber
            ? await sendSMS({
                to: user.mobileNumber,
                message: `Your deposit verification failed. Reason: ${deposit.rejectionReason}. ${deposit.canResubmit ? "You can resubmit." : "Contact support."
                    }`,
            })
            : false;

        // Create database notification for user history
        let savedNotification;
        try {
            savedNotification = await createNotification({
                userId: user._id,
                type: NOTIFICATION_TYPE.DEPOSIT_REJECTED,
                title: "❌ Deposit Rejected",
                message: `Your deposit verification failed. Reason: ${deposit.rejectionReason}`,
                relatedModel: "InstantSellerDeposit",
                relatedId: deposit._id,
                actionUrl: "/wallet",
            });
        } catch (dbError) {
            logger.error("Failed to save notification to DB for deposit rejected:", dbError);
        }

        // Send socket notification to user for real-time update
        try {
            const userId = user._id.toString();
            logger.info("📢 Emitting deposit_rejected notification to user", { userId, depositId: deposit._id, reason: deposit.rejectionReason });

            emitToUser(userId, "notification", {
                id: savedNotification?._id,
                type: "deposit_rejected",
                title: "❌ Deposit Rejected",
                message: `Your deposit verification failed. Reason: ${deposit.rejectionReason}`,
                depositId: deposit._id,
                listingId: deposit.listingId,
                rejectionReason: deposit.rejectionReason,
                canResubmit: deposit.canResubmit,
            });

            // Also emit a specific event for deposit status update
            emitToUser(userId, "deposit:status_updated", {
                depositId: deposit._id,
                listingId: deposit.listingId,
                status: "rejected",
                rejectionReason: deposit.rejectionReason,
                canResubmit: deposit.canResubmit,
            });

            logger.info("✅ Socket notifications emitted successfully", { userId });
        } catch (socketError) {
            logger.error("Failed to send socket notification for deposit rejected:", socketError);
        }

        deposit.notificationsSent.depositRejected = {
            email: emailSent,
            sms: smsSent,
            sentAt: new Date(),
        };
        await deposit.save();

        logger.info("Deposit rejected notification sent", { depositId: deposit._id });
    } catch (error) {
        logger.error("Error sending deposit rejected notification:", error);
    }
};

/**
 * Send email helper — Uses SendGrid when SENDGRID_API_KEY is set,
 * falls back to nodemailer SMTP when SMTP_HOST is set,
 * otherwise logs to console (dev mode).
 */
const sendEmail = async ({ to, subject, template, data }) => {
    try {
        // ── 1. SendGrid (preferred for production) ──
        if (process.env.SENDGRID_API_KEY) {
            const { sendEmail: sgSend, sendGridConfig } = await import("../config/sendgrid.config.js");

            // Build a styled HTML body from template data
            const html = buildEmailHtml(subject, template, data);

            const result = await sgSend(to, subject, JSON.stringify(data), html);
            if (result.success) {
                logger.info("📧 Email sent via SendGrid", { to, subject, template });
                return true;
            }
            logger.warn("SendGrid send returned failure", { to, error: result.error });
            return false;
        }

        // ── 2. Nodemailer SMTP fallback ──
        if (process.env.SMTP_HOST || process.env.EMAIL_HOST) {
            const { sendEmail: smtpSend } = await import("../utils/email.util.js");
            const html = buildEmailHtml(subject, template, data);
            await smtpSend({ to, subject, text: JSON.stringify(data), html });
            logger.info("📧 Email sent via SMTP", { to, subject, template });
            return true;
        }

        // ── 3. Dev mode — console log ──
        logger.info("📧 Email (dev-mode, no provider configured)", {
            to,
            subject,
            template,
            data: JSON.stringify(data),
        });
        return true;
    } catch (error) {
        logger.error("Email sending failed:", error);
        return false;
    }
};

/**
 * Build a simple branded HTML email from template name + data.
 * Keeps things self-contained so we don't depend on SendGrid templates.
 */
const buildEmailHtml = (subject, template, data) => {
    const dataRows = Object.entries(data || {})
        .map(([key, val]) => `<tr><td style="padding:6px 12px;color:#6b7280;font-size:14px;">${key}</td><td style="padding:6px 12px;font-size:14px;">${val}</td></tr>`)
        .join("");

    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:24px;text-align:center;">
            <h2 style="color:#fff;margin:0;">Cryptians P2P</h2>
        </div>
        <div style="padding:24px;">
            <h3 style="color:#111827;">${subject}</h3>
            ${data?.userName ? `<p>Hi <strong>${data.userName}</strong>,</p>` : ""}
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                ${dataRows}
            </table>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af;">
            This is an automated email from Cryptians P2P. Please do not reply.
        </div>
    </div>`;
};

/**
 * Send SMS helper — Uses Twilio when TWILIO_ACCOUNT_SID is set,
 * otherwise logs to console (dev mode).
 */
const sendSMS = async ({ to, message }) => {
    try {
        // ── 1. Twilio (production) ──
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            const { sendSMS: twilioSend } = await import("../config/twilio.config.js");
            const result = await twilioSend(to, message);
            if (result.success) {
                logger.info("📱 SMS sent via Twilio", { to });
                return true;
            }
            logger.warn("Twilio SMS returned failure", { to, error: result.error });
            return false;
        }

        // ── 2. Dev mode — console log ──
        logger.info("📱 SMS (dev-mode, Twilio not configured)", { to, message });
        return true;
    } catch (error) {
        logger.error("SMS sending failed:", error);
        return false;
    }
};

export default {
    createNotification,
    notifyTradeInitiated,
    notifyEscrowConfirmed,
    notifyPaymentUploaded,
    notifyTradeCompleted,
    notifyTradeAppealed,
    notifyTradeCancelled,
    notifyAppealResolved,
    notifyKycStatus,
    markAsRead,
    getUserNotifications,
    getUnreadCount,
    sendDepositCreatedNotification,
    sendDepositApprovedNotification,
    sendDepositRejectedNotification,
    notifyPaymentConfirmedBySeller,
};
