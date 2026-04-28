// src/services/dispute.service.js
import Dispute from "../models/Dispute.model.js";
import Trade from "../models/Trade.model.js";
import { DISPUTE_STATUS, DISPUTE_RESOLUTION } from "../constants/index.js";
import { logger } from "../utils/logger.js";

/**
 * Create dispute
 */
export const createDispute = async (tradeId, userId, disputeData) => {
    try {
        const { reason, evidence } = disputeData;

        // Check if trade exists
        const trade = await Trade.findOne({
            _id: tradeId,
            $or: [{ buyerId: userId }, { sellerId: userId }],
        });

        if (!trade) {
            throw new Error("Trade not found or unauthorized");
        }

        // Check if dispute already exists
        const existingDispute = await Dispute.findOne({ tradeId });
        if (existingDispute) {
            throw new Error("Dispute already exists for this trade");
        }

        // Create dispute
        const dispute = new Dispute({
            tradeId,
            createdBy: userId,
            reason,
            evidence: evidence || [],
            status: DISPUTE_STATUS.OPEN,
        });

        await dispute.save();

        // Update trade
        await trade.createDispute(dispute._id);

        logger.info("Dispute created", { disputeId: dispute._id, tradeId, userId });

        return dispute;
    } catch (error) {
        logger.error("Error creating dispute:", error);
        throw error;
    }
};

/**
 * Get dispute by ID
 */
export const getDisputeById = async (disputeId) => {
    return await Dispute.findById(disputeId)
        .populate({
            path: "tradeId",
            populate: [
                { path: "buyerId", select: "name email" },
                { path: "sellerId", select: "name email" },
            ],
        })
        .populate("createdBy", "name email avatar")
        .populate("assignedTo", "name email")
        .populate("resolvedBy", "name email");
};

/**
 * Get dispute by trade ID
 */
export const getDisputeByTradeId = async (tradeId) => {
    return await Dispute.findOne({ tradeId })
        .populate({
            path: "tradeId",
            populate: [
                { path: "buyerId", select: "name email" },
                { path: "sellerId", select: "name email" },
            ],
        })
        .populate("createdBy", "name email avatar")
        .populate("assignedTo", "name email")
        .populate("resolvedBy", "name email");
};

/**
 * Add evidence to dispute
 */
export const addEvidence = async (disputeId, userId, evidenceData) => {
    try {
        const dispute = await Dispute.findById(disputeId).populate("tradeId");

        if (!dispute) {
            throw new Error("Dispute not found");
        }

        // Verify user is involved in the trade
        const trade = dispute.tradeId;
        if (
            trade.buyerId.toString() !== userId.toString() &&
            trade.sellerId.toString() !== userId.toString()
        ) {
            throw new Error("Unauthorized to add evidence");
        }

        dispute.evidence.push({
            type: evidenceData.type,
            url: evidenceData.url,
            description: evidenceData.description,
            uploadedAt: new Date(),
        });

        await dispute.save();

        logger.info("Evidence added to dispute", { disputeId, userId });

        return dispute;
    } catch (error) {
        logger.error("Error adding evidence:", error);
        throw error;
    }
};

/**
 * Assign dispute to support agent (Admin)
 */
export const assignDispute = async (disputeId, supportAgentId) => {
    try {
        const dispute = await Dispute.findById(disputeId);

        if (!dispute) {
            throw new Error("Dispute not found");
        }

        dispute.assignedTo = supportAgentId;
        dispute.assignedAt = new Date();
        dispute.status = DISPUTE_STATUS.ASSIGNED;

        await dispute.save();

        logger.info("Dispute assigned", { disputeId, supportAgentId });

        return dispute;
    } catch (error) {
        logger.error("Error assigning dispute:", error);
        throw error;
    }
};

/**
 * Resolve dispute (Admin)
 */
export const resolveDispute = async (disputeId, resolutionData, adminId) => {
    try {
        const { resolution, resolutionNotes } = resolutionData;

        const dispute = await Dispute.findById(disputeId);

        if (!dispute) {
            throw new Error("Dispute not found");
        }

        dispute.status = DISPUTE_STATUS.RESOLVED;
        dispute.resolution = resolution;
        dispute.resolutionNotes = resolutionNotes;
        dispute.resolvedAt = new Date();
        dispute.resolvedBy = adminId;

        await dispute.save();

        logger.info("Dispute resolved", { disputeId, resolution, adminId });

        return dispute;
    } catch (error) {
        logger.error("Error resolving dispute:", error);
        throw error;
    }
};

/**
 * Get all disputes (Admin)
 */
export const getAllDisputes = async (filters = {}) => {
    const { page = 1, limit = 20, status, assignedTo } = filters;

    const query = {};

    if (status) {
        query.status = status;
    }

    if (assignedTo) {
        query.assignedTo = assignedTo;
    }

    const skip = (page - 1) * limit;

    const [disputes, total] = await Promise.all([
        Dispute.find(query)
            .populate({
                path: "tradeId",
                select: "tradeNumber cryptoAmount status buyerId sellerId",
                populate: [
                    { path: "buyerId", select: "name email" },
                    { path: "sellerId", select: "name email" },
                ],
            })
            .populate("createdBy", "name email")
            .populate("assignedTo", "name email")
            .populate("resolvedBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Dispute.countDocuments(query),
    ]);

    return {
        disputes,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get open disputes (Admin)
 */
export const getOpenDisputes = async (filters = {}) => {
    return await getAllDisputes({
        ...filters,
        status: DISPUTE_STATUS.OPEN,
    });
};

/**
 * Get dispute statistics
 */
export const getDisputeStats = async () => {
    const stats = await Dispute.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);

    const formattedStats = {
        total: await Dispute.countDocuments(),
        byStatus: {},
    };

    stats.forEach((stat) => {
        formattedStats.byStatus[stat._id] = stat.count;
    });

    return formattedStats;
};

export default {
    createDispute,
    getDisputeById,
    getDisputeByTradeId,
    addEvidence,
    assignDispute,
    resolveDispute,
    getAllDisputes,
    getOpenDisputes,
    getDisputeStats,
};
