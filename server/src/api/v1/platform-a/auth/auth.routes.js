// src/routes/platform-a/auth.routes.js
import { Router } from "express";
import * as authController from "./controller.js";
import { validate } from "../../../../middleware/validate.middleware.js";
import { auth } from "../../../../middleware/auth.middleware.js";
import { globalRateLimit,
    authRateLimit,
    otpRateLimit,
    kycRateLimit,
    listingRateLimit,
    tradeRateLimit,
    chatRateLimit,
    paymentRateLimit,
    adminRateLimit,
    customRateLimit, } from "../../../../middleware/rate-limit.middleware.js";
import {
    registerSchema,
    loginSchema,
    verifyOtpSchema,
    refreshTokenSchema,
    resetPasswordSchema,
    forgotPasswordSchema,
    resendOtpSchema,
    changePasswordSchema,
} from "../../../../validators/auth.validator.js";

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
    "/register",

    authController.register
);
/** * @route   POST /api/v1/auth/send-registration-otp
 * @desc    Send OTP for registration
 * @access  Public
 */
router.post(
    "/send-registration-otp",
    authController.sendRegistrationOTP
)

router.post("/login/send-otp", authController.sendLoginOtpWithPassword);
router.post("/login/verify-otp", authController.verifyLoginOtpAndLogin);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP and activate account
 * @access  Public
 */
// router.post(
//     "/verify-otp",
//     otpRateLimit,
//     validate(verifyOtpSchema),
//     authController.verifyOTP
// );

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
// router.post(
//     "/login",
//     authRateLimit,
//     validate(loginSchema),
//     authController.login
// );

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
    "/refresh",
    authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
    "/logout",
    auth,
    authController.logout
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
    "/forgot-password",
    authRateLimit,
    validate(forgotPasswordSchema),
    authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post(
    "/reset-password",
    authRateLimit,
    validate(resetPasswordSchema),
    authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/resend-otp
 * @desc    Resend OTP
 * @access  Public
 */
router.post(
    "/resend-otp",
    otpRateLimit,
    validate(resendOtpSchema),
    authController.resendOTP
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (logged in user)
 * @access  Private
 */
router.post(
    "/change-password",
    auth,
    validate(changePasswordSchema),
    authController.changePassword
);

export default router;
