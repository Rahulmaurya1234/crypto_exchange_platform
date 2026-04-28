// src/api/v1/platform-b/escrow/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import { BadRequestError, NotFoundError } from "../../../../utils/ApiError.js";
import * as escrowService from "../../../../services/escrow.service.js";

/**
 * Get all escrow transactions (Admin)
 * @route GET /api/v1/platform-b/escrow
 * @access Admin
 */
export const getAllEscrowTransactions = asyncHandler(async (req, res) => {
    const filters = req.query;

    const result = await escrowService.getAllEscrowTransactions(filters);

    res.json(
        new ApiResponse(
            200,
            {
                transactions: result.transactions,
                pagination: result.pagination,
            },
            "Escrow transactions retrieved successfully"
        )
    );
});

/**
 * Get pending escrow transactions (Admin)
 * @route GET /api/v1/platform-b/escrow/pending
 * @access Admin
 */
export const getPendingTransactions = asyncHandler(async (req, res) => {
    const filters = req.query;

    const result = await escrowService.getPendingTransactions(filters);

    res.json(
        new ApiResponse(
            200,
            {
                transactions: result.transactions,
                pagination: result.pagination,
            },
            "Pending escrow transactions retrieved successfully"
        )
    );
});

/**
 * Get escrow transaction by ID (Admin)
 * @route GET /api/v1/platform-b/escrow/:id
 * @access Admin
 */
export const getEscrowTransactionById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const lang = req.language || "en";

    const transaction = await escrowService.getEscrowTransactionById(id);

    if (!transaction) {
        throw NotFoundError("Escrow transaction not found", {}, lang);
    }

    res.json(
        new ApiResponse(200, { transaction }, "Escrow transaction retrieved successfully")
    );
});

/**
 * Get escrow transaction by hash (Admin)
 * @route GET /api/v1/platform-b/escrow/hash/:hash
 * @access Admin
 */
export const getEscrowTransactionByHash = asyncHandler(async (req, res) => {
    const { hash } = req.params;
    const lang = req.language || "en";

    const transaction = await escrowService.getEscrowTransactionByHash(hash);

    if (!transaction) {
        throw NotFoundError("Escrow transaction not found", {}, lang);
    }

    res.json(
        new ApiResponse(200, { transaction }, "Escrow transaction retrieved successfully")
    );
});

/**
 * Update transaction status (Admin)
 * @route POST /api/v1/platform-b/escrow/:id/status
 * @access Admin
 */
export const updateTransactionStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, failureReason } = req.body;
    const adminId = req.user._id;
    const lang = req.language || "en";

    if (!status) {
        throw BadRequestError("Status is required", {}, lang);
    }

    const transaction = await escrowService.updateTransactionStatus(
        id,
        status,
        adminId,
        failureReason
    );

    res.json(
        new ApiResponse(
            200,
            { transaction },
            "Escrow transaction status updated successfully"
        )
    );
});

/**
 * Update confirmations (Admin/System)
 * @route POST /api/v1/platform-b/escrow/hash/:hash/confirmations
 * @access Admin
 */
export const updateConfirmations = asyncHandler(async (req, res) => {
    const { hash } = req.params;
    const { confirmations, blockNumber } = req.body;
    const lang = req.language || "en";

    if (confirmations === undefined || !blockNumber) {
        throw BadRequestError("Confirmations and block number are required", {}, lang);
    }

    const transaction = await escrowService.updateConfirmations(hash, confirmations, blockNumber);

    res.json(
        new ApiResponse(
            200,
            { transaction },
            "Confirmations updated successfully"
        )
    );
});

/**
 * Get escrow statistics (Admin)
 * @route GET /api/v1/platform-b/escrow/stats
 * @access Admin
 */
export const getEscrowStats = asyncHandler(async (req, res) => {
    const stats = await escrowService.getEscrowStats();

    res.json(new ApiResponse(200, { stats }, "Escrow statistics retrieved successfully"));
});

/**
 * Get user's escrow transactions (Admin)
 * @route GET /api/v1/platform-b/escrow/user/:userId
 * @access Admin
 */
export const getUserEscrowTransactions = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const filters = req.query;

    const result = await escrowService.getUserEscrowTransactions(userId, filters);

    res.json(
        new ApiResponse(
            200,
            {
                transactions: result.transactions,
                pagination: result.pagination,
            },
            "User's escrow transactions retrieved successfully"
        )
    );
});

/**
 * Verify deposit for trade (Platform B action)
 * @route POST /api/v1/platform-b/escrow/:tradeId/verify-deposit
 * @access Admin
 */
export const verifyDeposit = asyncHandler(async (req, res) => {
    const { tradeId } = req.params;
    const { isValid, remarks } = req.body;
    const adminId = req.user._id;
    const lang = req.language || "en";

    if (isValid === undefined) {
        throw BadRequestError("isValid field is required", {}, lang);
    }

    const result = await escrowService.verifyTradeDeposit(tradeId, adminId, isValid, remarks);

    res.json(
        new ApiResponse(
            200,
            result,
            isValid
                ? "Deposit verified successfully. Buyer can now proceed with payment."
                : "Deposit verification failed. Trade has been cancelled."
        )
    );
});

/**
 * Release escrow to buyer (Platform B action)
 * @route POST /api/v1/platform-b/escrow/:tradeId/release-to-buyer
 * @access Admin
 */
export const releaseToBuyer = asyncHandler(async (req, res) => {
    const { tradeId } = req.params;
    const { releaseHash } = req.body;
    const adminId = req.user._id;
    const lang = req.language || "en";

    if (!releaseHash) {
        throw BadRequestError("Release transaction hash is required", {}, lang);
    }

    const result = await escrowService.releaseEscrowToBuyer(tradeId, adminId, releaseHash);

    res.json(
        new ApiResponse(
            200,
            result,
            "Escrow released to buyer successfully. Trade completed."
        )
    );
});

/**
 * Refund escrow to seller (Platform B action - Dispute resolution)
 * @route POST /api/v1/platform-b/escrow/:tradeId/refund-to-seller
 * @access Admin
 */
export const refundToSeller = asyncHandler(async (req, res) => {
    const { tradeId } = req.params;
    const { refundHash, reason } = req.body;
    const adminId = req.user._id;
    const lang = req.language || "en";

    if (!refundHash) {
        throw BadRequestError("Refund transaction hash is required", {}, lang);
    }

    const result = await escrowService.refundEscrowToSeller(tradeId, adminId, refundHash, reason);

    res.json(
        new ApiResponse(
            200,
            result,
            "Escrow refunded to seller successfully."
        )
    );
});

export default {
    getAllEscrowTransactions,
    getPendingTransactions,
    getEscrowTransactionById,
    getEscrowTransactionByHash,
    updateTransactionStatus,
    updateConfirmations,
    getEscrowStats,
    getUserEscrowTransactions,
    // Phase 1 - Trade flow controllers
    verifyDeposit,
    releaseToBuyer,
    refundToSeller,
};
