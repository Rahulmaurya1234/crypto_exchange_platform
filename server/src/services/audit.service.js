// src/services/audit.service.js
import AuditLog from "../models/AuditLog.model.js";
import { AUDIT_ACTION } from "../constants/index.js";
import { logger } from "../utils/logger.js";

/**
 * Create audit log entry
 */
export const createAuditLog = async (logData) => {
    try {
        const auditLog = await AuditLog.create({
            ...logData,
            timestamp: new Date(),
        });

        // Also log to Winston for redundancy
        logger.info("AUDIT_LOG", {
            action: logData.action,
            actor: logData.actorId,
            target: `${logData.targetModel}:${logData.targetId}`,
        });

        return auditLog;
    } catch (error) {
        logger.error("Failed to create audit log:", error);
        // Don't throw - audit logging should not break main flow
    }
};

/**
 * Log user action
 */
export const logUserAction = async (action, userId, userRole, details = {}, req = null) => {
    return createAuditLog({
        action,
        actorId: userId,
        actorRole: userRole,
        details,
        ipAddress: req?.ip,
        userAgent: req?.get("user-agent"),
    });
};

/**
 * Log login
 */
export const logLogin = async (userId, userRole, req) => {
    return logUserAction(AUDIT_ACTION.USER_LOGIN, userId, userRole, {
        method: "email",
    }, req);
};

/**
 * Log logout
 */
export const logLogout = async (userId, userRole, req) => {
    return logUserAction(AUDIT_ACTION.USER_LOGOUT, userId, userRole, {}, req);
};

/**
 * Log KYC submission
 */
export const logKycSubmit = async (userId, userRole, kycId, req) => {
    return createAuditLog({
        action: AUDIT_ACTION.KYC_SUBMIT,
        actorId: userId,
        actorRole: userRole,
        targetModel: "KYC",
        targetId: kycId,
        ipAddress: req?.ip,
        userAgent: req?.get("user-agent"),
    });
};

/**
 * Log KYC approval/rejection
 */
export const logKycReview = async (adminId, adminRole, kycId, action, reason, req) => {
    return createAuditLog({
        action: action === "approve" ? AUDIT_ACTION.KYC_APPROVE : AUDIT_ACTION.KYC_REJECT,
        actorId: adminId,
        actorRole: adminRole,
        targetModel: "KYC",
        targetId: kycId,
        details: { reason },
        ipAddress: req?.ip,
        userAgent: req?.get("user-agent"),
    });
};

/**
 * Log trade actions
 */
export const logTradeAction = async (action, userId, userRole, tradeId, details = {}, req = null) => {
    return createAuditLog({
        action,
        actorId: userId,
        actorRole: userRole,
        targetModel: "Trade",
        targetId: tradeId,
        details,
        ipAddress: req?.ip,
        userAgent: req?.get("user-agent"),
    });
};

/**
 * Log escrow action
 */
export const logEscrowAction = async (action, userId, userRole, escrowTxId, details = {}, req = null) => {
    return createAuditLog({
        action,
        actorId: userId,
        actorRole: userRole,
        targetModel: "EscrowTransaction",
        targetId: escrowTxId,
        details,
        ipAddress: req?.ip,
        userAgent: req?.get("user-agent"),
    });
};

/**
 * Log user status change (suspend/ban)
 */
export const logUserStatusChange = async (adminId, adminRole, targetUserId, action, reason, req) => {
    return createAuditLog({
        action,
        actorId: adminId,
        actorRole: adminRole,
        targetModel: "User",
        targetId: targetUserId,
        details: { reason },
        ipAddress: req?.ip,
        userAgent: req?.get("user-agent"),
    });
};

/**
 * Get audit logs (admin only)
 */
export const getAuditLogs = async (filters = {}, page = 1, limit = 50) => {
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.action) query.action = filters.action;
    if (filters.actorId) query.actorId = filters.actorId;
    if (filters.targetModel) query.targetModel = filters.targetModel;
    if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
        if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .populate("actorId", "name email role")
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit),
        AuditLog.countDocuments(query),
    ]);

    return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Log listing actions
 */
export const logListingAction = async (action, userId, userRole, listingId, details = {}, req = null) => {
    return createAuditLog({
        action,
        actorId: userId,
        actorRole: userRole,
        targetModel: "Listing",
        targetId: listingId,
        details,
        ipAddress: req?.ip,
        userAgent: req?.get("user-agent"),
    });
};

/**
 * Log dispute actions
 */
export const logDisputeAction = async (action, userId, userRole, disputeId, details = {}, req = null) => {
    return createAuditLog({
        action,
        actorId: userId,
        actorRole: userRole,
        targetModel: "Dispute",
        targetId: disputeId,
        details,
        ipAddress: req?.ip,
        userAgent: req?.get("user-agent"),
    });
};

export default {
    createAuditLog,
    logUserAction,
    logLogin,
    logLogout,
    logKycSubmit,
    logKycReview,
    logTradeAction,
    logListingAction,
    logDisputeAction,
    logEscrowAction,
    logUserStatusChange,
    getAuditLogs,
};
