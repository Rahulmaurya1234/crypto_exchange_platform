// src/controllers/user.controller.js
import User from "../../../../models/User.model.js";
import Trade from "../../../../models/Trade.model.js";
import { TRADE_STATUS } from "../../../../constants/statuses.js";
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../../../utils/ApiError.js";
import ApiResponse from "../../../../utils/ApiResponse.js";
import logger from "../../../../utils/logger.js";

/**
 * Get own profile
 * @route GET /api/v1/users/profile
 * @access Private
 */
export const getProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const lang = req.language || "en";

    const user = await User.findById(userId).select("-password");

    if (!user) {
        throw new NotFoundError("USER_001", {}, lang);
    }

    logger.info("Profile retrieved", { userId });

    res.json(new ApiResponse(200, user, "Profile retrieved successfully"));
});

/**
 * Update own profile
 * @route PUT /api/v1/users/profile
 * @access Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const lang = req.language || "en";

    const {
        name,
        mobileNumber,
        altMobileNumber,
        gender,
        address,
        city,
        state,
        pincode,
        bio,
        preferredLanguage,
    } = req.body;

    // Fields that can be updated
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
    if (altMobileNumber !== undefined) updateData.altMobileNumber = altMobileNumber;
    if (gender !== undefined) updateData.gender = gender;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (bio !== undefined) updateData.bio = bio;
    if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage;

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
        throw new NotFoundError("USER_001", {}, lang);
    }

    logger.info("Profile updated", { userId, updatedFields: Object.keys(updateData) });

    res.json(new ApiResponse(200, user, "Profile updated successfully"));
});

/**
 * Get user by ID (public profile)
 * @route GET /api/v1/users/:id
 * @access Public
 */
export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const lang = req.language || "en";

    const user = await User.findById(id).select(
        "name role averageRating totalReviews tradingStats createdAt isInstantSeller kycStatus profilePictureUrl bio country gender mobileNumber altMobileNumber address city state pincode email emailVerified phoneVerified completedTrades completionRate totalTrades averageRating preferredLanguage kycLevel kycSubmittedAt kycApprovedAt kycRejectedAt kycRejectionReason kycReviewedBy"
    );

    if (!user) {
        throw new NotFoundError("USER_001", {}, lang);
    }

    res.json(new ApiResponse(200, user, "User profile retrieved"));
});

/**
 * Get user reviews
 * @route GET /api/v1/users/:id/reviews
 * @access Public
 */
export const getUserReviews = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const lang = req.language || "en";

    const user = await User.findById(id);
    if (!user) {
        throw new NotFoundError("USER_001", {}, lang);
    }

    // Get reviews with pagination
    const skip = (page - 1) * limit;
    const reviews = user.reviews
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(skip, skip + parseInt(limit));

    const totalReviews = user.reviews.length;
    const totalPages = Math.ceil(totalReviews / limit);

    res.json(
        new ApiResponse(200, {
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: totalReviews,
                itemsPerPage: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            averageRating: user.averageRating,
            totalReviews: user.totalReviews,
        }, "Reviews retrieved successfully")
    );
});

/**
 * Add review for user
 * @route POST /api/v1/users/:id/reviews
 * @access Private
 */
export const addReview = asyncHandler(async (req, res) => {
    const { id: sellerId } = req.params;
    const { tradeId, rating, comment } = req.body;
    const reviewerId = req.user._id;
    const reviewerName = req.user.name;
    const lang = req.language || "en";

    // Cannot review yourself
    if (sellerId === reviewerId.toString()) {
        throw new BadRequestError("REVIEW_001", {}, lang);
    }

    // Find the trade
    const trade = await Trade.findById(tradeId);
    if (!trade) {
        throw new NotFoundError("TRADE_001", {}, lang);
    }

    // Verify the reviewer was part of the trade
    const isReviewerInvolved =
        trade.buyerId.toString() === reviewerId.toString() ||
        trade.sellerId.toString() === reviewerId.toString();

    if (!isReviewerInvolved) {
        throw new ForbiddenError("REVIEW_002", {}, lang);
    }

    // Verify the sellerId matches trade seller
    if (trade.sellerId.toString() !== sellerId) {
        throw new BadRequestError("REVIEW_003", {}, lang);
    }

    // Only allow reviews for completed trades
    if (trade.status !== TRADE_STATUS.COMPLETED) {
        throw new BadRequestError("TRADE_002", {}, lang);
    }

    // Find seller
    const seller = await User.findById(sellerId);
    if (!seller) {
        throw new NotFoundError("USER_001", {}, lang);
    }

    // Check if already reviewed
    const existingReview = seller.reviews.find(
        (r) => r.tradeId.toString() === tradeId
    );
    if (existingReview) {
        throw new BadRequestError("TRADE_003", {}, lang);
    }

    // Add review
    await seller.addReview(reviewerId, reviewerName, tradeId, rating, comment, true);

    logger.info("Review added", { reviewerId, sellerId, tradeId, rating });

    res.status(201).json(
        new ApiResponse(201, {
            averageRating: seller.averageRating,
            totalReviews: seller.totalReviews,
        }, "Review added successfully")
    );
});

/**
 * Get user statistics
 * @route GET /api/v1/users/:id/stats
 * @access Public
 */
export const getUserStats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const lang = req.language || "en";

    const user = await User.findById(id).select(
        "tradingStats averageRating totalReviews createdAt"
    );

    if (!user) {
        throw new NotFoundError("USER_001", {}, lang);
    }

    // Get additional stats from trades
    const completedTrades = await Trade.countDocuments({
        $or: [{ buyerId: id }, { sellerId: id }],
        status: TRADE_STATUS.COMPLETED,
    });

    const totalVolume = await Trade.aggregate([
        {
            $match: {
                sellerId: id,
                status: TRADE_STATUS.COMPLETED,
            },
        },
        {
            $group: {
                _id: null,
                totalVolume: { $sum: "$cryptoAmount" },
            },
        },
    ]);

    res.json(
        new ApiResponse(200, {
            tradingStats: user.tradingStats,
            averageRating: user.averageRating,
            totalReviews: user.totalReviews,
            completedTrades,
            totalVolume: totalVolume[0]?.totalVolume || 0,
            memberSince: user.createdAt,
        }, "User statistics retrieved")
    );
});

/**
 * Delete own account (soft delete)
 * @route DELETE /api/v1/users/profile
 * @access Private
 */
export const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { password } = req.body;
    const lang = req.language || "en";

    // Verify password
    const user = await User.findById(userId).select("+password");
    if (!user) {
        throw new NotFoundError("USER_001", {}, lang);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new BadRequestError("AUTH_001", {}, lang);
    }

    // Check if user has active trades
    const activeTrades = await Trade.countDocuments({
        $or: [{ buyerId: userId }, { sellerId: userId }],
        status: { $in: [TRADE_STATUS.PENDING, TRADE_STATUS.PAYMENT_PENDING, TRADE_STATUS.PAYMENT_SENT] },
    });

    if (activeTrades > 0) {
        throw new BadRequestError("USER_002", {}, lang);
    }

    // Soft delete: Update account status
    user.accountStatus = "deleted";
    user.email = `deleted_${Date.now()}_${user.email}`;
    user.mobileNumber = `deleted_${Date.now()}_${user.mobileNumber}`;
    await user.save();

    logger.info("Account deleted", { userId });

    res.json(new ApiResponse(200, "Account deleted successfully"));
});
