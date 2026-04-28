// src/workers/email.worker.js
import { Worker } from "bullmq";
import { bullmqConfig } from "../config/bullmq.config.js";
import { logger } from "../utils/logger.js";
import { sendEmail } from "../utils/email.util.js";
import User  from "../models/User.model.js";

/**
 * Email Worker
 * Handles background processing of email sending
 */

const emailWorker = new Worker(
    bullmqConfig.queues.emailQueue.name,
    async (job) => {
        const { type, userId, to, subject, message, template, data } = job.data;

        logger.info(`Processing email job ${job.id}: Type=${type}`);

        try {
            let emailTo = to;
            let emailSubject = subject;
            let emailMessage = message;

            // If userId is provided, fetch user email
            if (userId && !to) {
                const user = await User.findById(userId).select("email name");
                if (!user) {
                    throw new Error(`User not found: ${userId}`);
                }
                emailTo = user.email;
            }

            // Handle different email types
            switch (type) {
                case "welcome":
                    emailSubject = "Welcome to Cryptians P2P Marketplace";
                    emailMessage = `Welcome ${data.name}! Thank you for joining our platform.`;
                    break;

                case "kyc_approved":
                    emailSubject = "KYC Verification Approved";
                    emailMessage = "Congratulations! Your KYC verification has been approved.";
                    break;

                case "kyc_rejected":
                    emailSubject = "KYC Verification Rejected";
                    emailMessage = `Your KYC verification was rejected. Reason: ${data.reason}`;
                    break;

                case "trade_initiated":
                    emailSubject = "New Trade Initiated";
                    emailMessage = `A new trade has been initiated. Trade ID: ${data.tradeId}`;
                    break;

                case "trade_completed":
                    emailSubject = "Trade Completed";
                    emailMessage = `Your trade has been completed successfully. Trade ID: ${data.tradeId}`;
                    break;

                case "dispute_created":
                    emailSubject = "Dispute Created";
                    emailMessage = `A dispute has been created for your trade. Dispute ID: ${data.disputeId}`;
                    break;

                case "password_reset":
                    emailSubject = "Password Reset Request";
                    emailMessage = `Click the link to reset your password: ${data.resetLink}`;
                    break;

                case "send_notification":
                    // Custom notification email
                    emailSubject = subject || "Notification from Cryptians";
                    emailMessage = message;
                    break;

                default:
                    emailSubject = subject || "Notification from Cryptians";
                    emailMessage = message || "You have a new notification.";
            }

            // Send email
            await sendEmail({
                to: emailTo,
                subject: emailSubject,
                text: emailMessage,
                html: template || `<p>${emailMessage}</p>`,
            });

            logger.info(`Email job ${job.id} completed successfully`);
            return { success: true, to: emailTo };
        } catch (error) {
            logger.error(`Email job ${job.id} failed:`, error);
            throw error;
        }
    },
    {
        connection: bullmqConfig.connection,
        concurrency: 5,
    }
);

// Worker event handlers
emailWorker.on("completed", (job) => {
    logger.info(`Email worker completed job ${job.id}`);
});

emailWorker.on("failed", (job, error) => {
    logger.error(`Email worker failed job ${job?.id}:`, error);
});

emailWorker.on("error", (error) => {
    logger.error("Email worker error:", error);
});

logger.info("Email Worker started");

export default emailWorker;
