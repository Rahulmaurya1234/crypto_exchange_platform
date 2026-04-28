// src/api/v1/platform-a/trades/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../../../utils/ApiError.js";
import * as tradeService from "../../../../services/trade.service.js";
import * as listingService from "../../../../services/listing.service.js";
import Trade from "../../../../models/Trade.model.js";
import { TRADE_STATUS } from "../../../../constants/index.js";
/**
 * Initiate trade
 * @route POST /api/v1/platform-a/trades
 * @access Private - Buyers
 */
export const initiateTrade = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;
  const tradeData = req.body;
  const lang = req.language || "en";

  const trade = await tradeService.initiateTrade(buyerId, tradeData);

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { trade },
        "Trade initiated successfully. Waiting for seller to deposit crypto."
      )
    );
});

/**
 * Get trade by ID
 * @route GET /api/v1/platform-a/trades/:id
 * @access Private
 */
export const getTradeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const lang = req.language || "en";

  const trade = await tradeService.getTradeById(id, userId);

  if (!trade) {
    throw NotFoundError("Trade not found", {}, lang);
  }

  // Check if user is authorized (buyer or seller)
  if (
    trade.buyerId._id.toString() !== userId.toString() &&
    trade.sellerId._id.toString() !== userId.toString()
  ) {
    throw ForbiddenError("You are not authorized to view this trade", {}, lang);
  }

  res.json(new ApiResponse(200, { trade }, "Trade retrieved successfully"));
});

/**
 * Get user's trades
 * @route GET /api/v1/platform-a/trades
 * @access Private
 */
export const getUserTrades = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = req.query;

  const result = await tradeService.getUserTrades(userId, filters);

  res.json(
    new ApiResponse(
      200,
      {
        trades: result.trades,
        pagination: result.pagination,
      },
      "Trades retrieved successfully"
    )
  );
});

/**
 * Mark escrow deposited (Seller)
 * @route POST /api/v1/platform-a/trades/:id/deposit-escrow
 * @access Private - Sellers
 */
export const markEscrowDeposited = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sellerId = req.user._id;
  const { transactionHash, escrowAddress } = req.body;
  const lang = req.language || "en";

  const trade = await tradeService.markEscrowDeposited(
    id,
    sellerId,
    transactionHash,
    escrowAddress
  );

  res.json(
    new ApiResponse(
      200,
      { trade },
      "Escrow deposit confirmed. Buyer can now make payment."
    )
  );
});

/**
 * Upload payment proof (Buyer)
 * @route POST /api/v1/platform-a/trades/:id/upload-payment
 * @access Private - Buyers
 */
export const uploadPaymentProof = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const buyerId = req.user._id;
  const paymentDetails = req.body;
  const lang = req.language || "en";

  const trade = await tradeService.uploadPaymentProof(
    id,
    buyerId,
    paymentDetails
  );

  res.json(
    new ApiResponse(
      200,
      { trade },
      "Payment proof uploaded. Waiting for seller confirmation."
    )
  );
});

/**
 * Confirm payment (Seller)
 * @route POST /api/v1/platform-a/trades/:id/confirm-payment
 * @access Private - Sellers
 */
export const confirmPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sellerId = req.user._id;
  const { remarks } = req.body;
  const lang = req.language || "en";

  const trade = await tradeService.confirmPayment(id, sellerId, remarks);

  res.json(
    new ApiResponse(
      200,
      { trade },
      "Payment confirmed. Trade will be completed shortly."
    )
  );
});

/**
 * Complete trade (Release escrow)
 * @route POST /api/v1/platform-a/trades/:id/complete
 * @access Private - Sellers (or Admin)
 */
export const completeTrade = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { releaseHash } = req.body;
  const lang = req.language || "en";

  const trade = await tradeService.completeTrade(id, releaseHash);

  res.json(
    new ApiResponse(
      200,
      { trade },
      "Trade completed successfully! Crypto has been released to buyer."
    )
  );
});

/**
 * Cancel trade
 * @route POST /api/v1/platform-a/trades/:id/cancel
 * @access Private
 */
// export const cancelTrade = asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user._id;
//     const { reason } = req.body;
//     const lang = req.language || "en";

//     const trade = await tradeService.cancelTrade(id, userId, reason);

//     res.json(new ApiResponse(200, { trade }, "Trade cancelled successfully"));
// });

/**
 * Get user's trade statistics
 * @route GET /api/v1/platform-a/trades/stats
 * @access Private
 */
export const getUserTradeStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await tradeService.getUserTradeStats(userId);

  res.json(
    new ApiResponse(200, { stats }, "Trade statistics retrieved successfully")
  );
});

/**
 * Calculate order amount (Live calculation for buyer)
 * @route GET /api/v1/platform-a/trades/calculate
 * @access Public
 */
// export const calculateAmount = asyncHandler(async (req, res) => {
//     const { listingId, cryptoAmount } = req.query;
//     const lang = req.language || "en";

//     if (!listingId || !cryptoAmount) {
//         throw BadRequestError("listingId and cryptoAmount are required", {}, lang);
//     }

//     const calculation = await tradeService.calculateOrderAmount(listingId, parseFloat(cryptoAmount));

//     res.json(
//         new ApiResponse(
//             200,
//             { calculation },
//             "Order amount calculated successfully"
//         )
//     );
// });

export const calculateAmount = asyncHandler(async (req, res) => {
  const { listingId, amount, currency } = req.query;
  const lang = req.language || "en";

  if (!listingId || !amount || !currency) {
    throw BadRequestError(
      "listingId, amount and currency are required",
      {},
      lang
    );
  }

  const numericAmount = parseFloat(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw BadRequestError("Amount must be a valid number", {}, lang);
  }

  /**
   * currency:
   * - "INR"  → convert INR → USDT
   * - "USDT" → convert USDT → INR
   */
  let calculation;

  if (currency === "INR") {
    calculation = await tradeService.calculateInrToUsdt(
      listingId,
      numericAmount
    );
  } else if (currency === "USDT") {
    calculation = await tradeService.calculateUsdtToInr(
      listingId,
      numericAmount
    );
  } else {
    throw BadRequestError(
      "Invalid currency. Allowed values: INR or USDT",
      {},
      lang
    );
  }

  res.json(
    new ApiResponse(
      200,
      {
        listingId,
        inputAmount: numericAmount,
        inputCurrency: currency,
        ...calculation,
      },
      "Order amount calculated successfully"
    )
  );
});

/**
 * Submit deposit hash (Seller submits blockchain tx hash)
 * @route POST /api/v1/platform-a/trades/:id/submit-deposit
 * @access Private - Sellers
 */
export const submitDepositHash = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sellerId = req.user._id;
  const { transactionHash } = req.body;
  const lang = req.language || "en";

  if (!transactionHash) {
    throw BadRequestError("Transaction hash is required", {}, lang);
  }

  const trade = await tradeService.submitDepositHash(
    id,
    sellerId,
    transactionHash
  );

  res.json(
    new ApiResponse(
      200,
      { trade },
      "Deposit hash submitted successfully. Waiting for verification."
    )
  );
});

/**
 * Confirm Instant Seller Trade (Seller accepts the trade request)
 * @route POST /api/v1/platform-a/trades/:id/confirm-instant-seller
 * @access Private - Instant Sellers only
 */
export const confirmInstantSellerTrade = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sellerId = req.user._id;
  const remarks = req.body?.remarks || ""; // ✅ Safe access with optional chaining
  const lang = req.language || "en";

  const trade = await tradeService.confirmInstantSellerTrade(
    id,
    sellerId,
    remarks
  );

  res.json(
    new ApiResponse(
      200,
      { trade },
      "Trade confirmed successfully. Escrow locked. Buyer can now proceed with payment."
    )
  );
});

/**
 * Mark payment as NOT credited (Seller - creates dispute)
 * @route POST /api/v1/platform-a/trades/:id/mark-not-credited
 * @access Private - Sellers
 */
export const markNotCredited = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sellerId = req.user._id;
  const { reason } = req.body;
  const lang = req.language || "en";

  const result = await tradeService.markNotCredited(id, sellerId, reason);

  // Audit Log
  await logDisputeAction(
      AUDIT_ACTION.DISPUTE_CREATE,
      sellerId,
      req.user.role,
      id,
      { reason, type: "payment_not_credited" },
      req
  );

  res.json(
    new ApiResponse(
      200,
      result,
      "Payment dispute created. Support team will investigate."
    )
  );
});

/**
 * Mark payment as CREDITED (Seller confirms INR received)
 * @route POST /api/v1/platform-a/trades/:id/mark-credited
 * @access Private - Sellers
 */
export const markCredited = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sellerId = req.user._id;
  const { remarks } = req.body;
  const lang = req.language || "en";

  const trade = await tradeService.markCredited(id, sellerId, remarks);

  res.json(
    new ApiResponse(
      200,
      { trade },
      "Payment confirmed. Escrow will be released to buyer shortly."
    )
  );
});

/**
 * Cancel trade (buyer or seller)
 * POST /api/v1/platform-a/trade/:tradeId/cancel
 */
export const cancelTrade = asyncHandler(async (req, res) => {
  const { tradeId } = req.params;
  const userId = req.user._id;
  const lang = req.language || "en";

  // ✅ Safe destructuring
  const reason =
    typeof req.body?.reason === "string" && req.body.reason.trim()
      ? req.body.reason.trim()
      : "Cancelled by user";

  const trade = await Trade.findById(tradeId);
  if (!trade) {
    throw NotFoundError("Trade not found", {}, lang);
  }

  // ✅ Only buyer or seller can cancel
  const isBuyer = trade.buyerId.toString() === userId.toString();
  const isSeller = trade.sellerId.toString() === userId.toString();

  if (!isBuyer && !isSeller) {
    throw BadRequestError(
      "You are not allowed to cancel this trade",
      {},
      lang
    );
  }

  // ✅ Block terminal states
  if (
    trade.status === TRADE_STATUS.COMPLETED ||
    trade.status === TRADE_STATUS.CANCELLED ||
    trade.status === TRADE_STATUS.DISPUTED
  ) {
    throw BadRequestError("Trade already closed", {}, lang);
  }

  // ✅ Cancel via instance method
  await trade.cancel(userId, reason);
  // 🔥 post("save") middleware AUTO-RUNS here
  // 🔥 chat.tradeId AUTO-CLEARS here
  // ✅ Release reserved listing amount (ONLY if trade had reserved funds)
  await listingService.releaseReservedAmount(
    trade.listingId,
    trade.cryptoAmount
  );

  return res.json(
    new ApiResponse(200, { trade }, "Trade cancelled successfully")
  );
});

/**
 * Appeal a trade
 * @route POST /api/v1/platform-a/trades/:id/appeal
 * @access Private
 */
export const appealTrade = asyncHandler(async (req, res) => {
  const { id: tradeId } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;
  const lang = req.language || "en";

  if (!reason) {
    throw new BadRequestError("Reason for appeal is required", {}, lang);
  }

  const trade = await tradeService.appealTrade(tradeId, userId, reason);

  res.json(new ApiResponse(200, { trade }, "Trade appealed successfully"));
});

export default {
  initiateTrade,
  getTradeById,
  getUserTrades,
  markEscrowDeposited,
  uploadPaymentProof,
  confirmPayment,
  completeTrade,
  cancelTrade,
  getUserTradeStats,
  // New Phase 1 controllers
  calculateAmount,
  submitDepositHash,
  markNotCredited,
  markCredited,
  appealTrade,
};
