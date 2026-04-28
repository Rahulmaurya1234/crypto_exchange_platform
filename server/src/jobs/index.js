// src/jobs/index.js
import {
    kycVerificationQueue,
    escrowMonitorQueue,
    tradeTimeoutQueue,
    notificationQueue,
    emailQueue,
} from "../queues/index.js";
import { logger } from "../utils/logger.js";

/**
 * Job Producers - Functions to add jobs to queues
 */

/**
 * Add KYC verification job
 */
export const addKycVerificationJob = async (kycId, type) => {
    try {
        const job = await kycVerificationQueue.add(
            `kyc_${type}`,
            { kycId, type },
            {
                priority: 1,
                jobId: `kyc_${kycId}_${type}_${Date.now()}`,
            }
        );

        logger.info(`KYC verification job added: ${job.id}`);
        return job;
    } catch (error) {
        logger.error("Failed to add KYC verification job:", error);
        throw error;
    }
};

/**
 * Add escrow monitoring job
 */
export const addEscrowMonitorJob = async (escrowId, type, delay = 0) => {
    try {
        const job = await escrowMonitorQueue.add(
            `escrow_${type}`,
            { escrowId, type },
            {
                priority: type === "check_confirmations" ? 2 : 1,
                delay,
                jobId: `escrow_${escrowId}_${type}_${Date.now()}`,
            }
        );

        logger.info(`Escrow monitor job added: ${job.id}`);
        return job;
    } catch (error) {
        logger.error("Failed to add escrow monitor job:", error);
        throw error;
    }
};

/**
 * Add trade timeout job
 */
export const addTradeTimeoutJob = async (tradeId, timeoutMinutes, reason) => {
    try {
        const delay = timeoutMinutes * 60 * 1000; // Convert to milliseconds

        const job = await tradeTimeoutQueue.add(
            "trade_timeout",
            { tradeId, reason },
            {
                delay,
                jobId: `trade_timeout_${tradeId}_${Date.now()}`,
            }
        );

        logger.info(`Trade timeout job added: ${job.id} (timeout in ${timeoutMinutes} minutes)`);
        return job;
    } catch (error) {
        logger.error("Failed to add trade timeout job:", error);
        throw error;
    }
};

/**
 * Add notification job
 */
export const addNotificationJob = async (userId, type, title, message, data = {}, channels = ["socket"]) => {
    try {
        const job = await notificationQueue.add(
            "send_notification",
            {
                userId,
                type,
                title,
                message,
                data,
                channels,
            },
            {
                priority: 3,
            }
        );

        logger.info(`Notification job added: ${job.id}`);
        return job;
    } catch (error) {
        logger.error("Failed to add notification job:", error);
        throw error;
    }
};

/**
 * Add email job
 */
export const addEmailJob = async (emailData) => {
    try {
        const job = await emailQueue.add("send_email", emailData, {
            priority: 2,
        });

        logger.info(`Email job added: ${job.id}`);
        return job;
    } catch (error) {
        logger.error("Failed to add email job:", error);
        throw error;
    }
};

/**
 * Schedule recurring escrow confirmation checks
 */
export const scheduleEscrowConfirmationChecks = async (escrowId, intervalMinutes = 5) => {
    try {
        const job = await escrowMonitorQueue.add(
            "check_confirmations",
            { escrowId, type: "check_confirmations" },
            {
                repeat: {
                    every: intervalMinutes * 60 * 1000,
                    limit: 50, // Maximum 50 checks
                },
                jobId: `escrow_confirmations_${escrowId}`,
            }
        );

        logger.info(`Scheduled recurring escrow confirmation checks: ${job.id}`);
        return job;
    } catch (error) {
        logger.error("Failed to schedule escrow confirmation checks:", error);
        throw error;
    }
};

/**
 * Cancel scheduled job
 */
export const cancelScheduledJob = async (queue, jobId) => {
    try {
        const job = await queue.getJob(jobId);
        if (job) {
            await job.remove();
            logger.info(`Cancelled job: ${jobId}`);
            return true;
        }
        return false;
    } catch (error) {
        logger.error(`Failed to cancel job ${jobId}:`, error);
        throw error;
    }
};

export default {
    addKycVerificationJob,
    addEscrowMonitorJob,
    addTradeTimeoutJob,
    addNotificationJob,
    addEmailJob,
    scheduleEscrowConfirmationChecks,
    cancelScheduledJob,
};
