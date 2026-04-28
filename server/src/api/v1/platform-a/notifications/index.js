// src/api/v1/platform-a/notifications/index.js
import express from "express";
import * as notificationController from "../../../../controllers/notification.controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";

const router = express.Router();

// All notification routes require authentication
router.use(auth);

// Get my notifications
router.get("/", notificationController.getMyNotifications);

// Mark notification as read
router.patch("/:notificationId/read", notificationController.markRead);

// Mark all notifications as read
router.patch("/read-all", notificationController.markAllRead);

export default router;
