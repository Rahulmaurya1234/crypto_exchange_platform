// src/api/v1/platform-b/admin/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../../../utils/ApiError.js";
import User from "../../../../models/User.model.js";
import * as kycService from "../../../../services/kyc.service.js";
import * as tradeService from "../../../../services/trade.service.js";
import * as adminNotificationService from "../../../../services/adminNotification.service.js";
import * as auditService from "../../../../services/audit.service.js";
import { ACCOUNT_STATUS } from "../../../../constants/index.js";
import { logger } from "../../../../utils/logger.js";
import { ROLES } from "../../../../constants/roles.js";
/**
 * Get all users
 * @route GET /api/v1/platform-b/admin/users
 * @access Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, role, accountStatus, kycStatus } = req.query;

    const query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { mobileNumber: { $regex: search, $options: "i" } },
        ];
    }

    if (role) {
        query.role = role;
    }

    if (accountStatus) {
        query.accountStatus = accountStatus;
    }

    if (kycStatus) {
        query.kycStatus = kycStatus;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find(query)
            .select("-password -refreshToken -twoFactorSecret")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        User.countDocuments(query),
    ]);

    res.json(
        new ApiResponse(
            200,
            {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
            "Users retrieved successfully"
        )
    );
});

/**
 * Get user by ID (Admin view)
 * @route GET /api/v1/platform-b/admin/users/:id
 * @access Admin
 */
export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const lang = req.language || "en";

    const user = await User.findById(id).select("-password -refreshToken -twoFactorSecret");

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    // Get user's trade stats
    const tradeStats = await tradeService.getUserTradeStats(id);

    res.json(
        new ApiResponse(
            200,
            {
                user,
                tradeStats,
            },
            "User details retrieved successfully"
        )
    );
});

/**
 * Suspend user
 * @route POST /api/v1/platform-b/admin/users/:id/suspend
 * @access Admin
 */
export const suspendUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;
    const lang = req.language || "en";

    const user = await User.findById(id);

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    user.accountStatus = ACCOUNT_STATUS.SUSPENDED;
    user.suspendedAt = new Date();
    user.suspendedBy = adminId;
    user.suspensionReason = reason;

    await user.save();

    logger.info("User suspended", { userId: id, adminId, reason });

    // Emit admin notification
    await adminNotificationService.notifyUserSuspended(user, adminId, req.user.name, reason);

    res.json(new ApiResponse(200, { user }, "User suspended successfully"));
});

/**
 * Unsuspend user
 * @route POST /api/v1/platform-b/admin/users/:id/unsuspend
 * @access Admin
 */
export const unsuspendUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user._id;
    const lang = req.language || "en";

    const user = await User.findById(id);

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    user.suspendedAt = null;
    user.suspendedBy = null;
    user.suspensionReason = null;

    await user.save();

    logger.info("User unsuspended", { userId: id, adminId });

    // Emit admin notification
    await adminNotificationService.notifyUserUnsuspended(user, adminId, req.user.name);

    res.json(new ApiResponse(200, { user }, "User unsuspended successfully"));
});

/**
 * Ban user
 * @route POST /api/v1/platform-b/admin/users/:id/ban
 * @access Admin
 */
export const banUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;
    const lang = req.language || "en";

    const user = await User.findById(id);

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    user.accountStatus = ACCOUNT_STATUS.BANNED;
    user.bannedAt = new Date();
    user.bannedBy = adminId;
    user.banReason = reason;

    await user.save();

    logger.info("User banned", { userId: id, adminId, reason });

    // Emit admin notification
    await adminNotificationService.notifyUserBanned(user, adminId, req.user.name, reason);

    res.json(new ApiResponse(200, { user }, "User banned successfully"));
});

/**
 * Approve instant seller
 * @route POST /api/v1/platform-b/admin/users/:id/approve-instant-seller
 * @access Admin
 */
export const approveInstantSeller = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user._id;
    const lang = req.language || "en";

    const user = await User.findById(id);

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    user.isInstantSeller = true;
    user.instantSellerApprovedAt = new Date();

    await user.save();

    logger.info("Instant seller approved", { userId: id, adminId });

    // Emit admin notification
    await adminNotificationService.notifyInstantSellerApproved(user, adminId, req.user.name);

    res.json(new ApiResponse(200, { user }, "Instant seller approved successfully"));
});

/**
 * Review KYC
 * @route POST /api/v1/platform-b/admin/kyc/:id/review
 * @access Admin
 */
export const reviewKYC = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reviewData = req.body;
    const reviewerId = req.user._id;
    const lang = req.language || "en";

    const kyc = await kycService.reviewKYC(id, reviewData, reviewerId);

    if (!kyc) {
        throw NotFoundError("KYC not found", {}, lang);
    }

    res.json(new ApiResponse(200, { kyc }, "KYC reviewed successfully"));
});

/**
 * Get pending KYC submissions
 * @route GET /api/v1/platform-b/admin/kyc/pending
 * @access Admin
 */
export const getPendingKYCs = asyncHandler(async (req, res) => {
    const filters = req.query;

    const result = await kycService.getPendingKYCs(filters);

    res.json(
        new ApiResponse(
            200,
            {
                kycs: result.kycs,
                pagination: result.pagination,
            },
            "Pending KYCs retrieved successfully"
        )
    );
});

/**
 * Get all KYCs
 * @route GET /api/v1/platform-b/admin/kyc
 * @access Admin
 */
export const getAllKYCs = asyncHandler(async (req, res) => {
    const filters = req.query;

    const result = await kycService.getAllKYCs(filters);

    res.json(
        new ApiResponse(
            200,
            {
                kycs: result.kycs,
                pagination: result.pagination,
            },
            "KYCs retrieved successfully"
        )
    );
});

/**
 * Get all trades (Admin)
 * @route GET /api/v1/platform-b/admin/trades
 * @access Admin
 */
export const getAllTrades = asyncHandler(async (req, res) => {
    const filters = req.query;

    const result = await tradeService.getAllTrades(filters);

    res.json(
        new ApiResponse(
            200,
            {
                trades: result.trades,
                pagination: result.pagination,
            },
            "Trades retrieved successfully"
        )
    );
});

/**
 * Get dashboard statistics
 * @route GET /api/v1/platform-b/admin/stats
 * @access Admin
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalTrades,
        kycStats,
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ accountStatus: ACCOUNT_STATUS.ACTIVE }),
        User.countDocuments({ accountStatus: ACCOUNT_STATUS.SUSPENDED }),
        tradeService.getAllTrades({ limit: 1 }).then(result => result.pagination.total),
        kycService.getKYCStats(),
    ]);

    const stats = {
        users: {
            total: totalUsers,
            active: activeUsers,
            suspended: suspendedUsers,
        },
        trades: {
            total: totalTrades,
        },
        kyc: kycStats,
    };

    res.json(new ApiResponse(200, { stats }, "Dashboard statistics retrieved successfully"));
});

export const getTradeById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const lang = req.language || "en";
    const trade = await tradeService.getTradeById(id);

    if (!trade) {
        throw NotFoundError("Trade not found", {}, lang);
    }
    res.json(new ApiResponse(200, { trade }, "Trade retrieved successfully"));
});


/**
 * Approve user email (SUPER_ADMIN only)
 * @route POST /api/v1/platform-b/admin/users/:id/approve-email
 * @access SUPER_ADMIN
 */
export const approveUserEmail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const lang = req.language || "en";

    // 🔒 HARD CHECK: ONLY SUPER_ADMIN
    if (req.user.role !== ROLES.SUPER_ADMIN) {
        throw ForbiddenError(
            "Only SUPER_ADMIN can approve user accounts",
            {},
            lang
        );
    }

    const user = await User.findById(id);

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    // ✅ Approve email
    user.emailVerified = true;
    user.emailVerifiedAt = new Date(); // optional but recommended
    user.emailApprovedBy = req.user._id;    // optional audit trail

    await user.save();

    logger.info("User email approved by SUPER_ADMIN", {
        approvedUserId: id,
        emailApprovedBy: req.user._id,
    });

    // Emit admin notification
    await adminNotificationService.notifyUserEmailApproved(user, req.user._id, req.user.name);

    res.json(
        new ApiResponse(
            200,
            { user },
            "User email approved successfully"
        )
    );
});



/**
 * Get own role and permissions
 * @route GET /api/v1/platform-b/admin/me/role
 * @access Authenticated (support, support_manager, admin, super_admin)
 */
export const getOwnRole = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const lang = req.language || "en";

    const user = await User.findById(userId).select(
        "email role permissions accountStatus kycStatus emailVerified"
    );

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    // Response data
    const roleInfo = {
        userId: user._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        accountStatus: user.accountStatus,
        kycStatus: user.kycStatus,
        emailVerified: user.emailVerified,
    };

    res.json(
        new ApiResponse(
            200,
            roleInfo,
            "Role and permissions retrieved successfully"
        )
    );
});

// ====================  ADMIN NOTIFICATIONS ====================

/**
 * Get admin notifications
 * @route GET /api/v1/platform-b/admin/notifications
 * @access Admin
 */
export const getAdminNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;

    const result = await adminNotificationService.getAdminNotifications(
        parseInt(page),
        parseInt(limit),
        status
    );

    res.json(
        new ApiResponse(
            200,
            result,
            "Notifications retrieved successfully"
        )
    );
});

/**
 * Get unread notification count
 * @route GET /api/v1/platform-b/admin/notifications/unread-count
 * @access Admin
 */
export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
    const count = await adminNotificationService.getUnreadCount();

    res.json(
        new ApiResponse(
            200,
            { count },
            "Unread count retrieved successfully"
        )
    );
});

/**
 * Mark notification as read
 * @route POST /api/v1/platform-b/admin/notifications/:id/read
 * @access Admin
 */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user._id;

    const notification = await adminNotificationService.markAsRead(id, adminId);

    if (!notification) {
        throw NotFoundError("Notification not found");
    }

    res.json(
        new ApiResponse(
            200,
            { notification },
            "Notification marked as read"
        )
    );
});

/**
 * Mark all notifications as read
 * @route POST /api/v1/platform-b/admin/notifications/read-all
 * @access Admin
 */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const adminId = req.user._id;

    await adminNotificationService.markAllAsRead(adminId);

    res.json(
        new ApiResponse(
            200,
            {},
            "All notifications marked as read"
        )
    );
});

/**
 * Update own profile
 * @route PUT /api/v1/platform-b/admin/me/profile
 * @access Authenticated
 */
export const updateOwnProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { name } = req.body;
    const lang = req.language || "en";

    // Allow updating name and other minor settings if required in the future
    const user = await User.findByIdAndUpdate(
        userId,
        { name },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    logger.info("Admin profile updated", { userId });

    res.json(new ApiResponse(200, { user }, "Profile updated successfully"));
});

/**
 * Change own password
 * @route POST /api/v1/platform-b/admin/me/change-password
 * @access Authenticated
 */
export const changeOwnPassword = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;
    const lang = req.language || "en";

    if (!oldPassword || !newPassword) {
        throw BadRequestError("Both old and new password are required", {}, lang);
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
        throw BadRequestError("Invalid old password", {}, lang);
    }

    user.password = newPassword;
    await user.save();

    logger.info("Admin password changed", { userId });

    res.json(new ApiResponse(200, {}, "Password changed successfully"));
});

/**
 * Get audit logs
 * @route GET /api/v1/platform-b/admin/logs
 * @access Admin
 */
export const getLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, action, actorId, targetModel, startDate, endDate } = req.query;

    const result = await auditService.getAuditLogs(
        { action, actorId, targetModel, startDate, endDate },
        parseInt(page),
        parseInt(limit)
    );

    res.json(new ApiResponse(200, result, "Audit logs retrieved successfully"));
});

export default {
    getAllUsers,
    getUserById,
    suspendUser,
    unsuspendUser,
    banUser,
    approveInstantSeller,
    reviewKYC,
    getPendingKYCs,
    getAllKYCs,
    getAllTrades,
    getDashboardStats,
    approveUserEmail,
    getOwnRole,
    getAdminNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateOwnProfile,
    changeOwnPassword,
    getLogs,
};

