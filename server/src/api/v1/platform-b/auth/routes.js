// src/api/v1/platform-b/auth/routes.js
import { Router } from "express";
import * as authController from "./controller.js";
import { validate } from "../../../../middleware/validate.middleware.js";
import { auth } from "../../../../middleware/auth.middleware.js";
import { adminRateLimit, authRateLimit } from "../../../../middleware/rate-limit.middleware.js";
import {
    adminRegisterSchema,
    adminLoginSchema,
    adminRefreshTokenSchema,
} from "../../../../validators/admin-auth.validator.js";

const router = Router();

/**
 * @route   POST /api/v1/platform-b/auth/register
 * @desc    Register new admin/support user
 * @access  Public (but creates admin users)
 */
router.post(
    "/register",
    authRateLimit,
    validate(adminRegisterSchema),
    authController.register
);

/**
 * @route   POST /api/v1/platform-b/auth/login
 * @desc    Login admin/support user
 * @access  Public
 */
router.post(
    "/login",
    authRateLimit,
    validate(adminLoginSchema),
    authController.login
);

/**
 * @route   POST /api/v1/platform-b/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
    "/refresh",
    authController.refreshToken
);

/**
 * @route   POST /api/v1/platform-b/auth/logout
 * @desc    Logout admin/support user
 * @access  Private
 */
router.post(
    "/logout",
    auth,
    authController.logout
);

export default router;
