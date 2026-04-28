// src/workers/escrow.worker.js
import { Worker, DelayedError } from "bullmq";
import { bullmqConfig } from "../config/bullmq.config.js";
import { logger } from "../utils/logger.js";
import EscrowTransaction  from "../models/EscrowTransaction.model.js";
import { emitToUser } from "../config/socket.config.js";
import { notificationQueue } from "../queues/index.js";
import * as blockchainService from "../services/blockchain.service.js";
import * as auditService from "../services/audit.service.js";
import { AUDIT_ACTION, TRADE_STATUS, ESCROW_TRANSACTION_STATUS } from "../constants/index.js";
import Trade from "../models/Trade.model.js";
import Message from "../models/Message.model.js";

/**
 * Escrow Monitor Worker
 * Monitors blockchain for escrow transactions and confirmations
 */

const escrowMonitorWorker = new Worker(
    bullmqConfig.queues.escrowMonitor.name,
    async (job) => {
        const { escrowId, type } = job.data;

        logger.info(`Processing escrow job ${job.id}: Type=${type}, Escrow=${escrowId}`);

        try {
            const escrow = await EscrowTransaction.findById(escrowId);

            if (!escrow) {
                throw new Error(`Escrow transaction not found: ${escrowId}`);
            }

            switch (type) {
                case "check_confirmations":
                    await checkConfirmations(escrow);
                    break;

                case "monitor_deposit":
                    await monitorDeposit(escrow);
                    break;

                case "verify_release":
                    await verifyRelease(escrow);
                    break;

                case "process_refund":
                    await processRefund(escrow);
                    break;

                default:
                    throw new Error(`Unknown escrow monitor type: ${type}`);
            }

            logger.info(`Escrow job ${job.id} completed successfully`);
            return { success: true, escrowId };
        } catch (error) {
            logger.error(`Escrow job ${job.id} failed:`, error);
            throw error;
        }
    },
    {
        connection: bullmqConfig.connection,
        concurrency: 5,
    }
);

/**
 * Check blockchain confirmations for a transaction
 */
async function checkConfirmations(escrow) {
    logger.info(`Checking confirmations for escrow: ${escrow._id}`);

    if (!escrow.txHash) {
        throw new Error("No transaction hash available");
    }

    // Call blockchain service with full parameters
    const verification = await blockchainService.verifyTransaction(
        escrow.txHash,
        escrow.network,
        escrow.toAddress,
        escrow.amount,
        escrow.transactionType,
        escrow.fromAddress,
        escrow.cryptoType
    );

    const trade = await Trade.findById(escrow.tradeId);

    // Helper for cancelling trade
    const cancelTrade = async (reason) => {
        escrow.status = ESCROW_TRANSACTION_STATUS.FAILED;
        escrow.failedAt = new Date();
        escrow.failureReason = reason;
        await escrow.save();

        if (trade) {
            trade.status = TRADE_STATUS.CANCELLED;
            trade.cancelledAt = new Date();
            trade.cancellationReason = `Verification failed: ${reason}`;
            trade.addTimelineEvent("Verification Failed", reason);
            await trade.save();
            await Message.createSystemMessage(trade.chatId, `Deposit verification failed: ${reason}. Trade cancelled.`);
        }
    };

    if (verification.status === -1 && !verification.valid) {
        // Case 1: Wrong info, completely failed. No retry.
        await cancelTrade("Transaction data not found after max attempts. Invalid submitted info.");
        return false;
    } 
    else if (verification.status === 2 && !verification.valid) {
        // Case 4: Failed on chain. No retry.
        await cancelTrade("Transaction failed on the blockchain. Crypto did not reach escrow.");
        return false;
    } 
    else if (verification.status === 4 && !verification.valid) {
        // Case 6: Mismatch in amount or cryptoType. Needs Admin.
        escrow.status = "disputed";
        escrow.failureReason = "CryptoType or Amount mismatch.";
        await escrow.save();

        if (trade) {
            trade.status = TRADE_STATUS.DISPUTED; // Mark as disputed instead of cancelled
            trade.addTimelineEvent("Dispute Opened", "Deposit mismatch detected (Amount/Token). Escrow holds funds, requiring admin review.");
            await trade.save();
            await Message.createSystemMessage(trade.chatId, `Deposit problem detected. Current trade requires Admin review. Please hold.`);
            // TODO: Notify Admins
        }
        return false;
    }
    else if (verification.status === 3 && verification.valid) {
        // Case 5: Success!
        escrow.status = ESCROW_TRANSACTION_STATUS.CONFIRMED;
        escrow.confirmations = verification.confirmations || 12;
        escrow.completedAt = new Date();
        await escrow.save();

        if (trade) {
            trade.status = TRADE_STATUS.ESCROW_CONFIRMED;
            trade.escrowDepositedAt = new Date();
            trade.addTimelineEvent(
                "Escrow Verified",
                `System verified ${escrow.cryptoType} deposit on ${escrow.network}.`
            );
            await trade.save();
            await Message.createSystemMessage(trade.chatId, `Deposit verified by blockchain. Buyer can now proceed with payment.`);
            await auditService.logTradeAction(AUDIT_ACTION.ESCROW_VERIFY, "SYSTEM", "SYSTEM", trade._id, { hash: escrow.txHash });
        }
        return true;
    } 
    else if (verification.status === 1 && !verification.valid) {
        // Case 3: Waiting for confirmations (good sign)
        if (trade) {
             // Continuing to throw error to trigger bullMQ retry
             // "Normal frequency" ~ e.g., retry in 30 seconds
             throw new DelayedError(30 * 1000);
        }
    }
    else {
        // Case 2: Pending (status: 0) or fallback
        // "Low frequency" ~ e.g., retry in 2 minutes
        throw new DelayedError(120 * 1000);
    }
}

/**
 * Monitor for escrow deposit
 */
async function monitorDeposit(escrow) {
    logger.info(`Monitoring deposit for escrow: ${escrow._id}`);

    // Simulate checking for deposit
    // In production, monitor blockchain for incoming transactions
    await new Promise((resolve) => setTimeout(resolve, 5000));

    if (escrow.status === "awaiting_deposit") {
        // Simulate finding deposit
        const depositFound = Math.random() > 0.3; // 70% success rate for simulation

        if (depositFound) {
            escrow.status = "deposited";
            escrow.transactionHash = `0x${Math.random().toString(16).substring(2, 66)}`; // Mock hash
            escrow.depositedAt = new Date();
            await escrow.save();

            // Notify users
            await notificationQueue.add("send_notification", {
                userId: escrow.buyerId.toString(),
                type: "escrow_deposited",
                title: "Deposit Received",
                message: "Your escrow deposit has been received.",
                data: { escrowId: escrow._id },
                channels: ["socket"],
            });
        }
    }
}

/**
 * Verify escrow release transaction
 */
async function verifyRelease(escrow) {
    logger.info(`Verifying release for escrow: ${escrow._id}`);

    // Simulate verifying release on blockchain
    await new Promise((resolve) => setTimeout(resolve, 3000));

    escrow.status = "released";
    escrow.releasedAt = new Date();
    await escrow.save();

    // Notify seller
    await notificationQueue.add("send_notification", {
        userId: escrow.sellerId.toString(),
        type: "escrow_released",
        title: "Funds Released",
        message: "Escrow funds have been released to you.",
        data: { escrowId: escrow._id },
        channels: ["socket", "email"],
    });

    // Emit WebSocket event
    emitToUser(escrow.sellerId.toString(), "escrow:released", {
        escrowId: escrow._id,
        amount: escrow.amount,
    });
}

/**
 * Process escrow refund
 */
async function processRefund(escrow) {
    logger.info(`Processing refund for escrow: ${escrow._id}`);

    // Simulate processing refund on blockchain
    await new Promise((resolve) => setTimeout(resolve, 3000));

    escrow.status = "refunded";
    escrow.refundedAt = new Date();
    await escrow.save();

    // Notify buyer
    await notificationQueue.add("send_notification", {
        userId: escrow.buyerId.toString(),
        type: "escrow_refunded",
        title: "Refund Processed",
        message: "Your escrow deposit has been refunded.",
        data: { escrowId: escrow._id },
        channels: ["socket", "email"],
    });

    // Emit WebSocket event
    emitToUser(escrow.buyerId.toString(), "escrow:refunded", {
        escrowId: escrow._id,
        amount: escrow.amount,
    });
}

// Worker event handlers
escrowMonitorWorker.on("completed", (job) => {
    logger.info(`Escrow monitor worker completed job ${job.id}`);
});

escrowMonitorWorker.on("failed", (job, error) => {
    logger.error(`Escrow monitor worker failed job ${job?.id}:`, error);
});

escrowMonitorWorker.on("error", (error) => {
    logger.error("Escrow monitor worker error:", error);
});

logger.info("Escrow Monitor Worker started");

export default escrowMonitorWorker;
