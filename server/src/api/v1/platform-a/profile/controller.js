// src/api/v1/platform-a/profile/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import { BadRequestError, NotFoundError } from "../../../../utils/ApiError.js";
import User from "../../../../models/User.model.js";
import { logger } from "../../../../utils/logger.js";

/**
 * Get own profile
 * @route GET /api/v1/platform-a/profile
 * @access Private
 */
export const getOwnProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
        throw NotFoundError("User not found");
    }

    res.json(new ApiResponse(200, { user }, "Profile retrieved successfully"));
});

/**
 * Update profile
 * @route PUT /api/v1/platform-a/profile
 * @access Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const updateData = req.body;
    const lang = req.language || "en";

    // Fields that can be updated
    const allowedFields = [
        "name",
        "altMobileNumber",
        "gender",
        "address",
        "city",
        "state",
        "pincode",
        "avatar",
        "bio",
        "preferredLanguage",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
            updates[field] = updateData[field];
        }
    });

    const user = await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
    }).select("-password -refreshToken");

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    logger.info("Profile updated", { userId });

    res.json(new ApiResponse(200, { user }, "Profile updated successfully"));
});

/**
 * Get public profile by user ID
 * @route GET /api/v1/platform-a/profile/:userId
 * @access Public
 */
export const getPublicProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const lang = req.language || "en";

    const user = await User.findById(userId).select(
        "name avatar bio averageRating totalReviews totalTradesCompleted isInstantSeller completionRate createdAt"
    );

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    res.json(new ApiResponse(200, { user }, "Public profile retrieved successfully"));
});

/**
 * Upload avatar
 * @route POST /api/v1/platform-a/profile/avatar
 * @access Private
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { avatarUrl } = req.body;
    const lang = req.language || "en";

    if (!avatarUrl) {
        throw BadRequestError("Avatar URL is required", {}, lang);
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { avatar: avatarUrl },
        { new: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    logger.info("Avatar uploaded", { userId });

    res.json(new ApiResponse(200, { user }, "Avatar updated successfully"));
});

/**
 * Get profile statistics
 * @route GET /api/v1/platform-a/profile/stats
 * @access Private
 */
export const getProfileStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
        "totalTradesCompleted averageRating totalReviews completionRate kycStatus accountStatus"
    );

    if (!user) {
        throw NotFoundError("User not found");
    }

    const stats = {
        totalTradesCompleted: user.totalTradesCompleted || 0,
        averageRating: user.averageRating || 0,
        totalReviews: user.totalReviews || 0,
        completionRate: user.completionRate || 0,
        kycStatus: user.kycStatus,
        accountStatus: user.accountStatus,
    };

    res.json(new ApiResponse(200, { stats }, "Profile statistics retrieved successfully"));
});

/**
 * Update preferences
 * @route PUT /api/v1/platform-a/profile/preferences
 * @access Private
 */
export const updatePreferences = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { preferences } = req.body;
    const lang = req.language || "en";

    const user = await User.findByIdAndUpdate(
        userId,
        {
            "settings.notifications": preferences.notifications,
            "settings.twoFactorEnabled": preferences.twoFactorEnabled,
            preferredLanguage: preferences.language,
        },
        { new: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    logger.info("Preferences updated", { userId });

    res.json(new ApiResponse(200, { user }, "Preferences updated successfully"));
});

export default {
    getOwnProfile,
    updateProfile,
    getPublicProfile,
    uploadAvatar,
    getProfileStats,
    updatePreferences,
};
