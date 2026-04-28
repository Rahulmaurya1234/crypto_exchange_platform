// src/api/v1/platform-b/disputes/routes.js
import { Router } from "express";
import * as disputeController from "./controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";
import { authorize } from "../../../../middleware/rbac.middleware.js";
import { ROLES } from "../../../../constants/index.js";

const router = Router();

// All dispute routes require authentication and admin/support role
router.use(auth);
router.use(authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SUPPORT));

/**
 * @route   GET /api/v1/platform-b/disputes/stats
 * @desc    Get dispute statistics
 * @access  Admin
 */
router.get("/stats", disputeController.getDisputeStats);

/**
 * @route   GET /api/v1/platform-b/disputes/open
 * @desc    Get open disputes
 * @access  Admin
 */
router.get("/open", disputeController.getOpenDisputes);

/**
 * @route   GET /api/v1/platform-b/disputes
 * @desc    Get all disputes
 * @access  Admin
 */
router.get("/", disputeController.getAllDisputes);

/**
 * @route   GET /api/v1/platform-b/disputes/:id
 * @desc    Get dispute by ID
 * @access  Admin
 */
router.get("/:id", disputeController.getDisputeById);

/**
 * @route   POST /api/v1/platform-b/disputes/:id/assign
 * @desc    Assign dispute to support agent
 * @access  Admin
 */
router.post("/:id/assign", disputeController.assignDispute);

router.post("/:id/resolve", disputeController.resolveDispute);

/**
 * @route   POST /api/v1/platform-b/disputes/:id/resolve-appeal
 * @desc    Resolve appeal
 * @access  Admin
 */
router.post("/:id/resolve-appeal", disputeController.resolveAppeal);

export default router;
