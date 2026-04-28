// src/routes/platform-a/user.routes.js
import { Router } from "express";
import * as userController from "./userController.js";
import { auth } from "../../../../middleware/auth.middleware.js";
import { validate } from "../../../../middleware/validate.middleware.js";
import { updateProfileSchema, addReviewSchema } from "../../../../validators/user.validator.js";

const router = Router();

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get own profile
 * @access  Private
 */
router.get("/profile", auth, userController.getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update own profile
 * @access  Private
 */
router.put(
    "/profile",
    auth,
    validate(updateProfileSchema),
    userController.updateProfile
);

/**
 * @route   DELETE /api/v1/users/profile
 * @desc    Delete own account
 * @access  Private
 */
router.delete("/profile", auth, userController.deleteAccount);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID (public profile)
 * @access  Public
 */
router.get("/:id", userController.getUserById);

/**
 * @route   GET /api/v1/users/:id/reviews
 * @desc    Get user reviews
 * @access  Public
 */
router.get("/:id/reviews", userController.getUserReviews);

/**
 * @route   POST /api/v1/users/:id/reviews
 * @desc    Add review for user
 * @access  Private
 */
router.post(
    "/:id/reviews",
    auth,
    validate(addReviewSchema),
    userController.addReview
);

/**
 * @route   GET /api/v1/users/:id/stats
 * @desc    Get user statistics
 * @access  Public
 */
router.get("/:id/stats", userController.getUserStats);

export default router;
