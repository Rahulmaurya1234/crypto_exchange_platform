// src/api/v1/platform-b/support/routes.js
import { Router } from "express";
import * as supportController from "./controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";
import { authorize } from "../../../../middleware/rbac.middleware.js";
import { ROLES } from "../../../../constants/index.js";

const router = Router();

// All support routes require authentication and support/admin role
router.use(auth);
router.use(authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SUPPORT));

/**
 * @route   GET /api/v1/platform-b/support/stats
 * @desc    Get support statistics
 * @access  Support/Admin
 */
router.get("/stats", supportController.getSupportStats);

/**
 * @route   GET /api/v1/platform-b/support/my-tickets
 * @desc    Get assigned tickets
 * @access  Support
 */
router.get("/my-tickets", supportController.getMyTickets);

/**
 * @route   GET /api/v1/platform-b/support/tickets
 * @desc    Get support tickets
 * @access  Support
 */
router.get("/tickets", supportController.getSupportTickets);

/**
 * @route   POST /api/v1/platform-b/support/chat/:chatId/join
 * @desc    Join chat as support agent
 * @access  Support
 */
router.post("/chat/:chatId/join", supportController.joinChat);

export default router;
