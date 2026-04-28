// src/api/v1/platform-a/profile/routes.js
import { Router } from "express";
import * as profileController from "./controller.js";
import { auth, optionalAuth } from "../../../../middleware/auth.middleware.js";

const router = Router();

/**
 * @route   GET /api/v1/platform-a/profile
 * @desc    Get own profile
 * @access  Private
 */
router.get("/", auth, profileController.getOwnProfile);

/**
 * @route   PUT /api/v1/platform-a/profile
 * @desc    Update profile
 * @access  Private
 */
router.put("/", auth, profileController.updateProfile);

/**
 * @route   GET /api/v1/platform-a/profile/stats
 * @desc    Get profile statistics
 * @access  Private
 */
router.get("/stats", auth, profileController.getProfileStats);

/**
 * @route   POST /api/v1/platform-a/profile/avatar
 * @desc    Upload avatar
 * @access  Private
 */
router.post("/avatar", auth, profileController.uploadAvatar);

/**
 * @route   PUT /api/v1/platform-a/profile/preferences
 * @desc    Update preferences
 * @access  Private
 */
router.put("/preferences", auth, profileController.updatePreferences);

/**
 * @route   GET /api/v1/platform-a/profile/:userId
 * @desc    Get public profile by user ID
 * @access  Public
 */
router.get("/:userId", profileController.getPublicProfile);

export default router;
