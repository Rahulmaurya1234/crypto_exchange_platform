// src/api/v1/platform-b/analytics/routes.js
import { Router } from "express";
import * as analyticsController from "./controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";
import { authorize } from "../../../../middleware/rbac.middleware.js";
import { ROLES } from "../../../../constants/index.js";

const router = Router();

// All analytics routes require authentication and admin role
router.use(auth);
router.use(authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));

/**
 * @route   GET /api/v1/platform-b/analytics/overview
 * @desc    Get platform overview
 * @access  Admin
 */
router.get("/overview", analyticsController.getPlatformOverview);

/**
 * @route   GET /api/v1/platform-b/analytics/users
 * @desc    Get user analytics
 * @access  Admin
 */
router.get("/users", analyticsController.getUserAnalytics);

/**
 * @route   GET /api/v1/platform-b/analytics/trades
 * @desc    Get trade analytics
 * @access  Admin
 */
router.get("/trades", analyticsController.getTradeAnalytics);

/**
 * @route   GET /api/v1/platform-b/analytics/revenue
 * @desc    Get revenue analytics
 * @access  Admin
 */
router.get("/revenue", analyticsController.getRevenueAnalytics);

/**
 * @route   GET /api/v1/platform-b/analytics/listings
 * @desc    Get listing analytics
 * @access  Admin
 */
router.get("/listings", analyticsController.getListingAnalytics);

/**
 * @route   GET /api/v1/platform-b/analytics/dashboard-stats
 * @desc    Get dashboard statistics with time-series data
 * @access  Admin
 */
router.get("/dashboard-stats", analyticsController.getDashboardStats);

export default router;
