import User from "../../../../models/User.model.js";
import Trade from "../../../../models/Trade.model.js";
import { TRADE_STATUS } from "../../../../constants/index.js";
import ApiError from "../../../../utils/ApiError.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../../utils/asyncHandler.js";

/**
 * @desc    Submit review for a completed trade
 * @route   POST /api/v1/platform-a/reviews/trade/:tradeId
 * @access  Private (Buyer only)
 */
export const submitReview = asyncHandler(async (req, res) => {
  const { tradeId } = req.params;
  const { rating, comment } = req.body;
  const reviewerId = req.user._id;
  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  if (comment && comment.length > 1000) {
    throw new ApiError(400, "Comment is too long");
  }

  // 1. Find and validate trade
  const trade = await Trade.findById(tradeId);

  if (!trade) {
    throw new ApiError(404, "Trade not found");
  }

  // 2. Check if trade is completed
  if (trade.status !== TRADE_STATUS.COMPLETED) {
    throw new ApiError(400, "Can only review completed trades");
  }

  // 3. Verify reviewer is the buyer
  const isBuyer = trade.buyerId.toString() === reviewerId.toString();
  if (!isBuyer) {
    throw new ApiError(403, "Only buyer can review the seller");
  }

  // 4. Check if trade is already reviewed
  // if (trade.isReviewed) {
  //     throw new ApiError(400, "This trade has already been reviewed");
  // }
  if (trade.buyerReviewed) {
    throw new ApiError(400, "This trade has already been reviewed");
  }

  // 5. Find seller
  const seller = await User.findById(trade.sellerId);
  if (!seller) {
    throw new ApiError(404, "Seller not found");
  }

  // 6. Check if seller can receive review for this trade
  if (!seller.canReviewForTrade(tradeId)) {
    throw new ApiError(
      400,
      "You have already reviewed this seller for this trade"
    );
  }

  // 7. Add review to seller
  await seller.addReview(
    reviewerId,
    req.user.name,
    "buyer",
    tradeId,
    rating,
    comment,
    true // verified trade
  );

  // 8. Mark trade as reviewed
  // trade.isReviewed = true;
  trade.buyerReviewed = true;
  await trade.save();

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        averageRating: seller.averageRating,
        totalReviews: seller.totalReviews,
        review: {
          tradeId,
          rating,
          comment,
          //   reviewedAt: trade.reviewedAt,
        },
      },
      "Review submitted successfully"
    )
  );
});

/**
 * @desc    Get all reviews for a user (seller)
 * @route   GET /api/v1/platform-a/reviews/user/:userId
 * @access  Public
 */
export const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const reviewsData = await user.getPaginatedReviews(
    parseInt(page),
    parseInt(limit)
  );

  return res
    .status(200)
    .json(new ApiResponse(200, reviewsData, "Reviews fetched successfully"));
});

/**
 * @desc    Get review statistics for a user
 * @route   GET /api/v1/platform-a/reviews/user/:userId/stats
 * @access  Public
 */
export const getReviewStats = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const stats = user.getReviewStats();

  return res
    .status(200)
    .json(
      new ApiResponse(200, stats, "Review statistics fetched successfully")
    );
});

/**
 * @desc    Update review (within 24 hours)
 * @route   PATCH /api/v1/platform-a/reviews/trade/:tradeId
 * @access  Private (Buyer only)
 */
export const updateReview = asyncHandler(async (req, res) => {
  const { tradeId } = req.params;
  const { rating, comment } = req.body;
  const reviewerId = req.user._id;
  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  if (comment && comment.length > 1000) {
    throw new ApiError(400, "Comment is too long");
  }

  // 1. Find trade
  const trade = await Trade.findById(tradeId);
  if (!trade) {
    throw new ApiError(404, "Trade not found");
  }

  // 2. Verify reviewer is buyer
  if (trade.buyerId.toString() !== reviewerId.toString()) {
    throw new ApiError(403, "Only buyer can update the review");
  }

  // 3. Find seller and review
  const seller = await User.findById(trade.sellerId);
  if (!seller) {
    throw new ApiError(404, "Seller not found");
  }

  const review = seller.getReviewByTradeId(tradeId);
  if (!review) {
    throw new ApiError(404, "Review not found for this trade");
  }

  // 4. Check if within 24 hours
  const hoursSinceReview = (Date.now() - review.createdAt) / (1000 * 60 * 60);
  if (hoursSinceReview > 24) {
    throw new ApiError(
      400,
      "Reviews can only be updated within 24 hours of submission"
    );
  }

  // 5. Update review
  await seller.updateReview(tradeId, rating, comment);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        averageRating: seller.averageRating,
        totalReviews: seller.totalReviews,
        review: {
          tradeId,
          rating,
          comment,
          updatedAt: Date.now(),
        },
      },
      "Review updated successfully"
    )
  );
});

/**
 * @desc    Delete review (Admin only)
 * @route   DELETE /api/v1/platform-a/reviews/trade/:tradeId/seller/:sellerId
 * @access  Private (Admin only)
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const { tradeId, sellerId } = req.params;

  // Find seller
  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new ApiError(404, "Seller not found");
  }

  // Check if review exists
  const review = seller.getReviewByTradeId(tradeId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Delete review
  await seller.deleteReview(tradeId);

  // Update trade
  const trade = await Trade.findById(tradeId);
  if (trade) {
    // trade.isReviewed = false;
    trade.buyerReviewed = false;
    await trade.save();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        averageRating: seller.averageRating,
        totalReviews: seller.totalReviews,
      },
      "Review deleted successfully"
    )
  );
});

/**
 * @desc    Add response to a review (Seller only)
 * @route   POST /api/v1/platform-a/reviews/trade/:tradeId/response
 * @access  Private (Seller only)
 */
export const addReviewResponse = asyncHandler(async (req, res) => {
  const { tradeId } = req.params;
  const { response } = req.body;
  const sellerId = req.user._id;

  // 1. Find trade
  const trade = await Trade.findById(tradeId);
  if (!trade) {
    throw new ApiError(404, "Trade not found");
  }

  // 2. Verify user is the seller
  if (trade.sellerId.toString() !== sellerId.toString()) {
    throw new ApiError(403, "Only seller can respond to reviews");
  }

  // 3. Find seller user
  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new ApiError(404, "Seller not found");
  }

  // 4. Check if review exists
  const review = seller.getReviewByTradeId(tradeId);
  if (!review) {
    throw new ApiError(404, "Review not found for this trade");
  }

  // 5. Add response
  await seller.addReviewResponse(tradeId, response);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tradeId,
        response,
        respondedAt: Date.now(),
      },
      "Response added successfully"
    )
  );
});

/**
 * @desc    Check if user can review a trade
 * @route   GET /api/v1/platform-a/reviews/trade/:tradeId/can-review
 * @access  Private
 */
export const canReviewTrade = asyncHandler(async (req, res) => {
  const { tradeId } = req.params;
  const userId = req.user._id;

  // 1. Find trade
  const trade = await Trade.findById(tradeId);
  if (!trade) {
    throw new ApiError(404, "Trade not found");
  }

  // 2. Check if user is buyer
  const isBuyer = trade.buyerId.toString() === userId.toString();
  if (!isBuyer) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          canReview: false,
          reason: "Only buyer can review this trade",
        },
        "Cannot review"
      )
    );
  }

  // 3. Check trade status
  if (trade.status !== TRADE_STATUS.COMPLETED) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          canReview: false,
          reason: "Trade is not completed yet",
        },
        "Cannot review"
      )
    );
  }

  // 4. Check if already reviewed
  // if (trade.isReviewed) {
  //     return res.status(200).json(
  //         new ApiResponse(
  //             200,
  //             {
  //                 canReview: false,
  //                 reason: "Trade has already been reviewed"
  //             },
  //             "Cannot review"
  //         )
  //     );
  // }
  if (trade.buyerReviewed) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          canReview: false,
          reason: "Trade has already been reviewed",
        },
        "Cannot review"
      )
    );
  }
  // 5. Find seller
  const seller = await User.findById(trade.sellerId);
  if (!seller) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { canReview: false, reason: "Seller not found" })
      );
  }

  // 6. Check seller's reviews
  const canReview = seller.canReviewForTrade(tradeId);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        canReview,
        reason: canReview
          ? null
          : "Already reviewed this seller for this trade",
      },
      canReview ? "Can review" : "Cannot review"
    )
  );
});

/**
 * @desc    Get top rated sellers
 * @route   GET /api/v1/platform-a/reviews/top-sellers
 * @access  Public
 */
export const getTopRatedSellers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const topSellers = await User.getTopRatedSellers(parseInt(limit));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sellers: topSellers,
        count: topSellers.length,
      },
      "Top rated sellers fetched successfully"
    )
  );
});

/**
 * @desc    Get my reviews (as a seller)
 * @route   GET /api/v1/platform-a/reviews/my-reviews
 * @access  Private (Seller only)
 */
export const getMyReviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const reviewsData = await user.getPaginatedReviews(
    parseInt(page),
    parseInt(limit)
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, reviewsData, "Your reviews fetched successfully")
    );
});

/**
 * @desc    Get reviews I've given (as a buyer)
 * @route   GET /api/v1/platform-a/reviews/reviews-given
 * @access  Private
 */
export const getReviewsGiven = asyncHandler(async (req, res) => {
  const reviewerId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const pipeline = [
    // 1. Match users having reviews by this reviewer
    {
      $match: {
        "reviews.reviewerId": reviewerId,
      },
    },

    // 2. Unwind reviews
    {
      $unwind: "$reviews",
    },

    // 3. Match only reviews by this reviewer
    {
      $match: {
        "reviews.reviewerId": reviewerId,
      },
    },

    // 4. Project required fields
    {
      $project: {
        _id: 0,
        tradeId: "$reviews.tradeId",
        rating: "$reviews.rating",
        comment: "$reviews.comment",
        role: "$reviews.role",
        verified: "$reviews.verified",
        createdAt: "$reviews.createdAt",
        updatedAt: "$reviews.updatedAt",
        sellerId: "$_id",
        sellerName: "$name",
        sellerAvatar: "$avatar",
      },
    },

    // 5. Sort newest first
    {
      $sort: { createdAt: -1 },
    },

    // 6. Pagination
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limitNum }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await User.aggregate(pipeline);

  const reviews = result[0]?.data || [];
  const total = result[0]?.totalCount[0]?.count || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + limitNum < total,
      },
      "Reviews given by you fetched successfully"
    )
  );
});
