// src/queues/index.js
import { Queue } from "bullmq";
import { bullmqConfig } from "../config/bullmq.config.js";
import { logger } from "../utils/logger.js";

/**
 * Initialize all queues
 */

// KYC Verification Queue
export const kycVerificationQueue = new Queue(
    bullmqConfig.queues.kycVerification.name,
    {
        connection: bullmqConfig.connection,
        defaultJobOptions: {
            ...bullmqConfig.defaultJobOptions,
            ...bullmqConfig.queues.kycVerification.options,
        },
    }
);

// Escrow Monitor Queue
export const escrowMonitorQueue = new Queue(
    bullmqConfig.queues.escrowMonitor.name,
    {
        connection: bullmqConfig.connection,
        defaultJobOptions: {
            ...bullmqConfig.defaultJobOptions,
            ...bullmqConfig.queues.escrowMonitor.options,
        },
    }
);

// Trade Timeout Queue
export const tradeTimeoutQueue = new Queue(
    bullmqConfig.queues.tradeTimeout.name,
    {
        connection: bullmqConfig.connection,
        defaultJobOptions: {
            ...bullmqConfig.defaultJobOptions,
            ...bullmqConfig.queues.tradeTimeout.options,
        },
    }
);

// Notification Queue
export const notificationQueue = new Queue(
    bullmqConfig.queues.notification.name,
    {
        connection: bullmqConfig.connection,
        defaultJobOptions: {
            ...bullmqConfig.defaultJobOptions,
            ...bullmqConfig.queues.notification.options,
        },
    }
);

// Fee Sweep Queue
export const feeSweepQueue = new Queue(
    bullmqConfig.queues.feeSweep.name,
    {
        connection: bullmqConfig.connection,
        defaultJobOptions: {
            ...bullmqConfig.defaultJobOptions,
            ...bullmqConfig.queues.feeSweep.options,
        },
    }
);

// Email Queue
export const emailQueue = new Queue(
    bullmqConfig.queues.emailQueue.name,
    {
        connection: bullmqConfig.connection,
        defaultJobOptions: {
            ...bullmqConfig.defaultJobOptions,
            ...bullmqConfig.queues.emailQueue.options,
        },
    }
);

// SMS Queue
export const smsQueue = new Queue(
    bullmqConfig.queues.smsQueue.name,
    {
        connection: bullmqConfig.connection,
        defaultJobOptions: {
            ...bullmqConfig.defaultJobOptions,
            ...bullmqConfig.queues.smsQueue.options,
        },
    }
);

/**
 * Queue event listeners
 */
const setupQueueListeners = (queue, queueName) => {
    queue.on("error", (error) => {
        logger.error(`Queue [${queueName}] error:`, error);
    });

    queue.on("waiting", (jobId) => {
        logger.debug(`Job ${jobId} is waiting in queue [${queueName}]`);
    });

    queue.on("active", (job) => {
        logger.debug(`Job ${job.id} started processing in queue [${queueName}]`);
    });

    queue.on("completed", (job) => {
        logger.info(`Job ${job.id} completed in queue [${queueName}]`);
    });

    queue.on("failed", (job, error) => {
        logger.error(`Job ${job?.id} failed in queue [${queueName}]:`, error);
    });
};

// Set up listeners for all queues
setupQueueListeners(kycVerificationQueue, "KYC Verification");
setupQueueListeners(escrowMonitorQueue, "Escrow Monitor");
setupQueueListeners(tradeTimeoutQueue, "Trade Timeout");
setupQueueListeners(notificationQueue, "Notification");
setupQueueListeners(feeSweepQueue, "Fee Sweep");
setupQueueListeners(emailQueue, "Email");
setupQueueListeners(smsQueue, "SMS");

logger.info("All BullMQ queues initialized successfully");

export default {
    kycVerificationQueue,
    escrowMonitorQueue,
    tradeTimeoutQueue,
    notificationQueue,
    feeSweepQueue,
    emailQueue,
    smsQueue,
};
