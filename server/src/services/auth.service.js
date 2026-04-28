// src/services/auth.service.js
import User from "../models/User.model.js";
import Otp from "../models/Otp.model.js";
import { BadRequestError, UnauthorizedError, ConflictError } from "../utils/ApiError.js";
import { ROLES, ACCOUNT_STATUS } from "../constants/index.js";
import { getRedisClient } from "../config/redis.config.js";
import { logger } from "../utils/logger.js";
import { sendOTPEmail, sendWelcomeEmail } from "./email.service.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";

/**
 * Register new user
 */
// export const registerUser = async (userData, lang = "en") => {
//     const { email, password } = userData;

//     // Check if user already exists
//     const existingUser = await User.findOne({ email: email.toLowerCase() });
//     if (existingUser) {
//         throw new ConflictError("User with this email already exists", {}, lang);
//     }

//     // Create user with default settings
//     // Note: User account is created but emailVerified is false
//     const user = await User.create({
//         email: email.toLowerCase(),
//         password, // Will be hashed by pre-save hook
//         role: ROLES.BUYER,
//         accountStatus: ACCOUNT_STATUS.ACTIVE,
//         emailVerified: false,
//     });

//     // Generate and send OTP
//     await createAndSendOTP(email, "email_verification");

//     return user;
// };

/**
 * Login user
 */
export const loginUser = async (email, password, lang = "en") => {
    // Find user with password field
    const user = await User.findActiveByEmail(email).select("+password");

    if (!user) {
        throw new UnauthorizedError("AUTH_001", {}, lang);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new UnauthorizedError("AUTH_001", {}, lang);
    }

    // Check account status
    if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
        throw new UnauthorizedError("AUTH_006", {}, lang);
    }

    if (user.accountStatus === ACCOUNT_STATUS.BANNED) {
        throw new UnauthorizedError("AUTH_007", {}, lang);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    return {
        user: user.toJSON(),
        accessToken,
        refreshToken,
    };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (userId, lang = "en") => {
    const user = await User.findById(userId);

    if (!user || !user.isActive()) {
        throw new UnauthorizedError("AUTH_005", {}, lang);
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    return { accessToken, refreshToken };
};

/**
 * Create and send OTP
 */
export const createAndSendOTP = async (email, otpType = "email_verification") => {
    try {
        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Delete any existing OTP for this email and type
        await Otp.deleteMany({ email: email.toLowerCase(), otpType });

        // Create new OTP in database
        await Otp.create({
            email: email.toLowerCase(),
            otp,
            otpType,
            expireAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        });

        // Send OTP via email
        await sendOTPEmail(email, otp, otpType);

        logger.info("OTP created and sent", { email, otpType });
        return true;
    } catch (error) {
        logger.error("Error creating OTP", { error: error.message, email });
        throw error;
    }
};

/**
 * Verify OTP
 */
export const verifyOTPByEmail = async (email, otp, otpType = "email_verification") => {
    try {
        // Find OTP in database
        const otpRecord = await Otp.findOne({
            email: email.toLowerCase(),
            otp,
            otpType,
        });

        // Check if OTP exists
        if (!otpRecord) {
            return { valid: false, message: "Invalid OTP" };
        }

        // Check if OTP is expired (MongoDB TTL might not have deleted it yet)
        if (new Date() > otpRecord.expireAt) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return { valid: false, message: "OTP has expired" };
        }

        // OTP is valid - delete it
        await Otp.deleteOne({ _id: otpRecord._id });

        logger.info("OTP verified successfully", { email, otpType });
        return { valid: true, message: "OTP verified successfully" };
    } catch (error) {
        logger.error("Error verifying OTP", { error: error.message, email });
        return { valid: false, message: "Error verifying OTP" };
    }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email, lang = "en") => {
    const user = await User.findActiveByEmail(email);

    if (!user) {
        // Don't reveal if user exists
        return { message: "If the email exists, a reset link has been sent" };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // In production: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken);

    return { resetToken, message: "Password reset link sent" };
};

/**
 * Reset password
 */
export const resetPassword = async (token, newPassword, lang = "en") => {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        throw new BadRequestError("AUTH_002", {}, lang); // Token expired or invalid
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: "Password reset successful" };
};

/**
 * Find user by email
 */
export const findUserByEmail = async (email) => {
    return await User.findOne({ email: email.toLowerCase() }).select("+password");
};

/**
 * Find user by mobile number
 */
export const findUserByMobile = async (mobileNumber) => {
    return await User.findOne({ mobileNumber }).select("+password");
};

/**
 * Find user by ID
 */
export const findUserById = async (userId) => {
    return await User.findById(userId).select("+password");
};

/**
 * Create new user
 */
export const createUser = async (userData) => {
    const user = await User.create({
        ...userData,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
        isVerified: false,
    });
    return user;
};

/**
 * Send OTP via SMS
 */
export const sendOTP = async (mobileNumber, lang = "en") => {
    try {
        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Hash OTP before storing
        const hashedOTP = await bcrypt.hash(otp, 10);

        // Store in Redis with 5-minute expiry
        const key = `otp:${mobileNumber}`;
        await getRedisClient().setEx(key, 300, hashedOTP);

        // Send SMS via Twilio (if configured)
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            try {
                // Import Twilio dynamically
                const twilio = await import("twilio");
                const client = twilio.default(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );

                await client.messages.create({
                    body: `Your Cryptians verification code is: ${otp}. Valid for 5 minutes.`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: `+91${mobileNumber}`,
                });

                logger.info("OTP sent via SMS", { mobileNumber });
            } catch (twilioError) {
                logger.error("Twilio SMS failed", { error: twilioError.message });
                // In development, log OTP to console
                if (process.env.NODE_ENV === "development") {
                    console.log(`\n🔐 OTP for ${mobileNumber}: ${otp}\n`);
                }
            }
        } else {
            // Development mode - log OTP to console
            if (process.env.NODE_ENV === "development") {
                console.log(`\n🔐 OTP for ${mobileNumber}: ${otp}\n`);
            }
        }

        return true;
    } catch (error) {
        logger.error("Error sending OTP", { error: error.message });
        throw error;
    }
};

/**
 * Verify OTP with enhanced security
 */
export const verifyOTP = async (userId, otp) => {
    try {
        // Get user to find mobile number
        const user = await User.findById(userId);
        if (!user) {
            return false;
        }

        const key = `otp:${user.mobileNumber}`;
        const hashedOTP = await getRedisClient().get(key);

        if (!hashedOTP) {
            return false;
        }

        // Compare OTP
        const isValid = await bcrypt.compare(otp, hashedOTP);

        if (isValid) {
            // Delete OTP after successful verification
            await getRedisClient().del(key);
            return true;
        }

        return false;
    } catch (error) {
        logger.error("Error verifying OTP", { error: error.message });
        return false;
    }
};

/**
 * Mark user as verified
 */
export const markUserAsVerified = async (userId) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { isVerified: true },
        { new: true }
    );
    return user;
};

/**
 * Generate JWT tokens
 */
export const generateTokens = async (user) => {
    const accessToken = jwt.sign(
        {
            userId: user._id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m" }
    );

    const refreshToken = jwt.sign(
        {
            userId: user._id,
        },
        process.env.REFRESH_JWT_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
    );

    return { accessToken, refreshToken };
};

/**
 * Store refresh token in Redis
 */
export const storeRefreshToken = async (userId, refreshToken) => {
    const key = `refresh:${userId}`;
    // Store for 7 days (same as refresh token expiration)
    await getRedisClient().setEx(key, 7 * 24 * 60 * 60, refreshToken);
};

/**
 * Get stored refresh token from Redis
 */
export const getStoredRefreshToken = async (userId) => {
    const key = `refresh:${userId}`;
    return await getRedisClient().get(key);
};

/**
 * Remove refresh token from Redis
 */
export const removeRefreshToken = async (userId) => {
    const key = `refresh:${userId}`;
    await getRedisClient().del(key);
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_JWT_SECRET);
        return decoded;
    } catch (error) {
        logger.error("Invalid refresh token", { error: error.message });
        return null;
    }
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (userId) => {
    await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
};

/**
 * Update user password
 */
export const updatePassword = async (userId, newPassword) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new BadRequestError("User not found");
    }

    user.password = newPassword;
    await user.save();

    logger.info("Password updated", { userId });
};

export default {
    // registerUser,
    loginUser,
    refreshAccessToken,
    createAndSendOTP,
    verifyOTPByEmail,
    verifyOTP,
    requestPasswordReset,
    resetPassword,
    findUserByEmail,
    findUserByMobile,
    findUserById,
    createUser,
    sendOTP,
    markUserAsVerified,
    generateTokens,
    storeRefreshToken,
    getStoredRefreshToken,
    removeRefreshToken,
    verifyRefreshToken,
    updateLastLogin,
    updatePassword,
};
