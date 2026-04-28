// src/workers/kyc.worker.js
import { Worker } from "bullmq";
import { bullmqConfig } from "../config/bullmq.config.js";
import { logger } from "../utils/logger.js";
import  KYC  from "../models/KYC.model.js";
import { emitToUser } from "../config/socket.config.js";

/**
 * KYC Verification Worker
 * Handles background processing of KYC verification tasks
 */

const kycVerificationWorker = new Worker(
    bullmqConfig.queues.kycVerification.name,
    async (job) => {
        const { kycId, type } = job.data;

        logger.info(`Processing KYC job ${job.id}: Type=${type}, KYC ID=${kycId}`);

        try {
            switch (type) {
                case "verify_documents":
                    await verifyDocuments(kycId);
                    break;

                case "facial_recognition":
                    await performFacialRecognition(kycId);
                    break;

                case "address_verification":
                    await verifyAddress(kycId);
                    break;

                case "background_check":
                    await performBackgroundCheck(kycId);
                    break;

                default:
                    throw new Error(`Unknown KYC verification type: ${type}`);
            }

            logger.info(`KYC job ${job.id} completed successfully`);
            return { success: true, kycId };
        } catch (error) {
            logger.error(`KYC job ${job.id} failed:`, error);
            throw error;
        }
    },
    {
        connection: bullmqConfig.connection,
        concurrency: 5,
    }
);

/**
 * Verify uploaded documents
 */
async function verifyDocuments(kycId) {
    logger.info(`Verifying documents for KYC: ${kycId}`);

    const kyc = await KYC.findById(kycId);
    if (!kyc) {
        throw new Error(`KYC record not found: ${kycId}`);
    }

    // Simulate document verification
    // In production, integrate with OCR/document verification service
    await new Promise((resolve) => setTimeout(resolve, 2000));

    kyc.documentVerificationStatus = "completed";
    kyc.verificationSteps.documents = true;
    await kyc.save();

    // Notify user via WebSocket
    emitToUser(kyc.userId.toString(), "kyc:update", {
        kycId,
        step: "documents",
        status: "completed",
    });
}

/**
 * Perform facial recognition
 */
async function performFacialRecognition(kycId) {
    logger.info(`Performing facial recognition for KYC: ${kycId}`);

    const kyc = await KYC.findById(kycId);
    if (!kyc) {
        throw new Error(`KYC record not found: ${kycId}`);
    }

    // Simulate facial recognition
    // In production, integrate with facial recognition service
    await new Promise((resolve) => setTimeout(resolve, 3000));

    kyc.facialRecognitionStatus = "completed";
    kyc.verificationSteps.selfie = true;
    await kyc.save();

    // Notify user via WebSocket
    emitToUser(kyc.userId.toString(), "kyc:update", {
        kycId,
        step: "facial_recognition",
        status: "completed",
    });
}

/**
 * Verify address
 */
async function verifyAddress(kycId) {
    logger.info(`Verifying address for KYC: ${kycId}`);

    const kyc = await KYC.findById(kycId);
    if (!kyc) {
        throw new Error(`KYC record not found: ${kycId}`);
    }

    // Simulate address verification
    // In production, integrate with address verification service
    await new Promise((resolve) => setTimeout(resolve, 2000));

    kyc.addressVerificationStatus = "completed";
    kyc.verificationSteps.address = true;
    await kyc.save();

    // Notify user via WebSocket
    emitToUser(kyc.userId.toString(), "kyc:update", {
        kycId,
        step: "address",
        status: "completed",
    });
}

/**
 * Perform background check
 */
async function performBackgroundCheck(kycId) {
    logger.info(`Performing background check for KYC: ${kycId}`);

    const kyc = await KYC.findById(kycId);
    if (!kyc) {
        throw new Error(`KYC record not found: ${kycId}`);
    }

    // Simulate background check
    // In production, integrate with background check service
    await new Promise((resolve) => setTimeout(resolve, 5000));

    kyc.backgroundCheckStatus = "completed";
    await kyc.save();

    // Notify user via WebSocket
    emitToUser(kyc.userId.toString(), "kyc:update", {
        kycId,
        step: "background_check",
        status: "completed",
    });
}

// Worker event handlers
kycVerificationWorker.on("completed", (job) => {
    logger.info(`KYC worker completed job ${job.id}`);
});

kycVerificationWorker.on("failed", (job, error) => {
    logger.error(`KYC worker failed job ${job?.id}:`, error);
});

kycVerificationWorker.on("error", (error) => {
    logger.error("KYC worker error:", error);
});

logger.info("KYC Verification Worker started");

export default kycVerificationWorker;
