// src/api/v1/platform-b/disputes/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../../../utils/ApiError.js";
import * as disputeService from "../../../../services/dispute.service.js";
import { logDisputeAction } from "../../../../services/audit.service.js";
import { AUDIT_ACTION } from "../../../../constants/index.js";

import * as tradeService from "../../../../services/trade.service.js";

/**
 * Get all disputes (Admin)
 * @route GET /api/v1/platform-b/disputes
 * @access Admin
 */
export const getAllDisputes = asyncHandler(async (req, res) => {
    const filters = req.query;
    const result = await disputeService.getAllDisputes(filters);
    res.json(new ApiResponse(200, result, "Disputes fetched successfully"));
});

/**
 * Get open disputes (Admin)
 * @route GET /api/v1/platform-b/disputes/open
 * @access Admin
 */
export const getOpenDisputes = asyncHandler(async (req, res) => {
    const filters = req.query;
    const result = await disputeService.getOpenDisputes(filters);
    res.json(new ApiResponse(200, result, "Open disputes fetched successfully"));
});

/**
 * Get dispute by ID (Admin)
 * @route GET /api/v1/platform-b/disputes/:id
 * @access Admin
 */
export const getDisputeById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const lang = req.language || "en";

    const dispute = await disputeService.getDisputeById(id);

    if (!dispute) {
        throw new NotFoundError("Dispute not found", {}, lang);
    }

    res.json(new ApiResponse(200, { dispute }, "Dispute fetched successfully"));
});

/**
 * Assign dispute to support agent (Admin)
 * @route POST /api/v1/platform-b/disputes/:id/assign
 * @access Admin
 */
export const assignDispute = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { supportAgentId } = req.body;
    const adminId = req.user._id;
    const lang = req.language || "en";

    if (!supportAgentId) {
        throw BadRequestError("Support agent ID is required", {}, lang);
    }

    const dispute = await disputeService.assignDispute(id, supportAgentId);

    // Audit Log
    await logDisputeAction(
        AUDIT_ACTION.DISPUTE_UPDATE,
        adminId,
        req.user.role,
        id,
        { event: "assigned", supportAgentId },
        req
    );

    res.json(new ApiResponse(200, { dispute }, "Dispute assigned successfully"));
});

/**
 * Resolve dispute (Admin)
 * @route POST /api/v1/platform-b/disputes/:id/resolve
 * @access Admin
 */
export const resolveDispute = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const resolutionData = req.body;
    const adminId = req.user._id;
    const lang = req.language || "en";

    const dispute = await disputeService.resolveDispute(id, resolutionData, adminId);

    // Audit Log
    await logDisputeAction(
        AUDIT_ACTION.DISPUTE_RESOLVE,
        adminId,
        req.user.role,
        id,
        { resolution: resolutionData.resolution },
        req
    );

    res.json(new ApiResponse(200, { dispute }, "Dispute resolved successfully"));
});

/**
 * Get dispute statistics (Admin)
 * @route GET /api/v1/platform-b/disputes/stats
 * @access Admin
 */
export const getDisputeStats = asyncHandler(async (req, res) => {
    const stats = await disputeService.getDisputeStats();

    res.json(new ApiResponse(200, { stats }, "Dispute statistics retrieved successfully"));
});

/**
 * Resolve an appeal (Admin)
 * @route POST /api/v1/platform-b/disputes/:id/resolve-appeal
 * @access Admin
 */
export const resolveAppeal = asyncHandler(async (req, res) => {
    const { id: tradeId } = req.params;
    const { decision, remarks } = req.body;
    const adminId = req.user._id;
    const lang = req.language || "en";

    if (!decision || !remarks) {
        throw BadRequestError("Decision and remarks are required", {}, lang);
    }

    const trade = await tradeService.resolveAppeal(tradeId, adminId, decision, remarks);

    // Audit Log (Using logDisputeAction for appeal too, as it's a dispute variant)
    await logDisputeAction(
        AUDIT_ACTION.DISPUTE_RESOLVE,
        adminId,
        req.user.role,
        tradeId,
        { event: "appeal_resolved", decision, remarks },
        req
    );

    res.json(new ApiResponse(200, { trade }, "Appeal resolved successfully"));
});

export default {
    getAllDisputes,
    getOpenDisputes,
    getDisputeById,
    assignDispute,
    resolveDispute,
    getDisputeStats,
    resolveAppeal,
};
