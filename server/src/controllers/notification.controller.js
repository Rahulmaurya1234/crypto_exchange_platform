// src/controllers/notification.controller.js
import * as notificationService from "../services/notification.service.js";
import { logger } from "../utils/logger.js";

/**
 * Get user notifications
 */
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await notificationService.getUserNotifications(userId, page, limit);

        res.json({
            success: true,
            data: result.notifications,
            pagination: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
        });
    } catch (error) {
        logger.error("Error fetching notifications:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
        });
    }
};

/**
 * Mark notification as read
 */
export const markRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await notificationService.markAsRead(notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        res.json({
            success: true,
            message: "Notification marked as read",
        });
    } catch (error) {
        logger.error("Error marking notification as read:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark notification as read",
        });
    }
};

/**
 * Mark all notifications as read
 */
export const markAllRead = async (req, res) => {
    try {
        const userId = req.user._id;
        await notificationService.markAllAsRead?.(userId);

        res.json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        logger.error("Error marking all notifications as read:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark all notifications as read",
        });
    }
};
