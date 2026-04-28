// src/services/wallet.service.js
import User from "../models/User.model.js";
import { logger } from "../utils/logger.js";
import EscrowTransaction from "../models/EscrowTransaction.model.js";
import { getPlatformWallet } from "./fee-calculator.service.js";
/**
 * Get user's wallet information
 */
export const getWalletInfo = async (userId) => {
    try {
        const user = await User.findById(userId).select("cryptoWalletAddress bankDetails escrowDepositAmount");

        if (!user) {
            throw new Error("User not found");
        }

        return {
            cryptoWalletAddress: user.cryptoWalletAddress || null,
            bankDetails: user.bankDetails || null,
            escrowDepositAmount: user.escrowDepositAmount || 0,
        };
    } catch (error) {
        logger.error("Error getting wallet info:", error);
        throw error;
    }
};

/**
 * Update crypto wallet address
 */
export const updateCryptoWalletAddress = async (userId, walletAddress) => {
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { cryptoWalletAddress: walletAddress },
            { new: true, runValidators: true }
        ).select("cryptoWalletAddress");

        if (!user) {
            throw new Error("User not found");
        }

        logger.info("Crypto wallet address updated", { userId });

        return user;
    } catch (error) {
        logger.error("Error updating crypto wallet address:", error);
        throw error;
    }
};

/**
 * Add or update bank details
 */
export const updateBankDetails = async (userId, bankDetails) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        // Update bank details
        user.bankDetails = {
            accountHolderName: bankDetails.accountHolderName,
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            bankName: bankDetails.bankName,
            upiId: bankDetails.upiId,
            isVerified: false, // Reset verification when updating
        };

        await user.save();

        logger.info("Bank details updated", { userId });

        return user.bankDetails;
    } catch (error) {
        logger.error("Error updating bank details:", error);
        throw error;
    }
};

/**
 * Add UPI ID
 */
export const addUpiId = async (userId, upiId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.bankDetails) {
            user.bankDetails = {};
        }

        user.bankDetails.upiId = upiId;
        user.bankDetails.isVerified = false; // Reset verification

        await user.save();

        logger.info("UPI ID added", { userId });

        return user.bankDetails;
    } catch (error) {
        logger.error("Error adding UPI ID:", error);
        throw error;
    }
};

/**
 * Verify bank details (Admin only)
 */
export const verifyBankDetails = async (userId, isVerified) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.bankDetails) {
            throw new Error("No bank details to verify");
        }

        user.bankDetails.isVerified = isVerified;

        await user.save();

        logger.info("Bank details verification status updated", { userId, isVerified });

        return user.bankDetails;
    } catch (error) {
        logger.error("Error verifying bank details:", error);
        throw error;
    }
};

/**
 * Get escrow deposit info (for instant sellers)
 */
export const getEscrowDepositInfo = async (userId) => {
    try {
        const user = await User.findById(userId).select("isInstantSeller escrowDepositAmount instantSellerApprovedAt");

        if (!user) {
            throw new Error("User not found");
        }

        return {
            isInstantSeller: user.isInstantSeller,
            escrowDepositAmount: user.escrowDepositAmount || 0,
            instantSellerApprovedAt: user.instantSellerApprovedAt,
        };
    } catch (error) {
        logger.error("Error getting escrow deposit info:", error);
        throw error;
    }
};


export const getUserTransactions = async (userId) => {
    try {
        const user = await EscrowTransaction.find({ userId }).sort({ createdAt: -1 });

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    } catch (error) {
        logger.error("Error getting user transactions:", error);
        throw error;
    }       

};

export const getPlatformWalletDepositAddress = async (currency) => {
    try {
        const platformWallet = await getPlatformWallet(currency);

        if (!platformWallet) {
            throw new Error("Platform wallet not found");
        }

        return platformWallet;
    } catch (error) {
        logger.error("Error getting platform wallet deposit address:", error);
        throw error;
    }
};
export default {
    getWalletInfo,
    updateCryptoWalletAddress,
    updateBankDetails,
    addUpiId,
    verifyBankDetails,
    getEscrowDepositInfo,
    getUserTransactions,
    getPlatformWalletDepositAddress,
};
