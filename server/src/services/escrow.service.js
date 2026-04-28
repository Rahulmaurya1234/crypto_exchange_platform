// src/services/escrow.service.js
import EscrowTransaction from "../models/EscrowTransaction.model.js";
import Trade from "../models/Trade.model.js";
import Message from "../models/Message.model.js";
import { ESCROW_TRANSACTION_STATUS, ESCROW_TRANSACTION_TYPE, TRADE_STATUS } from "../constants/index.js";
import { logger } from "../utils/logger.js";
import * as socketEvents from "../config/socket.config.js";
import * as notificationService from "./notification.service.js";

/**
 * Create escrow transaction record
 */
export const createEscrowTransaction = async (transactionData) => {
    try {
        const escrowTx = new EscrowTransaction(transactionData);
        await escrowTx.save();

        logger.info("Escrow transaction created", { transactionId: escrowTx._id });

        return escrowTx;
    } catch (error) {
        logger.error("Error creating escrow transaction:", error);
        throw error;
    }
};

/**
 * Get escrow transaction by ID
 */
export const getEscrowTransactionById = async (txId) => {
    return await EscrowTransaction.findById(txId)
        .populate("tradeId", "tradeNumber status cryptoAmount")
        .populate("userId", "name email")
        .populate("processedBy", "name email");
};

/**
 * Get escrow transaction by transaction hash
 */
export const getEscrowTransactionByHash = async (txHash) => {
    return await EscrowTransaction.findOne({ txHash })
        .populate("tradeId", "tradeNumber status cryptoAmount")
        .populate("userId", "name email");
};

/**
 * Get all escrow transactions (Admin)
 */
export const getAllEscrowTransactions = async (filters = {}) => {
    const { page = 1, limit = 20, status, transactionType, userId } = filters;

    const query = {};

    if (status) {
        query.status = status;
    }

    if (transactionType) {
        query.transactionType = transactionType;
    }

    if (userId) {
        query.userId = userId;
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
        EscrowTransaction.find(query)
            .populate("tradeId", "tradeNumber status")
            .populate("userId", "name email")
            .populate("processedBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        EscrowTransaction.countDocuments(query),
    ]);

    return {
        transactions,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get pending escrow transactions (Admin)
 */
export const getPendingTransactions = async (filters = {}) => {
    return await getAllEscrowTransactions({
        ...filters,
        status: ESCROW_TRANSACTION_STATUS.PENDING,
    });
};

/**
 * Update transaction status
 */
export const updateTransactionStatus = async (txId, status, adminId, failureReason = null) => {
    try {
        const escrowTx = await EscrowTransaction.findById(txId);

        if (!escrowTx) {
            throw new Error("Escrow transaction not found");
        }

        escrowTx.status = status;
        escrowTx.processedBy = adminId;

        if (status === ESCROW_TRANSACTION_STATUS.COMPLETED) {
            escrowTx.completedAt = new Date();
        } else if (status === ESCROW_TRANSACTION_STATUS.FAILED) {
            escrowTx.failedAt = new Date();
            escrowTx.failureReason = failureReason;
        }

        await escrowTx.save();

        logger.info("Escrow transaction status updated", { txId, status, adminId });

        return escrowTx;
    } catch (error) {
        logger.error("Error updating escrow transaction status:", error);
        throw error;
    }
};

/**
 * Update confirmations
 */
export const updateConfirmations = async (txHash, confirmations, blockNumber) => {
    try {
        const escrowTx = await EscrowTransaction.findOne({ txHash });

        if (!escrowTx) {
            throw new Error("Escrow transaction not found");
        }

        escrowTx.confirmations = confirmations;
        escrowTx.blockNumber = blockNumber;

        // If reached required confirmations, mark as confirmed
        if (confirmations >= escrowTx.requiredConfirmations) {
            escrowTx.status = ESCROW_TRANSACTION_STATUS.CONFIRMED;
        } else {
            escrowTx.status = ESCROW_TRANSACTION_STATUS.CONFIRMING;
        }

        await escrowTx.save();

        logger.info("Escrow transaction confirmations updated", { txHash, confirmations });

        return escrowTx;
    } catch (error) {
        logger.error("Error updating confirmations:", error);
        throw error;
    }
};

/**
 * Get escrow statistics
 */
export const getEscrowStats = async () => {
    const stats = await EscrowTransaction.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
            },
        },
    ]);

    const typeStats = await EscrowTransaction.aggregate([
        {
            $group: {
                _id: "$transactionType",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
            },
        },
    ]);

    const formattedStats = {
        total: await EscrowTransaction.countDocuments(),
        byStatus: {},
        byType: {},
    };

    stats.forEach((stat) => {
        formattedStats.byStatus[stat._id] = {
            count: stat.count,
            totalAmount: stat.totalAmount,
        };
    });

    typeStats.forEach((stat) => {
        formattedStats.byType[stat._id] = {
            count: stat.count,
            totalAmount: stat.totalAmount,
        };
    });

    return formattedStats;
};

/**
 * Get user's escrow transactions
 */
export const getUserEscrowTransactions = async (userId, filters = {}) => {
    return await getAllEscrowTransactions({
        ...filters,
        userId,
    });
};

/**
 * Verify deposit for a trade (Platform B action)
 * Checks blockchain transaction and updates trade status
 * @param {string} tradeId - Trade ID
 * @param {string} adminId - Admin/Support user verifying
 * @param {boolean} isValid - Whether deposit is valid
 * @param {string} remarks - Optional remarks
 * @returns {Object} Updated trade
 */
export const verifyTradeDeposit = async (tradeId, adminId, isValid, remarks = "") => {
    try {
        const trade = await Trade.findById(tradeId)
            .populate("sellerId", "name email")
            .populate("buyerId", "name email");

        if (!trade) {
            throw new Error("Trade not found");
        }

        if (trade.status !== TRADE_STATUS.DEPOSIT_SUBMITTED) {
            throw new Error(`Cannot verify deposit. Current status: ${trade.status}`);
        }

        if (!trade.escrowTransactionHash) {
            throw new Error("No transaction hash found for this trade");
        }

        if (isValid) {
            // Create/update escrow transaction record
            let escrowTx = await EscrowTransaction.findOne({
                tradeId: trade._id,
                transactionType: ESCROW_TRANSACTION_TYPE.DEPOSIT,
            });

            if (!escrowTx) {
                escrowTx = new EscrowTransaction({
                    tradeId: trade._id,
                    userId: trade.sellerId._id,
                    transactionType: ESCROW_TRANSACTION_TYPE.DEPOSIT,
                    cryptoType: "USDT",
                    amount: trade.sellerMustSend,
                    fromAddress: trade.sellerWalletAddress,
                    toAddress: trade.escrowAddress,
                    txHash: trade.escrowTransactionHash,
                    status: ESCROW_TRANSACTION_STATUS.CONFIRMED,
                    processedBy: adminId,
                    metadata: {
                        verifiedAt: new Date(),
                        remarks,
                    },
                });
            } else {
                escrowTx.status = ESCROW_TRANSACTION_STATUS.CONFIRMED;
                escrowTx.processedBy = adminId;
                escrowTx.metadata = {
                    ...escrowTx.metadata,
                    verifiedAt: new Date(),
                    remarks,
                };
            }

            await escrowTx.save();

            // Update trade status to ESCROW_CONFIRMED
            trade.status = TRADE_STATUS.ESCROW_CONFIRMED;
            trade.escrowDepositedAt = new Date();
            trade.addTimelineEvent(
                "Deposit Verified",
                `Platform B verified deposit. ${remarks}. Buyer can now proceed with payment.`,
                adminId
            );

            // Set new timer for buyer payment (30 minutes)
            trade.expiresAt = new Date(Date.now() + 30 * 60000);

            await trade.save();

            logger.info("Trade deposit verified successfully", {
                tradeId,
                escrowTxId: escrowTx._id,
                adminId,
            });

            // Emit socket event
            socketEvents.emitEscrowConfirmed(trade);

            // Send real-time notification (Toast + History)
            notificationService.notifyEscrowConfirmed(trade);

            // Create system message
            await Message.createSystemMessage(
                trade.chatId,
                `Deposit verified by Platform B. Buyer can now proceed with payment.`,
                {
                    messageType: "action",
                    actionType: "admin-verified-deposit",
                }
            );

            return {
                trade,
                escrowTransaction: escrowTx,
            };
        } else {
            // Deposit verification failed
            trade.status = TRADE_STATUS.CANCELLED;
            trade.cancelledAt = new Date();
            trade.cancelledBy = adminId;
            trade.cancellationReason = `Deposit verification failed: ${remarks}`;

            trade.addTimelineEvent(
                "Deposit Verification Failed",
                `Platform B could not verify deposit. ${remarks}. Trade cancelled.`,
                adminId
            );

            await trade.save();

            // Create failed escrow transaction record
            const escrowTx = new EscrowTransaction({
                tradeId: trade._id,
                userId: trade.sellerId._id,
                transactionType: ESCROW_TRANSACTION_TYPE.DEPOSIT,
                cryptoType: "USDT",
                amount: trade.sellerMustSend,
                txHash: trade.escrowTransactionHash,
                status: ESCROW_TRANSACTION_STATUS.FAILED,
                failedAt: new Date(),
                failureReason: remarks,
                processedBy: adminId,
            });

            await escrowTx.save();

            logger.warn("Trade deposit verification failed", {
                tradeId,
                reason: remarks,
                adminId,
            });

            return {
                trade,
                escrowTransaction: escrowTx,
            };
        }
    } catch (error) {
        logger.error("Error verifying trade deposit:", error);
        throw error;
    }
};

/**
 * Release escrow to buyer (Platform B action or auto-release)
 * @param {string} tradeId - Trade ID
 * @param {string} adminId - Admin/Support user ID (optional for auto-release)
 * @param {string} releaseHash - Blockchain tx hash for release
 * @returns {Object} Updated trade
 */
export const releaseEscrowToBuyer = async (tradeId, adminId, releaseHash) => {
    try {
        const trade = await Trade.findById(tradeId)
            .populate("sellerId", "name email")
            .populate("buyerId", "name email");

        if (!trade) {
            throw new Error("Trade not found");
        }

        if (trade.status !== TRADE_STATUS.PENDING_SELLER_CONFIRMATION) {
            throw new Error(`Cannot release escrow. Current status: ${trade.status}`);
        }

        // Create escrow release transaction
        const escrowTx = new EscrowTransaction({
            tradeId: trade._id,
            userId: trade.buyerId._id,
            transactionType: ESCROW_TRANSACTION_TYPE.RELEASE,
            cryptoType: "USDT",
            amount: trade.buyerWillReceive,
            fromAddress: trade.escrowAddress,
            toAddress: trade.buyerWalletAddress,
            txHash: releaseHash,
            status: ESCROW_TRANSACTION_STATUS.COMPLETED,
            completedAt: new Date(),
            processedBy: adminId,
            metadata: {
                releasedAt: new Date(),
                tradeCompleted: true,
            },
        });

        await escrowTx.save();

        // Complete trade
        trade.status = TRADE_STATUS.COMPLETED;
        trade.completedAt = new Date();
        trade.escrowReleasedAt = new Date();
        trade.escrowReleaseHash = releaseHash;

        trade.addTimelineEvent(
            "Escrow Released",
            `Crypto released to buyer. TX: ${releaseHash}`,
            adminId
        );

        await trade.save();

        logger.info("Escrow released to buyer", {
            tradeId,
            releaseHash,
            escrowTxId: escrowTx._id,
        });

        // Emit socket event
        socketEvents.emitOrderCompleted(trade);

        // Send real-time notification (Toast + History)
        notificationService.notifyTradeCompleted(trade);

        // Create system message
        await Message.createSystemMessage(
            trade.chatId,
            `Trade completed! Crypto has been released to buyer.`
        );

        return {
            trade,
            escrowTransaction: escrowTx,
        };
    } catch (error) {
        logger.error("Error releasing escrow to buyer:", error);
        throw error;
    }
};

/**
 * Refund escrow to seller (Platform B action - Dispute resolution)
 * @param {string} tradeId - Trade ID
 * @param {string} adminId - Admin/Support user ID
 * @param {string} refundHash - Blockchain tx hash for refund
 * @param {string} reason - Reason for refund
 * @returns {Object} Updated trade
 */
export const refundEscrowToSeller = async (tradeId, adminId, refundHash, reason = "") => {
    try {
        const trade = await Trade.findById(tradeId)
            .populate("sellerId", "name email")
            .populate("buyerId", "name email");

        if (!trade) {
            throw new Error("Trade not found");
        }

        // Can refund from DISPUTED, ESCROW_CONFIRMED, or PAYMENT_PROOF_UPLOADED status
        const refundableStatuses = [
            TRADE_STATUS.DISPUTED,
            TRADE_STATUS.ESCROW_CONFIRMED,
            TRADE_STATUS.PAYMENT_PROOF_UPLOADED,
            TRADE_STATUS.PENDING_SELLER_CONFIRMATION,
        ];

        if (!refundableStatuses.includes(trade.status)) {
            throw new Error(`Cannot refund escrow. Current status: ${trade.status}`);
        }

        // Create escrow refund transaction
        const escrowTx = new EscrowTransaction({
            tradeId: trade._id,
            userId: trade.sellerId._id,
            transactionType: ESCROW_TRANSACTION_TYPE.REFUND,
            cryptoType: "USDT",
            amount: trade.sellerMustSend,
            fromAddress: trade.escrowAddress,
            toAddress: trade.sellerWalletAddress,
            txHash: refundHash,
            status: ESCROW_TRANSACTION_STATUS.COMPLETED,
            completedAt: new Date(),
            processedBy: adminId,
            metadata: {
                refundedAt: new Date(),
                reason,
            },
        });

        await escrowTx.save();

        // Update trade status to REFUNDED
        trade.status = TRADE_STATUS.REFUNDED;
        trade.refundedAt = new Date();
        trade.escrowReleaseHash = refundHash;

        trade.addTimelineEvent(
            "Escrow Refunded",
            `Crypto refunded to seller. Reason: ${reason}. TX: ${refundHash}`,
            adminId
        );

        await trade.save();

        logger.info("Escrow refunded to seller", {
            tradeId,
            refundHash,
            reason,
            escrowTxId: escrowTx._id,
        });

        return {
            trade,
            escrowTransaction: escrowTx,
        };
    } catch (error) {
        logger.error("Error refunding escrow to seller:", error);
        throw error;
    }
};

/**
 * Get instant seller balance
 * @param {string} sellerId - Seller user ID
 * @returns {Object} Balance information
 */
export const getInstantSellerBalance = async (sellerId) => {
    try {
        const User = (await import("../models/User.model.js")).default;
        const user = await User.findById(sellerId);

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.isInstantSeller) {
            throw new Error("User is not an instant seller");
        }

        return {
            balance: user.escrowDepositAmount,
            isInstantSeller: user.isInstantSeller,
            userId: user._id,
        };
    } catch (error) {
        logger.error("Error getting instant seller balance:", error);
        throw error;
    }
};

/**
 * Deposit to instant seller balance
 * @param {string} sellerId - Seller user ID
 * @param {number} amount - Amount to deposit
 * @param {string} txHash - Blockchain transaction hash
 * @returns {Object} Updated balance and transaction
 */
export const depositToInstantSellerBalance = async (sellerId, amount, txHash) => {
    try {
        const User = (await import("../models/User.model.js")).default;
        const user = await User.findById(sellerId);

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.isInstantSeller) {
            throw new Error("User is not an instant seller");
        }

        // Create escrow transaction record
        const escrowTx = new EscrowTransaction({
            userId: sellerId,
            transactionType: ESCROW_TRANSACTION_TYPE.INSTANT_SELLER_DEPOSIT,
            cryptoType: "USDT",
            amount,
            txHash,
            status: ESCROW_TRANSACTION_STATUS.PENDING,
            metadata: {
                depositType: "instant_seller_balance",
            },
        });

        await escrowTx.save();

        // Add to user balance
        await user.addInstantSellerBalance(amount);

        logger.info("Instant seller balance deposit", {
            sellerId,
            amount,
            txHash,
            newBalance: user.escrowDepositAmount,
        });

        return {
            balance: user.escrowDepositAmount,
            transaction: escrowTx,
        };
    } catch (error) {
        logger.error("Error depositing to instant seller balance:", error);
        throw error;
    }
};

/**
 * Withdraw from instant seller balance
 * @param {string} sellerId - Seller user ID
 * @param {number} amount - Amount to withdraw
 * @param {string} toAddress - Destination wallet address
 * @param {string} txHash - Blockchain transaction hash
 * @returns {Object} Updated balance and transaction
 */
export const withdrawFromInstantSellerBalance = async (sellerId, amount, toAddress, txHash) => {
    try {
        const User = (await import("../models/User.model.js")).default;
        const user = await User.findById(sellerId);

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.isInstantSeller) {
            throw new Error("User is not an instant seller");
        }

        if (!user.hasInstantSellerBalance(amount)) {
            throw new Error("Insufficient balance for withdrawal");
        }

        // Deduct from user balance
        await user.deductInstantSellerBalance(amount, null);

        // Create escrow transaction record
        const escrowTx = new EscrowTransaction({
            userId: sellerId,
            transactionType: ESCROW_TRANSACTION_TYPE.INSTANT_SELLER_WITHDRAWAL,
            cryptoType: "USDT",
            amount,
            toAddress,
            txHash,
            status: ESCROW_TRANSACTION_STATUS.COMPLETED,
            completedAt: new Date(),
            metadata: {
                withdrawalType: "instant_seller_balance",
            },
        });

        await escrowTx.save();

        logger.info("Instant seller balance withdrawal", {
            sellerId,
            amount,
            txHash,
            newBalance: user.escrowDepositAmount,
        });

        return {
            balance: user.escrowDepositAmount,
            transaction: escrowTx,
        };
    } catch (error) {
        logger.error("Error withdrawing from instant seller balance:", error);
        throw error;
    }
};

/**
 * Check if instant seller has sufficient balance
 * @param {string} sellerId - Seller user ID
 * @param {number} amount - Amount to check
 * @returns {boolean}
 */
export const checkInstantSellerBalanceSufficient = async (sellerId, amount) => {
    try {
        const User = (await import("../models/User.model.js")).default;
        const user = await User.findById(sellerId);

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.isInstantSeller) {
            return false;
        }

        return user.hasInstantSellerBalance(amount);
    } catch (error) {
        logger.error("Error checking instant seller balance:", error);
        throw error;
    }
};

export default {
    createEscrowTransaction,
    getEscrowTransactionById,
    getEscrowTransactionByHash,
    getAllEscrowTransactions,
    getPendingTransactions,
    updateTransactionStatus,
    updateConfirmations,
    getEscrowStats,
    getUserEscrowTransactions,
    // Phase 1 new methods
    verifyTradeDeposit,
    releaseEscrowToBuyer,
    refundEscrowToSeller,
    // Phase 2 - Instant seller balance methods
    getInstantSellerBalance,
    depositToInstantSellerBalance,
    withdrawFromInstantSellerBalance,
    checkInstantSellerBalanceSufficient,
};
