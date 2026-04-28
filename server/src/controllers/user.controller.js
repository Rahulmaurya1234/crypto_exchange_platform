import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

// ---- ENV / CONFIG ----
const {
    JWT_SECRET,
    REFRESH_JWT_SECRET,
    REFRESH_COOKIE_NAME = "refresh_token",
    REFRESH_COOKIE_SECURE = "false", // "true" in production with HTTPS
    REFRESH_COOKIE_SAME_SITE = "lax", // "lax" | "strict" | "none"
    REFRESH_TOKEN_EXPIRES_IN = "30d",
} = process.env;

if (!JWT_SECRET || !REFRESH_JWT_SECRET) {
    throw new Error("JWT_SECRET or REFRESH_JWT_SECRET missing in .env");
}

// -----------------------------
// Helpers
// -----------------------------
const parseDurationToMs = (value) => {
    if (!value) return undefined;

    if (typeof value === "number") {
        return value;
    }

    const match = /^(\d+)([smhd])?$/.exec(value.trim());
    if (!match) return undefined;

    const amount = parseInt(match[1], 10);
    const unit = match[2] || "d";

    switch (unit) {
        case "s":
            return amount * 1000;
        case "m":
            return amount * 60 * 1000;
        case "h":
            return amount * 60 * 60 * 1000;
        case "d":
        default:
            return amount * 24 * 60 * 60 * 1000;
    }
};

const buildRefreshCookieOptions = () => ({
    httpOnly: true,
    secure: REFRESH_COOKIE_SECURE === "true",
    sameSite: REFRESH_COOKIE_SAME_SITE,
    maxAge: parseDurationToMs(REFRESH_TOKEN_EXPIRES_IN),
    path: "/", // important so clearCookie works globally
});

// -----------------------------
// POST /api/auth/register
// -----------------------------
export const registerUser = asyncHandler(async (req, res) => {
    const {
        name,
        email,
        password,
        address,
        state,
        city,
        pincode,
        mobileNumber,
        altMobileNumber,
        gender,
    } = req.body;

    // Basic required field check
    if (
        !name ||
        !email ||
        !password ||
        !address ||
        !state ||
        !city ||
        !pincode ||
        !mobileNumber ||
        !gender
    ) {
        throw new ApiError(400, "Missing required fields");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Create user
    const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        address,
        state,
        city,
        pincode,
        mobileNumber,
        altMobileNumber,
        gender,
        // role, kycStatus, accountStatus use model defaults
    });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Set refresh token cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, buildRefreshCookieOptions());

    const safeUser = user.toJSON();

    const response = new ApiResponse(
        201,
        {
            user: safeUser,
            accessToken,
            // refresh token only in cookie
        },
        "User registered successfully"
    );

    return res.status(201).json(response);
});

// -----------------------------
// POST /api/user/login
// -----------------------------
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const normalizedEmail = (email || "").toLowerCase().trim();

    // Need password, override select:false
    const user = await User.findActiveByEmail(normalizedEmail).select("+password");

    // Generic error, don't leak which field is wrong
    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid email or password");
    }

    // 🚫 Suspend logic here
    if (user.accountStatus === "suspended") {
        throw new ApiError(403, "Account suspended. Contact support.");
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Set refresh token cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, buildRefreshCookieOptions());

    const safeUser = user.toJSON();

    const response = new ApiResponse(
        200,
        {
            user: safeUser,
            accessToken,
            // refresh token only in cookie
        },
        "Login successful"
    );

    return res.status(200).json(response);
});

// -----------------------------
// POST /api/auth/refresh
// -----------------------------
export const refreshAccessToken = asyncHandler(async (req, res) => {
    // Requires app.use(cookieParser()) in app.js
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
        throw new ApiError(401, "Refresh token missing");
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, REFRESH_JWT_SECRET);
    } catch (err) {
        // Clear invalid/expired cookie
        res.clearCookie(REFRESH_COOKIE_NAME, {
            ...buildRefreshCookieOptions(),
            maxAge: 0,
        });
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    if (!decoded?.sub || decoded.tokenType !== "refresh") {
        res.clearCookie(REFRESH_COOKIE_NAME, {
            ...buildRefreshCookieOptions(),
            maxAge: 0,
        });
        throw new ApiError(401, "Invalid refresh token payload");
    }

    // Make sure user still exists and is active
    const user = await User.findById(decoded.sub);
    if (!user) {
        res.clearCookie(REFRESH_COOKIE_NAME, {
            ...buildRefreshCookieOptions(),
            maxAge: 0,
        });
        throw new ApiError(401, "User not found");
    }

    if (!user.isActive()) {
        res.clearCookie(REFRESH_COOKIE_NAME, {
            ...buildRefreshCookieOptions(),
            maxAge: 0,
        });
        throw new ApiError(403, "Account is not active");
    }

    // New access token
    const accessToken = user.generateAccessToken();

    // Optional but recommended: rotate refresh token
    const newRefreshToken = user.generateRefreshToken();
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, buildRefreshCookieOptions());

    const response = new ApiResponse(
        200,
        { accessToken },
        "Access token refreshed"
    );

    return res.status(200).json(response);
});

// -----------------------------
// POST /api/auth/logout
// -----------------------------
export const logoutUser = asyncHandler(async (req, res) => {
    // If you want blacklist, you'd read the cookie BEFORE clearing it
    // and insert that token into a blacklist collection here.

    res.clearCookie(REFRESH_COOKIE_NAME, {
        ...buildRefreshCookieOptions(),
        maxAge: 0,
    });

    const response = new ApiResponse(200, {}, "Logged out successfully");
    return res.status(200).json(response);
});

// -----------------------------
// GET /api/auth/me  (Protected)
// -----------------------------
export const getMe = asyncHandler(async (req, res) => {
    // From auth.middleware.js → req.user
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    const response = new ApiResponse(200, { user: req.user }, "User fetched");
    return res.status(200).json(response);
});

// -----------------------------
// GET /api/user/profile  (Protected)
// -----------------------------
export const getProfile = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    // req.user is already the user document from auth middleware
    const response = new ApiResponse(200, { profile: req.user }, "Profile fetched successfully");
    return res.status(200).json(response);
});

// -----------------------------
// POST /api/user/profile  (Protected) - Create/Update Profile
// -----------------------------
export const createProfile = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    const {
        name,
        address,
        city,
        state,
        pincode,
        mobile_number,
        alt_mobile_number,
        gender,
    } = req.body;

    // Validate required fields
    if (!name) {
        throw new ApiError(400, "Name is required");
    }

    // Update user with new profile information
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Update fields
    user.name = name;
    if (address) user.address = address;
    if (city) user.city = city;
    if (state) user.state = state;
    if (pincode) user.pincode = pincode;
    if (mobile_number) user.mobileNumber = mobile_number;
    if (alt_mobile_number) user.altMobileNumber = alt_mobile_number;
    if (gender) user.gender = gender;

    await user.save();

    const response = new ApiResponse(200, { profile: user.toJSON() }, "Profile created successfully");
    return res.status(200).json(response);
});

// -----------------------------
// PATCH /api/user/profile  (Protected) - Update Profile
// -----------------------------
export const updateProfile = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    const {
        address,
        city,
        state,
        pincode,
        alt_mobile_number,
    } = req.body;

    // Get user
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Update only allowed fields
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (pincode !== undefined) user.pincode = pincode;
    if (alt_mobile_number !== undefined) user.altMobileNumber = alt_mobile_number;

    await user.save();

    const response = new ApiResponse(200, { profile: user.toJSON() }, "Profile updated successfully");
    return res.status(200).json(response);
});

/**
 * @route   GET /auth/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Admin only
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
    const { ACCOUNT_STATUSES } = await import("../models/User.model.js");
    const { KYC_STATUSES } = await import("../models/User.model.js");

    // Import Ad model if it exists
    let Ad;
    try {
        const adModule = await import("../models/Ad.model.js");
        Ad = adModule.default;
    } catch (err) {
        // Ad model doesn't exist yet
        Ad = null;
    }

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ accountStatus: ACCOUNT_STATUSES.ACTIVE });
    const suspendedUsers = await User.countDocuments({ accountStatus: ACCOUNT_STATUSES.SUSPENDED });

    // KYC statistics
    const kycPending = await User.countDocuments({ kycStatus: KYC_STATUSES.SUBMITTED });
    const kycApproved = await User.countDocuments({ kycStatus: KYC_STATUSES.APPROVED });
    const kycRejected = await User.countDocuments({ kycStatus: KYC_STATUSES.REJECTED });

    // Ads statistics
    let totalAds = 0;
    let activeAds = 0;
    let pausedAds = 0;

    if (Ad) {
        totalAds = await Ad.countDocuments();
        activeAds = await Ad.countDocuments({ status: "active" });
        pausedAds = await Ad.countDocuments({ status: "paused" });
    }

    // Recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUsers = await User.find({ createdAt: { $gte: oneDayAgo } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email createdAt");

    const recentKyc = await User.find({
        kycSubmittedAt: { $gte: oneDayAgo },
        kycStatus: KYC_STATUSES.SUBMITTED
    })
        .sort({ kycSubmittedAt: -1 })
        .limit(5)
        .select("name email kycSubmittedAt");

    // Build activity feed
    const recentActivity = [
        ...recentUsers.map(u => ({
            id: u._id.toString(),
            type: "user",
            action: "New User Registration",
            description: `${u.name} (${u.email}) registered`,
            timestamp: u.createdAt
        })),
        ...recentKyc.map(u => ({
            id: u._id.toString(),
            type: "kyc",
            action: "KYC Submission",
            description: `${u.name} submitted KYC documents`,
            timestamp: u.kycSubmittedAt
        }))
    ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

    const stats = {
        totalUsers,
        activeUsers,
        suspendedUsers,
        kycPending,
        kycApproved,
        kycRejected,
        totalAds,
        activeAds,
        pausedAds,
        recentActivity
    };

    const response = new ApiResponse(200, stats, "Dashboard stats fetched successfully");
    return res.status(200).json(response);
});

// -----------------------------
// GET /api/auth/admin/users
// -----------------------------
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find()
        .select("-password -refreshToken")
        .sort({ createdAt: -1 });

    const response = new ApiResponse(200, { users }, "Users fetched successfully");
    return res.status(200).json(response);
});

// -----------------------------
// PATCH /api/auth/admin/users/:id/status
// -----------------------------
export const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { ACCOUNT_STATUSES } = await import("../models/User.model.js");

    if (!Object.values(ACCOUNT_STATUSES).includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const user = await User.findById(id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Prevent admin from suspending themselves
    if (user._id.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot change your own status");
    }

    user.accountStatus = status;
    await user.save();

    // Log action
    const { createLog } = await import("./log.controller.js");
    await createLog({
        adminId: req.user._id,
        targetType: "user",
        targetId: user._id,
        action: `Updated User Status to ${status}`,
        reason: "Admin action",
    });

    const response = new ApiResponse(200, { user: user.toJSON() }, `User status updated to ${status}`);
    return res.status(200).json(response);
});

