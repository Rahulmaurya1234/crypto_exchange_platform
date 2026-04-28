// src/api/v1/platform-b/escrow/routes.js
import { Router } from "express";
import * as escrowController from "./controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";
import { authorize } from "../../../../middleware/rbac.middleware.js";
import { ROLES } from "../../../../constants/index.js";

const router = Router();

// All escrow routes require authentication and admin role
router.use(auth);
router.use(authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));

/**
 * @route   GET /api/v1/platform-b/escrow/stats
 * @desc    Get escrow statistics
 * @access  Admin
 */
router.get("/stats", escrowController.getEscrowStats);

/**
 * @route   GET /api/v1/platform-b/escrow/pending
 * @desc    Get pending escrow transactions
 * @access  Admin
 */
router.get("/pending", escrowController.getPendingTransactions);

/**
 * @route   GET /api/v1/platform-b/escrow/hash/:hash
 * @desc    Get escrow transaction by hash
 * @access  Admin
 */
router.get("/hash/:hash", escrowController.getEscrowTransactionByHash);

/**
 * @route   POST /api/v1/platform-b/escrow/hash/:hash/confirmations
 * @desc    Update confirmations
 * @access  Admin
 */
router.post("/hash/:hash/confirmations", escrowController.updateConfirmations);

/**
 * @route   GET /api/v1/platform-b/escrow/user/:userId
 * @desc    Get user's escrow transactions
 * @access  Admin
 */
router.get("/user/:userId", escrowController.getUserEscrowTransactions);

/**
 * @route   POST /api/v1/platform-b/escrow/:tradeId/verify-deposit
 * @desc    Verify seller's deposit for a trade
 * @access  Admin
 */
router.post("/:tradeId/verify-deposit", escrowController.verifyDeposit);

/**
 * @route   POST /api/v1/platform-b/escrow/:tradeId/release-to-buyer
 * @desc    Release escrow to buyer
 * @access  Admin
 */
router.post("/:tradeId/release-to-buyer", escrowController.releaseToBuyer);

/**
 * @route   POST /api/v1/platform-b/escrow/:tradeId/refund-to-seller
 * @desc    Refund escrow to seller (dispute resolution)
 * @access  Admin
 */
router.post("/:tradeId/refund-to-seller", escrowController.refundToSeller);

/**
 * @route   GET /api/v1/platform-b/escrow
 * @desc    Get all escrow transactions
 * @access  Admin
 */
router.get("/", escrowController.getAllEscrowTransactions);

/**
 * @route   GET /api/v1/platform-b/escrow/:id
 * @desc    Get escrow transaction by ID
 * @access  Admin
 */
router.get("/:id", escrowController.getEscrowTransactionById);

/**
 * @route   POST /api/v1/platform-b/escrow/:id/status
 * @desc    Update transaction status
 * @access  Admin
 */
router.post("/:id/status", escrowController.updateTransactionStatus);

export default router;
