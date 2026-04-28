// src/api/v1/platform-b/trades/controller.js

import * as tradeService from "../../../../services/trade.service.js";
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import { BadRequestError, NotFoundError } from "../../../../utils/ApiError.js";

/**
 * @route   GET /api/v1/platform-b/trades/deposited
 * @desc    Get all deposited trades
 * @access  Admin
 */
export const getDepositedTradesController = asyncHandler(async (req, res) => {
    const requestingUserId = req.user?._id || null;

    const trades = await tradeService.getAllDepositedTrades(requestingUserId);

    return res.status(200).json(
        new ApiResponse(
            200,
            trades || [],
            "Deposited trades fetched successfully"
        )
    );
});
/**
 * @route   GET /api/v1/platform-b/trades/appealed
 * @desc    Get all appealed trades
 * @access  Admin
 */
export const getAppealedTradesController = asyncHandler(async (req, res) => {
    const trades = await tradeService.getAllAppealedTrades();

    return res.status(200).json(
        new ApiResponse(
            200,
            trades || [],
            "Appealed trades fetched successfully"
        )
    );
});
