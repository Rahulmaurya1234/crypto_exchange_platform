// src/workers/notification.worker.js
import { Worker } from "bullmq";
import { bullmqConfig } from "../config/bullmq.config.js";
import { logger } from "../utils/logger.js";
import  Notification  from "../models/Notification.model.js";
import { emitToUser } from "../config/socket.config.js";
import { emailQueue, smsQueue } from "../queues/index.js";

/**
 * Notification Worker
 * Handles background processing of notifications
 */

const notificationWorker = new Worker(
    bullmqConfig.queues.notification.name,
    async (job) => {
        const { userId, type, title, message, data, channels } = job.data;

        logger.info(`Processing notification job ${job.id}: Type=${type}, User=${userId}`);

        try {
            // Save notification to database
            const notification = await Notification.create({
                userId,
                type,
                title,
                message,
                data,
                // status defaults to NOTIFICATION_STATUS.UNREAD
            });

            // Send via different channels
            const promises = [];

            // WebSocket notification (real-time)
            if (!channels || channels.includes("socket")) {
                emitToUser(userId, "notification:new", {
                    id: notification._id,
                    type,
                    title,
                    message,
                    data,
                    createdAt: notification.createdAt,
                });
            }

            // Email notification
            if (channels && channels.includes("email")) {
                promises.push(
                    emailQueue.add("send_notification", {
                        userId,
                        subject: title,
                        message,
                        notificationId: notification._id,
                    })
                );
            }

            // SMS notification
            if (channels && channels.includes("sms")) {
                promises.push(
                    smsQueue.add("send_notification", {
                        userId,
                        message: `${title}: ${message}`,
                        notificationId: notification._id,
                    })
                );
            }

            await Promise.all(promises);

            logger.info(`Notification job ${job.id} completed successfully`);
            return { success: true, notificationId: notification._id };
        } catch (error) {
            logger.error(`Notification job ${job.id} failed:`, error);
            throw error;
        }
    },
    {
        connection: bullmqConfig.connection,
        concurrency: 10,
    }
);

// Worker event handlers
notificationWorker.on("completed", (job) => {
    logger.info(`Notification worker completed job ${job.id}`);
});

notificationWorker.on("failed", (job, error) => {
    logger.error(`Notification worker failed job ${job?.id}:`, error);
});

notificationWorker.on("error", (error) => {
    logger.error("Notification worker error:", error);
});

logger.info("Notification Worker started");

export default notificationWorker;
