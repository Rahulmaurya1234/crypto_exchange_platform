import * as auditService from "../services/audit.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ... (createLog helper kept as legacy fallback if needed, or removed) ...

/**
 * Helper: Create Log (Legacy Bridge)
 * Keeping it for backward compatibility if other parts of the system call it, 
 * but it now creates an AuditLog.
 */
export const createLog = async ({ adminId, targetType, targetId, action, reason, metadata }) => {
    try {
        await auditService.createAuditLog({
            action,
            actorId: adminId,
            actorRole: "admin",
            targetModel: targetType === "user" ? "User" : targetType === "kyc" ? "KYC" : "Listing",
            targetId,
            details: { reason, ...metadata },
        });
    } catch (error) {
        console.error("Failed to create audit log via bridge:", error);
    }
};

// -------------------------
// Admin: Get Logs
// -------------------------
export const getLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type, action } = req.query;
    
    const filters = {
        targetModel: type,
        action: action,
    };

    const result = await auditService.getAuditLogs(filters, parseInt(page), parseInt(limit));

    return res.status(200).json(
        new ApiResponse(200, {
            logs: result.logs,
            pagination: {
                total: result.total,
                page: result.page,
                limit: parseInt(limit),
                pages: result.totalPages,
            },
        }, "Audit logs fetched successfully")
    );
});
