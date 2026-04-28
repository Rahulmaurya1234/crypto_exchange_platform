// src/api/v1/platform-b/support/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import * as chatService from "../../../../services/chat.service.js";
import * as disputeService from "../../../../services/dispute.service.js";

/**
 * Get support tickets (disputes)
 * @route GET /api/v1/platform-b/support/tickets
 * @access Support
 */
export const getSupportTickets = asyncHandler(async (req, res) => {
    const filters = req.query;

    const result = await disputeService.getAllDisputes(filters);

    res.json(
        new ApiResponse(
            200,
            {
                tickets: result.disputes,
                pagination: result.pagination,
            },
            "Support tickets retrieved successfully"
        )
    );
});

/**
 * Get assigned tickets
 * @route GET /api/v1/platform-b/support/my-tickets
 * @access Support
 */
export const getMyTickets = asyncHandler(async (req, res) => {
    const supportAgentId = req.user._id;
    const filters = req.query;

    const result = await disputeService.getAllDisputes({
        ...filters,
        assignedTo: supportAgentId,
    });

    res.json(
        new ApiResponse(
            200,
            {
                tickets: result.disputes,
                pagination: result.pagination,
            },
            "Assigned tickets retrieved successfully"
        )
    );
});

/**
 * Join chat as support agent
 * @route POST /api/v1/platform-b/support/chat/:chatId/join
 * @access Support
 */
export const joinChat = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const supportUserId = req.user._id;

    const chat = await chatService.addSupportAgent(chatId, supportUserId);

    res.json(new ApiResponse(200, { chat }, "Joined chat successfully"));
});

/**
 * Get support statistics
 * @route GET /api/v1/platform-b/support/stats
 * @access Support/Admin
 */
export const getSupportStats = asyncHandler(async (req, res) => {
    const stats = await disputeService.getDisputeStats();

    res.json(new ApiResponse(200, { stats }, "Support statistics retrieved successfully"));
});

export default {
    getSupportTickets,
    getMyTickets,
    joinChat,
    getSupportStats,
};
