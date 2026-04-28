// src/api/v1/platform-b/auth/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import {
    BadRequestError,
    UnauthorizedError,
    ConflictError,
    NotFoundError,
} from "../../../../utils/ApiError.js";
import * as authService from "../../../../services/auth.service.js";
import User from "../../../../models/User.model.js";
import { ACCOUNT_STATUS, ROLES, PERMISSIONS } from "../../../../constants/index.js";
import { logger } from "../../../../utils/logger.js";

/**
 * Register new admin/support user
 * @route POST /api/v1/platform-b/auth/register
 * @access Public (but creates admin users)
 */
export const register = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const lang = req.language || "en";

    // Validate required fields
    if (!email || !password) {
        throw BadRequestError("Email and password are required", {}, lang);
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({
        email: email.toLowerCase(),
        isDeleted: false
    });

    if (existingUser) {
        throw ConflictError("User with this email already exists", {}, lang);
    }

    // Check if any SUPER_ADMIN exists in the system
    const superAdminExists = await User.findOne({
        role: ROLES.SUPER_ADMIN,
        isDeleted: false
    });

    let newUser;
    let responseMessage;

    if (!superAdminExists) {
        // No SUPER_ADMIN exists - Create first SUPER_ADMIN with full access
        const allPermissions = Object.keys(PERMISSIONS);

        newUser = await User.create({
            email: email.toLowerCase(),
            password,
            role: ROLES.SUPER_ADMIN,
            accountStatus: ACCOUNT_STATUS.ACTIVE,
            emailVerified: true,
            phoneVerified: true,
            badges: [
                {
                    type: "verified_email",
                    earnedAt: new Date()
                },
                {
                    type: "verified_phone",
                    earnedAt: new Date()
                }
            ],
            permissions: allPermissions
        });

        responseMessage = "Super Admin account created successfully. Now you can login.";

        logger.info("Super Admin created", {
            userId: newUser._id,
            email: newUser.email
        });
    } else {
        // SUPER_ADMIN exists - Create SUPPORT user without permissions
        newUser = await User.create({
            email: email.toLowerCase(),
            password,
            role: ROLES.SUPPORT,
            accountStatus: ACCOUNT_STATUS.ACTIVE,
            emailVerified: false,
            phoneVerified: false,
            permissions: []
        });

        responseMessage = "Support account created successfully. Admin will approve you and give the permissions.";

        logger.info("Support user created", {
            userId: newUser._id,
            email: newUser.email
        });
    }

    res.status(201).json(
        new ApiResponse(
            201,
            {
                email: newUser.email,
                role: newUser.role,
                emailVerified: newUser.emailVerified,
                phoneVerified: newUser.phoneVerified,
            },
            responseMessage
        )
    );
});

/**
 * Login admin/support user
 * @route POST /api/v1/platform-b/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const lang = req.language || "en";

    // Validate required fields
    if (!email || !password) {
        throw BadRequestError("Email and password are required", {}, lang);
    }

    // Find user with password field
    const user = await User.findOne({
        email: email.toLowerCase(),
        isDeleted: false
    }).select("+password");

    if (!user) {
        throw UnauthorizedError("Invalid email or password", {}, lang);
    }

    // Check if user is admin or support (Platform B roles only)
    const platformBRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPPORT_MANAGER, ROLES.SUPPORT];
    if (!platformBRoles.includes(user.role)) {
        throw UnauthorizedError("Access denied. This endpoint is for admin users only.", {}, lang);
    }
    const allowRole = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
    // For SUPER_ADMIN, skip email verification check
    if (user.role !== ROLES.allowRole) {
        // For SUPPORT and other roles, check if approved by admin
        if (!user.emailVerified) {
            throw UnauthorizedError(
                "Your account is pending approval. Please wait for admin to approve your account.",
                {},
                lang
            );
        }
    }

    // Check account status
    if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
        throw UnauthorizedError(
            "Your account has been suspended. Please contact the super admin.",
            {
                suspendedAt: user.suspendedAt,
                suspensionReason: user.suspensionReason
            },
            lang
        );
    }

    if (user.accountStatus === ACCOUNT_STATUS.BANNED) {
        throw UnauthorizedError(
            "Your account has been banned. Please contact the super admin.",
            {
                bannedAt: user.bannedAt,
                banReason: user.banReason
            },
            lang
        );
    }

    if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
        throw UnauthorizedError(
            `Your account is ${user.accountStatus}. Please contact the super admin.`,
            {},
            lang
        );
    }

    // Check if account is deleted
    if (user.isDeleted) {
        throw UnauthorizedError("Account not found or has been deleted.", {}, lang);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw UnauthorizedError("Invalid email or password", {}, lang);
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Store refresh token in Redis
    await authService.storeRefreshToken(user._id, refreshToken);

    // Update last login info
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip || req.connection.remoteAddress;
    await user.save({ validateBeforeSave: false });

    // Set tokens in cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
        path: '/',

    };

    res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info("Admin/Support logged in successfully", {
        userId: user._id,
        email: user.email,
        role: user.role
    });

    res.json(
        new ApiResponse(
            200,
            {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    emailVerified: user.emailVerified,
                    phoneVerified: user.phoneVerified,
                    accountStatus: user.accountStatus,
                    permissions: user.permissions || [],
                    badges: user.badges,
                    lastLoginAt: user.lastLoginAt,
                },
                accessToken,
                refreshToken,
            },
            "Login successful"
        )
    );
});

/**
 * Logout admin/support user
 * @route POST /api/v1/platform-b/auth/logout
 * @access Private
 */
export const logout = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Remove refresh token from Redis
    await authService.removeRefreshToken(userId);

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    logger.info("Admin/Support logged out", { userId });

    res.json(new ApiResponse(200, {}, "Logged out successfully"));
});

/**
 * Refresh access token
 * @route POST /api/v1/platform-b/auth/refresh
 * @access Public
 */
export const refreshToken = asyncHandler(async (req, res) => {

    const token = req.cookies.refreshToken;
    const lang = req.language || "en";

    if (!token) {
        throw BadRequestError("Refresh token is required", {}, lang);
    }

    // Verify and decode refresh token
    const decoded = await authService.verifyRefreshToken(token);
    if (!decoded) {
        throw UnauthorizedError("Invalid or expired refresh token", {}, lang);
    }

    // Check if token exists in Redis
    const storedToken = await authService.getStoredRefreshToken(decoded.sub);
    if (storedToken !== token) {
        throw UnauthorizedError("Invalid refresh token", {}, lang);
    }

    // Find user
    const user = await authService.findUserById(decoded.sub);
    if (!user) {
        throw NotFoundError("User not found", {}, lang);
    }

    // Verify user is admin/support
    const platformBRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPPORT_MANAGER, ROLES.SUPPORT];
    if (!platformBRoles.includes(user.role)) {
        throw UnauthorizedError("Access denied", {}, lang);
    }

    // Generate new tokens
    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // Replace old refresh token with new one
    await authService.storeRefreshToken(user._id, newRefreshToken);

    logger.info("Admin/Support token refreshed", { userId: user._id });
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
        path: '/',

    };

    res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.json(
        new ApiResponse(
            200,
            {
                accessToken,
                refreshToken: newRefreshToken,
            },
            "Token refreshed successfully"
        )
    );
});
