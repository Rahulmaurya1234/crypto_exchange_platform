import express from "express";
import {
    submitReview,
    getUserReviews,
    getReviewStats,
    updateReview,
    deleteReview,
    addReviewResponse,
    canReviewTrade,
    getTopRatedSellers,
    getMyReviews,
    getReviewsGiven
} from "./controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";
//import { authorizeRoles } from "../../../../middleware/roleAuth.middleware.js";
// import { validateRequest } from "../../../../middleware/validation.middleware.js";
import {
    reviewValidationSchema,
    reviewResponseValidationSchema,
    reviewUpdateValidationSchema
} from "./validation.js";
import { ROLES } from "../../../../constants/index.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get user reviews (public - anyone can see seller reviews)
router.get("/user/:userId", getUserReviews);

// Get review stats (public)
router.get("/user/:userId/stats", getReviewStats);

// Get top rated sellers (public)
router.get("/top-sellers", getTopRatedSellers);

// ==================== PROTECTED ROUTES ====================

// Check if can review trade
router.get(
    "/trade/:tradeId/can-review",
    auth,
    canReviewTrade
);

// Submit review (Buyer only)
router.post(
    "/trade/:tradeId",
    auth,
    // validateRequest(reviewValidationSchema),
    submitReview
);

// Update review (Buyer only, within 24 hours)
router.patch(
    "/trade/:tradeId",
    auth,
    // validateRequest(reviewUpdateValidationSchema),
    updateReview
);

// Add response to review (Seller only)
router.post(
    "/trade/:tradeId/response",
    auth,
    // authorizeRoles(ROLES.SELLER, ROLES.INSTANT_SELLER),
    // validateRequest(reviewResponseValidationSchema),
    addReviewResponse
);

// Get my reviews (as a seller)
router.get(
    "/my-reviews",
    auth,
    // authorizeRoles(ROLES.SELLER, ROLES.INSTANT_SELLER),
    getMyReviews
);

// Get reviews I've given (as a buyer)
router.get(
    "/reviews-given",
    auth,
    getReviewsGiven
);

// ==================== ADMIN ROUTES ====================

// Delete review (Admin only)
router.delete(
    "/trade/:tradeId/seller/:sellerId",
    auth,
    // authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    deleteReview
);

export default router;