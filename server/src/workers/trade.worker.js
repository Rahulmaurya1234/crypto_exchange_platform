// src/workers/trade.worker.js
import { Worker } from "bullmq";
import { bullmqConfig } from "../config/bullmq.config.js";
import { logger } from "../utils/logger.js";
import Trade from "../models/Trade.model.js";
import Dispute from "../models/Dispute.model.js";
import Listing from "../models/Listing.model.js";
import Message from "../models/Message.model.js";
import { emitToTrade } from "../config/socket.config.js";
import * as socketEvents from "../config/socket.config.js";
import { notificationQueue } from "../queues/index.js";
import { TRADE_STATUS } from "../constants/index.js";

/**
 * Trade Timeout Worker
 * Handles automatic trade timeouts, cancellations, and dispute creation
 */

const tradeTimeoutWorker = new Worker(
    bullmqConfig.queues.tradeTimeout.name,
    async (job) => {
        const { tradeId, reason } = job.data;

        logger.info(`Processing trade timeout job ${job.id}: Trade=${tradeId}, Reason=${reason}`);

        try {
            const trade = await Trade.findById(tradeId)
                .populate("buyerId", "name email")
                .populate("sellerId", "name email")
                .populate("listingId");

            if (!trade) {
                throw new Error(`Trade not found: ${tradeId}`);
            }

            // Check if trade is already in a final state
            const finalStatuses = [
                TRADE_STATUS.COMPLETED,
                TRADE_STATUS.CANCELLED,
                TRADE_STATUS.EXPIRED,
                TRADE_STATUS.REFUNDED,
            ];

            if (finalStatuses.includes(trade.status)) {
                logger.info(`Trade ${tradeId} is already in final state: ${trade.status}`);
                return { success: false, message: "Trade already in final state" };
            }

            // Check if trade has actually expired
            if (!trade.isExpired()) {
                logger.info(`Trade ${tradeId} has not expired yet`);
                return { success: false, message: "Trade not expired" };
            }

            // Handle different timeout scenarios based on current status
            let action = "";
            let notificationTitle = "";
            let notificationMessage = "";

            switch (trade.status) {
                case TRADE_STATUS.PENDING_SELLER_DEPOSIT:
                    // Seller didn't deposit within 15 minutes
                    trade.status = TRADE_STATUS.CANCELLED;
                    trade.cancellationReason = "Seller did not deposit crypto within time limit";
                    trade.cancelledAt = new Date();
                    trade.cancelledBy = null; // System-initiated cancellation
                    trade.addTimelineEvent(
                        "Trade Cancelled - Timeout",
                        "Seller did not deposit crypto within 15 minutes. Trade auto-cancelled.",
                        null // System action
                    );

                    // Restore listing availability
                    if (trade.listingId) {
                        await Listing.findByIdAndUpdate(trade.listingId, {
                            $inc: { availableAmount: trade.cryptoAmount },
                        });
                    }

                    action = "cancelled";
                    notificationTitle = "Trade Cancelled - Timeout";
                    notificationMessage = "Seller did not deposit crypto within time limit.";
                    break;

                case TRADE_STATUS.ESCROW_CONFIRMED:
                case TRADE_STATUS.PENDING_PAYMENT:
                    // Buyer didn't pay within 30 minutes
                    trade.status = TRADE_STATUS.CANCELLED;
                    trade.cancellationReason = "Buyer did not complete payment within time limit";
                    trade.cancelledAt = new Date();
                    trade.cancelledBy = null; // System-initiated cancellation
                    trade.addTimelineEvent(
                        "Trade Cancelled - Timeout",
                        "Buyer did not complete INR payment within 30 minutes. Trade auto-cancelled. Escrow will be refunded to seller.",
                        null // System action
                    );

                    action = "cancelled";
                    notificationTitle = "Trade Cancelled - Timeout";
                    notificationMessage = "Buyer did not complete payment within time limit. Escrow will be refunded.";
                    break;

                case TRADE_STATUS.PAYMENT_PROOF_UPLOADED:
                case TRADE_STATUS.PENDING_SELLER_CONFIRMATION:
                    // Seller didn't confirm payment within 15 minutes - CREATE DISPUTE
                    const dispute = new Dispute({
                        tradeId: trade._id,
                        createdBy: null, // System-initiated dispute
                        reason: "Seller did not confirm payment receipt within time limit. Auto-dispute created.",
                        evidence: [],
                        status: "open",
                    });
                    await dispute.save();

                    trade.status = TRADE_STATUS.DISPUTED;
                    trade.hasDispute = true;
                    trade.disputeId = dispute._id;
                    trade.disputeCreatedAt = new Date();
                    trade.addTimelineEvent(
                        "Dispute Created - Timeout",
                        "Seller did not confirm payment within 15 minutes. Dispute auto-created for support review.",
                        null // System action
                    );

                    action = "disputed";
                    notificationTitle = "Dispute Created - Timeout";
                    notificationMessage = "Seller did not confirm payment within time limit. Support team will review.";
                    break;

                default:
                    logger.info(`Trade ${tradeId} status ${trade.status} not eligible for timeout`);
                    return { success: false, message: "Status not eligible for timeout" };
            }

            await trade.save();

            // Emit appropriate socket events based on action
            if (action === "cancelled") {
                socketEvents.emitOrderCancelled(trade, trade.cancellationReason);
                // Create system message
                await Message.createSystemMessage(
                    trade.chatId,
                    `Trade automatically cancelled due to timeout. ${trade.cancellationReason}`
                );
            } else if (action === "disputed") {
                const dispute = await Dispute.findById(trade.disputeId);
                if (dispute) {
                    socketEvents.emitOrderDisputed(trade, dispute);
                    // Create system message
                    await Message.createSystemMessage(
                        trade.chatId,
                        `Dispute automatically created. Support team will review the trade.`
                    );
                }
            }

            // Legacy emit for backward compatibility
            emitToTrade(tradeId, "trade:timeout", {
                tradeId,
                status: trade.status,
                action,
                reason: trade.cancellationReason,
            });

            // Send notifications to buyer and seller
            await Promise.all([
                notificationQueue.add("send_notification", {
                    userId: trade.buyerId._id.toString(),
                    type: "trade_timeout",
                    title: notificationTitle,
                    message: notificationMessage,
                    data: { tradeId, action },
                    channels: ["socket", "email"],
                }),
                notificationQueue.add("send_notification", {
                    userId: trade.sellerId._id.toString(),
                    type: "trade_timeout",
                    title: notificationTitle,
                    message: notificationMessage,
                    data: { tradeId, action },
                    channels: ["socket", "email"],
                }),
            ]);

            logger.info(`Trade timeout job ${job.id} completed successfully. Action: ${action}`);
            return { success: true, tradeId, action };
        } catch (error) {
            logger.error(`Trade timeout job ${job.id} failed:`, error);
            throw error;
        }
    },
    {
        connection: bullmqConfig.connection,
        concurrency: 3,
    }
);

// Worker event handlers
tradeTimeoutWorker.on("completed", (job) => {
    logger.info(`Trade timeout worker completed job ${job.id}`);
});

tradeTimeoutWorker.on("failed", (job, error) => {
    logger.error(`Trade timeout worker failed job ${job?.id}:`, error);
});

tradeTimeoutWorker.on("error", (error) => {
    logger.error("Trade timeout worker error:", error);
});

/**
 * Trade Monitor - Periodically checks for expiring trades
 * Runs every minute to find trades that have expired
 */
const monitorExpiringTrades = async () => {
    try {
        const now = new Date();

        // Find trades that have expired but not in final states
        const expiredTrades = await Trade.find({
            expiresAt: { $lte: now },
            status: {
                $in: [
                    TRADE_STATUS.PENDING_SELLER_DEPOSIT,
                    TRADE_STATUS.ESCROW_CONFIRMED,
                    TRADE_STATUS.PENDING_PAYMENT,
                    TRADE_STATUS.PAYMENT_PROOF_UPLOADED,
                    TRADE_STATUS.PENDING_SELLER_CONFIRMATION,
                ],
            },
        }).select("_id status expiresAt");

        if (expiredTrades.length > 0) {
            logger.info(`Found ${expiredTrades.length} expired trades to process`);

            // Add each expired trade to the timeout queue
            for (const trade of expiredTrades) {
                await import("../queues/index.js").then((queues) => {
                    return queues.tradeTimeoutQueue.add(
                        "trade_timeout",
                        {
                            tradeId: trade._id.toString(),
                            reason: `Trade expired at ${trade.expiresAt}`,
                        },
                        {
                            attempts: 3,
                            backoff: {
                                type: "exponential",
                                delay: 2000,
                            },
                        }
                    );
                });
            }

            logger.info(`Scheduled ${expiredTrades.length} expired trades for timeout processing`);
        }
    } catch (error) {
        logger.error("Error monitoring expiring trades:", error);
    }
};

// Run trade monitor every minute
const MONITOR_INTERVAL_MS = 60 * 1000; // 1 minute
setInterval(monitorExpiringTrades, MONITOR_INTERVAL_MS);

// Run immediately on start
monitorExpiringTrades();

logger.info("Trade Timeout Worker started");
logger.info("Trade Monitor scheduler started (checking every 60 seconds)");

export default tradeTimeoutWorker;
export { monitorExpiringTrades };
