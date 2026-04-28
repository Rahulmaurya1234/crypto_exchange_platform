// src/api/v1/platform-a/wallet/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../../../utils/ApiError.js";
import * as walletService from "../../../../services/wallet.service.js";
import * as escrowService from "../../../../services/escrow.service.js";

/**
 * Get wallet information
 * @route GET /api/v1/platform-a/wallet
 * @access Private
 */
export const getWalletInfo = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const walletInfo = await walletService.getWalletInfo(userId);

    res.json(new ApiResponse(200, { wallet: walletInfo }, "Wallet information retrieved successfully"));
});

/**
 * Update crypto wallet address
 * @route PUT /api/v1/platform-a/wallet/crypto-address
 * @access Private
 */
export const updateCryptoWalletAddress = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { walletAddress } = req.body;
    const lang = req.language || "en";

    if (!walletAddress) {
        throw BadRequestError("Wallet address is required", {}, lang);
    }

    const user = await walletService.updateCryptoWalletAddress(userId, walletAddress);

    res.json(
        new ApiResponse(
            200,
            { cryptoWalletAddress: user.cryptoWalletAddress },
            "Crypto wallet address updated successfully"
        )
    );
});

/**
 * Update bank details
 * @route PUT /api/v1/platform-a/wallet/bank-details
 * @access Private
 */
export const updateBankDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const bankDetails = req.body;
    const lang = req.language || "en";

    const updatedBankDetails = await walletService.updateBankDetails(userId, bankDetails);

    res.json(
        new ApiResponse(
            200,
            { bankDetails: updatedBankDetails },
            "Bank details updated successfully"
        )
    );
});

/**
 * Add UPI ID
 * @route POST /api/v1/platform-a/wallet/upi
 * @access Private
 */
export const addUpiId = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { upiId } = req.body;
    const lang = req.language || "en";

    if (!upiId) {
        throw BadRequestError("UPI ID is required", {}, lang);
    }

    const bankDetails = await walletService.addUpiId(userId, upiId);

    res.json(
        new ApiResponse(
            200,
            { bankDetails },
            "UPI ID added successfully"
        )
    );
});

/**
 * Get escrow deposit info
 * @route GET /api/v1/platform-a/wallet/escrow
 * @access Private
 */
export const getEscrowDepositInfo = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const escrowInfo = await walletService.getEscrowDepositInfo(userId);

    res.json(
        new ApiResponse(
            200,
            { escrow: escrowInfo },
            "Escrow deposit information retrieved successfully"
        )
    );
});

/**
 * Get instant seller balance
 * @route GET /api/v1/platform-a/wallet/instant-seller/balance
 * @access Private - Instant Sellers only
 */
export const getInstantSellerBalance = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const lang = req.language || "en";

    // Check if user is instant seller
    if (!req.user.isInstantSeller) {
        throw ForbiddenError("Only instant sellers can access this endpoint", {}, lang);
    }

    const balanceInfo = await escrowService.getInstantSellerBalance(userId);

    res.json(
        new ApiResponse(
            200,
            balanceInfo,
            "Instant seller balance retrieved successfully"
        )
    );
});

/**
 * Deposit to instant seller balance
 * @route POST /api/v1/platform-a/wallet/instant-seller/deposit
 * @access Private - Instant Sellers only
 */
export const depositInstantSellerBalance = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { amount, transactionHash } = req.body;
    const lang = req.language || "en";

    // Check if user is instant seller
    if (!req.user.isInstantSeller) {
        throw ForbiddenError("Only instant sellers can access this endpoint", {}, lang);
    }

    if (!amount || !transactionHash) {
        throw BadRequestError("Amount and transaction hash are required", {}, lang);
    }

    if (amount <= 0) {
        throw BadRequestError("Amount must be greater than 0", {}, lang);
    }

    const result = await escrowService.depositToInstantSellerBalance(
        userId,
        parseFloat(amount),
        transactionHash
    );

    res.json(
        new ApiResponse(
            200,
            result,
            "Deposit successful. Balance updated."
        )
    );
});

/**
 * Withdraw from instant seller balance
 * @route POST /api/v1/platform-a/wallet/instant-seller/withdraw
 * @access Private - Instant Sellers only
 */
export const withdrawInstantSellerBalance = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { amount, walletAddress, transactionHash } = req.body;
    const lang = req.language || "en";

    // Check if user is instant seller
    if (!req.user.isInstantSeller) {
        throw ForbiddenError("Only instant sellers can access this endpoint", {}, lang);
    }

    if (!amount || !walletAddress || !transactionHash) {
        throw BadRequestError("Amount, wallet address, and transaction hash are required", {}, lang);
    }

    if (amount <= 0) {
        throw BadRequestError("Amount must be greater than 0", {}, lang);
    }

    const result = await escrowService.withdrawFromInstantSellerBalance(
        userId,
        parseFloat(amount),
        walletAddress,
        transactionHash
    );

    res.json(
        new ApiResponse(
            200,
            result,
            "Withdrawal successful. Balance updated."
        )
    );
});


export const getUserTransactions = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const lang = req.language || "en";

    // Ensure the requesting user is the same as the userId parameter or has admin rights
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
        throw ForbiddenError("You do not have permission to access these transactions", {}, lang);
    }

    const transactions = await walletService.getUserTransactions(userId);

    res.json(
        new ApiResponse(
            200,
            { transactions },
            "User transactions retrieved successfully"
        )
    );
});

export const getPlatformWalletDepositAddress = asyncHandler(async (req, res) => {
    const { currency } = req.params;
    const lang = req.language || "en";

    if (!currency) {
        throw BadRequestError("Currency parameter is required", {}, lang);
    }

    const depositAddress = await walletService.getPlatformWalletDepositAddress(currency);

    res.json(
        new ApiResponse(
            200,
            { currency, depositAddress },
            "Platform wallet deposit address retrieved successfully"
        )
    );
});

export default {
    getWalletInfo,
    updateCryptoWalletAddress,
    updateBankDetails,
    addUpiId,
    getEscrowDepositInfo,
    // Phase 2 - Instant seller balance endpoints
    getInstantSellerBalance,
    depositInstantSellerBalance,
    withdrawInstantSellerBalance,
    getUserTransactions,
    getPlatformWalletDepositAddress,
};
