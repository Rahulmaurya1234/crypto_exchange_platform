// src/workers/index.js
import kycVerificationWorker from "./kyc.worker.js";
import notificationWorker from "./notification.worker.js";
import emailWorker from "./email.worker.js";
import tradeTimeoutWorker from "./trade.worker.js";
import escrowMonitorWorker from "./escrow.worker.js";
import { logger } from "../utils/logger.js";

/**
 * Initialize all BullMQ workers
 */
export const initializeWorkers = () => {
    logger.info("Initializing BullMQ workers...");

    // Workers are automatically started when imported
    // This function serves as a central initialization point

    const workers = [
        { name: "KYC Verification", worker: kycVerificationWorker },
        { name: "Notification", worker: notificationWorker },
        { name: "Email", worker: emailWorker },
        { name: "Trade Timeout", worker: tradeTimeoutWorker },
        { name: "Escrow Monitor", worker: escrowMonitorWorker },
    ];

    logger.info(`${workers.length} workers initialized and running`);

    return workers;
};

/**
 * Gracefully close all workers
 */
export const closeWorkers = async () => {
    logger.info("Closing all workers...");

    const workers = [
        kycVerificationWorker,
        notificationWorker,
        emailWorker,
        tradeTimeoutWorker,
        escrowMonitorWorker,
    ];

    await Promise.all(workers.map((worker) => worker.close()));

    logger.info("All workers closed successfully");
};

export default {
    initializeWorkers,
    closeWorkers,
};
