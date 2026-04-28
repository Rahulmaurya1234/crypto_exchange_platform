// src/api/v1/platform-a/trades/routes.js
import { Router } from "express";
import * as tradeController from "./controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";
import { validate } from "../../../../middleware/validate.middleware.js";
// Note: Validators should be created in validators/trade.validator.js

const router = Router();

/**
 * @route   POST /api/v1/platform-a/trades
 * @desc    Initiate new trade
 * @access  Private - Buyers
 */
router.post("/", auth, tradeController.initiateTrade);

/**
 * @route   GET /api/v1/platform-a/trades/calculate
 * @desc    Calculate order amount with live price
 * @access  Public
 */
router.get("/calculate", tradeController.calculateAmount);

/**
 * @route   GET /api/v1/platform-a/trades/stats
 * @desc    Get user's trade statistics
 * @access  Private
 */
router.get("/stats", auth, tradeController.getUserTradeStats);

/**
 * @route   GET /api/v1/platform-a/trades
 * @desc    Get user's trades
 * @access  Private
 */
router.get("/", auth, tradeController.getUserTrades);

/**
 * @route   GET /api/v1/platform-a/trades/:id
 * @desc    Get trade by ID
 * @access  Private
 */
router.get("/:id", auth, tradeController.getTradeById);

/**
 * @route   POST /api/v1/platform-a/trades/:id/deposit-escrow
 * @desc    Mark escrow deposited (Seller)
 * @access  Private - Sellers
 */
router.post("/:id/deposit-escrow", auth, tradeController.markEscrowDeposited);

/**
 * @route   POST /api/v1/platform-a/trades/:id/upload-payment
 * @desc    Upload payment proof (Buyer)
 * @access  Private - Buyers
 */
router.post("/:id/upload-payment", auth, tradeController.uploadPaymentProof);

/**
 * @route   POST /api/v1/platform-a/trades/:id/confirm-payment
 * @desc    Confirm payment (Seller)
 * @access  Private - Sellers
 */
router.post("/:id/confirm-payment", auth, tradeController.confirmPayment);

/**
 * @route   POST /api/v1/platform-a/trades/:id/complete
 * @desc    Complete trade (Release escrow)
 * @access  Private - Sellers
 */
router.post("/:id/complete", auth, tradeController.completeTrade);

/**
 * @route   POST /api/v1/platform-a/trades/:id/cancel
 * @desc    Cancel trade
 * @access  Private
 */
// router.post("/:id/cancel", auth, tradeController.cancelTrade);

/**
 * @route   POST /api/v1/platform-a/trades/:tradeId/cancel
 * @desc    Cancel trade
 * @access  Private
 */
router.post("/:tradeId/cancel", auth, tradeController.cancelTrade);

/**
 * @route   POST /api/v1/platform-a/trades/:id/submit-deposit
 * @desc    Submit deposit hash (Seller)
 * @access  Private - Sellers
 */
router.post("/:id/submit-deposit", auth, tradeController.submitDepositHash);

/**
 * @route   POST /api/v1/platform-a/trades/:id/confirm-instant-seller
 * @desc    Confirm instant seller trade (Instant seller accepts trade request)
 * @access  Private - Instant Sellers
 */
router.post(
  "/:id/confirm-instant-seller",
  auth,
  tradeController.confirmInstantSellerTrade
);

/**
 * @route   POST /api/v1/platform-a/trades/:id/mark-credited
 * @desc    Mark payment as CREDITED (Seller confirms INR received)
 * @access  Private - Sellers
 */
router.post("/:id/mark-credited", auth, tradeController.markCredited);

router.post("/:id/mark-not-credited", auth, tradeController.markNotCredited);

/**
 * @route   POST /api/v1/platform-a/trades/:id/appeal
 * @desc    Appeal trade
 * @access  Private
 */
router.post("/:id/appeal", auth, tradeController.appealTrade);

export default router;
