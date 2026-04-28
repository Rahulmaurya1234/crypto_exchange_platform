// src/api/v1/platform-a/wallet/routes.js
import { Router } from "express";
import * as walletController from "./controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";

const router = Router();

/**
 * @route   GET /api/v1/platform-a/wallet
 * @desc    Get wallet information
 * @access  Private
 */
router.get("/", auth, walletController.getWalletInfo);

/**
 * @route   GET /api/v1/platform-a/wallet/escrow
 * @desc    Get escrow deposit info
 * @access  Private
 */
router.get("/escrow", auth, walletController.getEscrowDepositInfo);

/**
 * @route   PUT /api/v1/platform-a/wallet/crypto-address
 * @desc    Update crypto wallet address
 * @access  Private
 */
router.put("/crypto-address", auth, walletController.updateCryptoWalletAddress);

/**
 * @route   PUT /api/v1/platform-a/wallet/bank-details
 * @desc    Update bank details
 * @access  Private
 */
router.put("/bank-details", auth, walletController.updateBankDetails);

/**
 * @route   POST /api/v1/platform-a/wallet/upi
 * @desc    Add UPI ID
 * @access  Private
 */
router.post("/upi", auth, walletController.addUpiId);

/**
 * @route   GET /api/v1/platform-a/wallet/instant-seller/balance
 * @desc    Get instant seller balance
 * @access  Private - Instant Sellers only
 */
router.get("/instant-seller/balance", auth, walletController.getInstantSellerBalance);

/**
 * @route   POST /api/v1/platform-a/wallet/instant-seller/deposit
 * @desc    Deposit to instant seller balance
 * @access  Private - Instant Sellers only
 */
router.post("/instant-seller/deposit", auth, walletController.depositInstantSellerBalance);

/**
 * @route   POST /api/v1/platform-a/wallet/instant-seller/withdraw
 * @desc    Withdraw from instant seller balance
 * @access  Private - Instant Sellers only
 */
router.post("/instant-seller/withdraw", auth, walletController.withdrawInstantSellerBalance);


router.get("/:userId/transactions", auth, walletController.getUserTransactions);

router.get("/platform/deposit-address/:currency", auth, walletController.getPlatformWalletDepositAddress);

export default router;
