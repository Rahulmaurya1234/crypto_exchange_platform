// src/api/v1/platform-b/admin/routes.js
import { Router } from "express";
import * as adminController from "./controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";
import { authorize, isAdmin } from "../../../../middleware/rbac.middleware.js";
import { validate } from "../../../../middleware/validate.middleware.js";
import { reviewKycSchema } from "../../../../validators/kyc.validator.js";
import { ROLES } from "../../../../constants/index.js";

const router = Router();

// All admin routes require authentication and admin role
router.use(auth);

router.use(isAdmin());

/**
 * @route   GET /api/v1/platform-b/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin
 */
router.get("/stats", adminController.getDashboardStats);

/**
 * @route   GET /api/v1/platform-b/admin/users
 * @desc    Get all users
 * @access  Admin
 */
router.get("/users", adminController.getAllUsers);

/**
 * @route   GET /api/v1/platform-b/admin/users/:id
 * @desc    Get user by ID
 * @access  Admin
 */
router.get("/users/:id", adminController.getUserById);

/**
 * @route   POST /api/v1/platform-b/admin/users/:id/suspend
 * @desc    Suspend user
 * @access  Admin
 */
router.post("/users/:id/suspend", adminController.suspendUser);

/**
 * @route   POST /api/v1/platform-b/admin/users/:id/unsuspend
 * @desc    Unsuspend user
 * @access  Admin
 */
router.post("/users/:id/unsuspend", adminController.unsuspendUser);

/**
 * @route   POST /api/v1/platform-b/admin/users/:id/ban
 * @desc    Ban user
 * @access  Admin
 */
router.post("/users/:id/ban", adminController.banUser);

/**
 * @route   POST /api/v1/platform-b/admin/users/:id/approve-instant-seller
 * @desc    Approve instant seller
 * @access  Admin
 */
router.post(
  "/users/:id/approve-instant-seller",
  adminController.approveInstantSeller
);

/**
 * @route   GET /api/v1/platform-b/admin/kyc/pending
 * @desc    Get pending KYC submissions
 * @access  Admin
 */
router.get("/kyc/pending", adminController.getPendingKYCs);

/**
 * @route   GET /api/v1/platform-b/admin/kyc
 * @desc    Get all KYCs
 * @access  Admin
 */
router.get("/kyc", adminController.getAllKYCs);

/**
 * @route   POST /api/v1/platform-b/admin/kyc/:id/review
 * @desc    Review KYC (Approve/Reject/Request Resubmission)
 * @access  Admin
 */
router.post(
  "/kyc/:id/review",
  validate(reviewKycSchema),
  adminController.reviewKYC
);

/**
 * @route   GET /api/v1/platform-b/admin/trades
 * @desc    Get all trades
 * @access  Admin
 */
router.get("/trades", adminController.getAllTrades);

router.get("/trades/:id", adminController.getTradeById);

router.post("/users/:id/approve-email", adminController.approveUserEmail);


router.get('/me/role', adminController.getOwnRole);

// ==================== NOTIFICATION ROUTES ====================

/**
 * @route   GET /api/v1/platform-b/admin/notifications
 * @desc    Get admin notifications
 * @access  Admin
 */
router.get("/notifications", adminController.getAdminNotifications);

/**
 * @route   GET /api/v1/platform-b/admin/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Admin
 */
router.get("/notifications/unread-count", adminController.getUnreadNotificationCount);

/**
 * @route   POST /api/v1/platform-b/admin/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Admin
 */
router.post("/notifications/:id/read", adminController.markNotificationAsRead);

/**
 * @route   POST /api/v1/platform-b/admin/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Admin
 */
router.post("/notifications/read-all", adminController.markAllNotificationsAsRead);

// ==================== PROFILE ROUTES ====================

/**
 * @route   PUT /api/v1/platform-b/admin/me/profile
 * @desc    Update admin profile details
 * @access  Authenticated
 */
router.put("/me/profile", adminController.updateOwnProfile);

/**
 * @route   POST /api/v1/platform-b/admin/me/change-password
 * @desc    Change admin password
 * @access  Authenticated
 */
router.post("/me/change-password", adminController.changeOwnPassword);

/**
 * @route   GET /api/v1/platform-b/admin/logs
 * @desc    Get audit logs
 * @access  Admin
 */
router.get("/logs", adminController.getLogs);

export default router;
