// src/controllers/auth.controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from "../../../../utils/ApiError.js";
import * as authService from "../../../../services/auth.service.js";
import * as adminNotificationService from "../../../../services/adminNotification.service.js";
import User from "../../../../models/User.model.js";
import {
  ACCOUNT_STATUS,
  ROLES,
  ROLE_GROUPS,
} from "../../../../constants/index.js";
import { logger } from "../../../../utils/logger.js";
import { sendWelcomeEmail } from "../../../../services/email.service.js";
import { sendOTPEmail } from "../../../../config/sendgrid.config.js";
import OTP from "../../../../models/Otp.model.js";
import { sendSMS } from "../../../../config/twilio.config.js";
import { InternalServerError } from "../../../../utils/ApiError.js";

// D:\new office\CryptiansApplication\server\src\api\v1\platform-a\auth\controller.js

/**
 * Step 1: Send OTP to Email and Phone
 * User enters email and phone, then clicks "Send Code"
 */
export const sendRegistrationOTP = asyncHandler(async (req, res) => {
  const { email, phone } = req.body;
  const lang = req.language || "en";

  // Validate required fields
  if (!email || !phone) {
    throw BadRequestError("Email and phone number are required", {}, lang);
  }

  // Validate email format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    throw BadRequestError("Please provide a valid email address", {}, lang);
  }

  // Validate phone format (E.164 format)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) {
    throw BadRequestError(
      "Please provide a valid phone number with country code (e.g., +919876543210)",
      {},
      lang
    );
  }

  // Check if user already exists with verified email or phone
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase(), emailVerified: true },
      { mobileNumber: phone, phoneVerified: true },
    ],
    isDeleted: false,
  });

  if (existingUser) {
    if (
      existingUser.email === email.toLowerCase() &&
      existingUser.emailVerified
    ) {
      throw ConflictError(
        "This email is already registered and verified",
        {},
        lang
      );
    }
    if (existingUser.mobileNumber === phone && existingUser.phoneVerified) {
      throw ConflictError(
        "This phone number is already registered and verified",
        {},
        lang
      );
    }
  }

  // Check for unverified user and clean up if exists
  const unverifiedUser = await User.findOne({
    $or: [
      { email: email.toLowerCase(), emailVerified: false },
      { mobileNumber: phone, phoneVerified: false },
    ],
    isDeleted: false,
  });

  if (unverifiedUser) {
    await User.findByIdAndDelete(unverifiedUser._id);
    logger.info("Deleted unverified user for re-registration", {
      oldUserId: unverifiedUser._id,
      email,
      phone,
    });
  }

  // Delete any existing OTPs for this email/phone
  await OTP.deleteMany({
    $or: [{ identifier: email.toLowerCase() }, { identifier: phone }],
  });

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create OTP records for both email and phone
  await OTP.create({
    identifier: email.toLowerCase(),
    otp: otpCode,
    type: "email_verification",
    expiresAt: otpExpiry,
  });

  await OTP.create({
    identifier: phone,
    otp: otpCode,
    type: "phone_verification",
    expiresAt: otpExpiry,
  });

  // Send OTP via Email (using SendGrid)
  try {
    await sendOTPEmail(email, otpCode, 10);
    logger.info("OTP sent to email", { email });
  } catch (error) {
    logger.error("Failed to send email OTP", { email, error: error.message });
    throw InternalServerError("Failed to send OTP to email", {}, lang);
  }
  console.log("OTP sent to email successfully");
  console.log("Sending OTP to phone:", phone, "OTP:", otpCode);
  // Send OTP via SMS (using Twilio)
  try {
    await sendSMS(
      phone,
      `Your Cryptians verification code is: ${otpCode}. Valid for 10 minutes.`
    );
    logger.info("OTP sent to phone", { phone });
  } catch (error) {
    logger.error("Failed to send SMS OTP", { phone, error: error.message });
    throw InternalServerError("Failed to send OTP to phone", {}, lang);
  }
  console.log("OTP sent to phone successfully");
  logger.info("Registration OTP sent successfully", { email, phone });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        email: email.toLowerCase(),
        phone,
        message: "OTP sent to your email and phone number",
      },
      "OTP sent successfully. Please verify to continue registration."
    )
  );
});

/**
 * Step 2: Verify OTP and Complete Registration
 * User enters OTP (same for both email and phone) and password, then clicks "Register"
 */
export const register = asyncHandler(async (req, res) => {
  const { email, phone, otp, password } = req.body;
  const lang = req.language || "en";

  // Validate required fields
  if (!email || !phone || !otp || !password) {
    throw BadRequestError(
      "Email, phone, OTP, and password are required",
      {},
      lang
    );
  }

  // Validate password length
  if (password.length < 6) {
    throw BadRequestError(
      "Password must be at least 6 characters long",
      {},
      lang
    );
  }

  // Verify OTP for email
  const emailOTP = await OTP.findOne({
    identifier: email.toLowerCase(),
    otp: otp,
    type: "email_verification",
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!emailOTP) {
    throw BadRequestError("Invalid or expired OTP for email", {}, lang);
  }

  // Verify OTP for phone
  const phoneOTP = await OTP.findOne({
    identifier: phone,
    otp: otp,
    type: "phone_verification",
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!phoneOTP) {
    throw BadRequestError("Invalid or expired OTP for phone", {}, lang);
  }

  // Check again if user exists (edge case)
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase(), emailVerified: true },
      { mobileNumber: phone, phoneVerified: true },
    ],
    isDeleted: false,
  });

  if (existingUser) {
    throw ConflictError(
      "User with this email or phone already exists",
      {},
      lang
    );
  }

  // Create user with verified email and phone
  const userData = {
    email: email.toLowerCase(),
    mobileNumber: phone,
    password,
    role: ROLES.BUYER,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    emailVerified: true, // ✅ Already verified via OTP
    phoneVerified: true, // ✅ Already verified via OTP
    badges: [
      { type: "verified_email", earnedAt: new Date() },
      { type: "verified_phone", earnedAt: new Date() },
    ],
  };

  const user = await User.create(userData);

  // Mark OTPs as used
  await OTP.updateMany(
    {
      $or: [
        { identifier: email.toLowerCase(), otp: otp },
        { identifier: phone, otp: otp },
      ],
    },
    { isUsed: true }
  );

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Set cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  logger.info("User registered successfully", {
    userId: user._id,
    email,
    phone,
  });

  // Notify admins about new user registration
  try {
    await adminNotificationService.notifyUserRegistered({
      _id: user._id,
      name: user.name || email,
      email: user.email,
      mobileNumber: user.mobileNumber,
    });
  } catch (notificationError) {
    // Don't fail registration if notification fails
    logger.error("Failed to send admin notification for new user", {
      userId: user._id,
      error: notificationError.message,
    });
  }

  res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: user._id,
          email: user.email,
          mobileNumber: user.mobileNumber,
          role: user.role,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          accountStatus: user.accountStatus,
        },
        accessToken,
        refreshToken,
      },
      "Registration successful! Your account is now active."
    )
  );
});
/**
 * Register new user
 * @route POST /api/v1/auth/register
 * @access Public
 */
// export const register = asyncHandler(async (req, res) => {
//     const { email, password } = req.body;
//     const lang = req.language || "en";

//     // Validate required fields
//     if (!email || !password) {
//         throw BadRequestError("Email and password are required", {}, lang);
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ email: email.toLowerCase(), isDeleted: false });

//     if (existingUser) {
//         // If email exists but is not verified, delete the old user and allow re-registration
//         if (!existingUser.emailVerified) {
//             await User.findByIdAndDelete(existingUser._id);
//             logger.info("Deleted unverified user for re-registration", {
//                 oldUserId: existingUser._id,
//                 email
//             });
//         } else {
//             // Email is already verified, cannot register again
//             throw ConflictError("User with this email already exists and is verified", {}, lang);
//         }
//     }

//     // Create user (password will be hashed by pre-save hook)
//     const userData = {
//         email: email.toLowerCase(),
//         password,
//         role: ROLES.BUYER,
//         accountStatus: ACCOUNT_STATUS.ACTIVE,
//         emailVerified: false,
//     };

//     console.log("Creating user with data:", JSON.stringify(userData, null, 2));
//     console.log("Full req.body:", JSON.stringify(req.body, null, 2));

//     const user = await User.create(userData);

//     // Delete any existing OTP and create new one
//     await authService.createAndSendOTP(email, "email_verification");

//     logger.info("User registered successfully", { userId: user._id, email});

//     res.status(201).json(
//         new ApiResponse(
//             201,
//             {
//                 email: user.email,
//                 role: user.role,
//                 message: "User registered successfully. Please check your email for the OTP to verify your account.",
//             },
//             "Registration successful. OTP sent to your email."
//         )
//     );
// });

// /**
//  * Verify OTP
//  * @route POST /api/v1/auth/verify-otp
//  * @access Public
//  */
// export const verifyOTP = asyncHandler(async (req, res) => {
//     const { email, otp } = req.body;
//     const lang = req.language || "en";

//     // Validate required fields
//     if (!email || !otp) {
//         throw BadRequestError("Email and OTP are required", {}, lang);
//     }

//     // Find user by email
//     const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
//     if (!user) {
//         throw NotFoundError("User not found", {}, lang);
//     }

//     // Check account status
//     if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
//         throw UnauthorizedError(
//             `Your account is ${user.accountStatus}. Please contact support.`,
//             {},
//             lang
//         );
//     }

//     // Check if already verified
//     if (user.emailVerified) {
//         throw BadRequestError("Email is already verified. Please login.", {}, lang);
//     }

//     // Verify OTP
//     const otpVerification = await authService.verifyOTPByEmail(email, otp, "email_verification");
//     if (!otpVerification.valid) {
//         throw BadRequestError(otpVerification.message || "Invalid or expired OTP", {}, lang);
//     }

//     // Update user as verified
//     user.emailVerified = true;
//     await user.save({ validateBeforeSave: false });

//     // Send welcome email
//     await sendWelcomeEmail(user.email, user.name);

//     logger.info("Email verified successfully", { userId: user._id, email });

//     res.json(
//         new ApiResponse(
//             200,
//             {
//                 email: user.email,
//                 emailVerified: true,
//             },
//             "Email verified successfully! You can now login."
//         )
//     );
// });

/**
 * Login user
 * @route POST /api/v1/auth/login
 * @access Public
 */
export const sendLoginOtpWithPassword = asyncHandler(async (req, res) => {
  const { identifier, password, type } = req.body;
  const lang = req.language || "en";

  // ✅ Validate required fields
  if (!identifier || !password || !type) {
    throw BadRequestError(
      "Identifier, password and type are required",
      {},
      lang
    );
  }

  // 🔎 Find user based on email or phone
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { mobileNumber: identifier }],
  }).select("+password");

  if (!user) throw UnauthorizedError("Invalid credentials", {}, lang);

  // 🔁 Validations
  if (user.email && !user.emailVerified) {
    throw UnauthorizedError("Email not verified", {}, lang);
  }

  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw UnauthorizedError(`Account is ${user.accountStatus}`, {}, lang);
  }

  // ✅ Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid)
    throw UnauthorizedError("Invalid credentials", {}, lang);

  // 🔐 Generate OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Delete old OTPs for both email and phone
  const identifiersToDelete = [];
  if (user.email) identifiersToDelete.push(user.email.toLowerCase());
  if (user.mobileNumber) identifiersToDelete.push(user.mobileNumber);

  await OTP.deleteMany({ identifier: { $in: identifiersToDelete } });

  console.log("Old OTPs deleted for user:", identifiersToDelete);

  // ✅ Save OTPs for both email and phone
  const otpDocs = [];
  if (user.email) {
    otpDocs.push(
      OTP.create({
        identifier: user.email.toLowerCase(),
        type: "login_verification",
        otp: otpCode,
        expiresAt: otpExpiry,
        userId: user._id,
      })
    );
  }

  if (user.mobileNumber) {
    otpDocs.push(
      OTP.create({
        identifier: user.mobileNumber,
        type: "login_verification",
        otp: otpCode,
        expiresAt: otpExpiry,
        userId: user._id,
      })
    );
  }

  await Promise.all(otpDocs);

  // 📧 / 📱 Send OTP
  try {
    if (user.email) {
      await sendOTPEmail(user.email, otpCode, 5); // 5 min validity
      logger.info("OTP sent to email", { email: user.email });
    }
    if (user.mobileNumber) {
      await sendSMS(
        user.mobileNumber,
        `Your Cryptians login OTP is: ${otpCode}. Valid for 5 minutes.`
      );
      logger.info("OTP sent to phone", { phone: user.mobileNumber });
    }
  } catch (error) {
    logger.error("Failed to send login OTP", {
      identifier,
      error: error.message,
    });
    throw InternalServerError("Failed to send OTP", {}, lang);
  }

  logger.info("Login OTP sent successfully", { identifier });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        identifier,
        message: "OTP sent successfully to email and phone",
      },
      "OTP sent successfully"
    )
  );
});

export const verifyLoginOtpAndLogin = asyncHandler(async (req, res) => {
  const { identifier, otp } = req.body;
  const lang = req.language || "en";

  // ✅ Validate input first
  if (!identifier || !otp) {
    return res.status(400).json({
      success: false,
      message: "Identifier and OTP are required",
    });
  }

  // ✅ Now safe to use .includes()
  const identifierNormalized = identifier.includes("@")
    ? identifier.toLowerCase()
    : identifier;

  const user = await User.findOne({
    $or: [
      { email: identifierNormalized },
      { mobileNumber: identifierNormalized },
    ],
  });

  if (!user) {
    throw new UnauthorizedError("Invalid request", {}, lang);
  }

  const otpDoc = await OTP.findOne({
    identifier: identifierNormalized,
    type: "login_verification",
    otp,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpDoc) {
    throw new UnauthorizedError("Invalid or expired OTP", {}, lang);
  }

  // Mark OTP as used
  otpDoc.isUsed = true;
  await otpDoc.save();

  // 🔁 EXACT SAME JWT LOGIC AS OLD LOGIN
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  await authService.storeRefreshToken(user._id, refreshToken);

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json(
    new ApiResponse(
      200,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.mobileNumber,
          role: user.role,
          emailVerified: user.emailVerified,
          accountStatus: user.accountStatus,
          kycStatus: user.kycStatus,
        },
      },
      "Login successful"
    )
  );
});

// export const login = asyncHandler(async (req, res) => {
//     const { email, password } = req.body;
//     const lang = req.language || "en";

//     // Validate required fields
//     if (!email || !password) {
//         throw BadRequestError("Email and password are required", {}, lang);
//     }

//     // Find user with password field
//     const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
//     if (!user) {
//         throw UnauthorizedError("Invalid email or password", {}, lang);
//     }

//     // Check if email is verified
//     if (!user.emailVerified) {
//         throw UnauthorizedError(
//             "Email is not verified. Please verify your email first.",
//             {},
//             lang
//         );
//     }

//     // Check account status
//     if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
//         throw UnauthorizedError(
//             "Your account has been suspended. Please contact support.",
//             {},
//             lang
//         );
//     }

//     if (user.accountStatus === ACCOUNT_STATUS.BANNED) {
//         throw UnauthorizedError(
//             "Your account has been banned. Please contact support.",
//             {},
//             lang
//         );
//     }

//     if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
//         throw UnauthorizedError(
//             `Your account is ${user.accountStatus}. Please contact support.`,
//             {},
//             lang
//         );
//     }

//     // Verify password
//     const isPasswordValid = await user.comparePassword(password);
//     if (!isPasswordValid) {
//         throw UnauthorizedError("Invalid email or password", {}, lang);
//     }

//     // Generate tokens
//     const accessToken = user.generateAccessToken();
//     const refreshToken = user.generateRefreshToken();

//     // Store refresh token in Redis
//     await authService.storeRefreshToken(user._id, refreshToken);

//     // Update last login
//     user.lastLoginAt = new Date();
//     await user.save({ validateBeforeSave: false });

//     // Set tokens in cookies
//     const cookieOptions = {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: process.env.NODE_ENV === "production" ? 'none': 'lax',
//         path: '/',

//     };

//     res.cookie("accessToken", accessToken, {
//         ...cookieOptions,
//         maxAge: 15 * 60 * 1000, // 15 minutes
//     });

//     res.cookie("refreshToken", refreshToken, {
//         ...cookieOptions,
//         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });

//     logger.info("User logged in successfully", { userId: user._id, email });

//     res.json(
//         new ApiResponse(
//             200,
//             {
//                 user: {
//                     _id: user._id,
//                     name: user.name,
//                     email: user.email,
//                     role: user.role,
//                     emailVerified: user.emailVerified,
//                     accountStatus: user.accountStatus,
//                     kycStatus: user.kycStatus,
//                 },
//                 accessToken,
//                 refreshToken,
//             },
//             "Login successful"
//         )
//     );
// });

/**
 * Refresh access token
 * @route POST /api/v1/auth/refresh
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

  // Generate new tokens
  const accessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  // Replace old refresh token with new one
  await authService.storeRefreshToken(user._id, newRefreshToken);

  logger.info("Token refreshed", { userId: user._id });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
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

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 * @access Private
 */
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Remove refresh token from Redis
  await authService.removeRefreshToken(userId);

  // Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  logger.info("User logged out", { userId });

  res.json(new ApiResponse(200, {}, "Logged out successfully"));
});

/**
 * Forgot password - Send OTP to both email and SMS
 * @route POST /api/v1/auth/forgot-password
 * @access Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  const lang = req.language || "en";

  if (!identifier) {
    throw BadRequestError("Email or phone number is required", {}, lang);
  }

  // Find user by email or phone
  const isEmail = identifier.includes("@");
  const user = await User.findOne(
    isEmail
      ? { email: identifier.toLowerCase() }
      : { mobileNumber: identifier }
  );

  if (!user) {
    // Don't reveal if user exists for security
    res.json(
      new ApiResponse(
        200,
        { otpSent: true },
        "If the account exists, a password reset OTP has been sent"
      )
    );
    return;
  }

  // Check if email is verified
  if (user.email && !user.emailVerified) {
    throw BadRequestError(
      "Email is not verified. Please verify your email first.",
      {},
      lang
    );
  }

  // Generate OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Delete old password_reset OTPs for this user
  const identifiersToDelete = [];
  if (user.email) identifiersToDelete.push(user.email.toLowerCase());
  if (user.mobileNumber) identifiersToDelete.push(user.mobileNumber);
  await OTP.deleteMany({
    identifier: { $in: identifiersToDelete },
    type: "password_reset",
  });

  // Store OTP for both email and phone identifiers
  const otpDocs = [];
  if (user.email) {
    otpDocs.push(
      OTP.create({
        identifier: user.email.toLowerCase(),
        type: "password_reset",
        otp: otpCode,
        expiresAt: otpExpiry,
      })
    );
  }
  if (user.mobileNumber) {
    otpDocs.push(
      OTP.create({
        identifier: user.mobileNumber,
        type: "password_reset",
        otp: otpCode,
        expiresAt: otpExpiry,
      })
    );
  }
  await Promise.all(otpDocs);

  // Send OTP via both email and SMS
  const sendPromises = [];
  if (user.email) {
    sendPromises.push(
      sendOTPEmail(user.email, otpCode, "password_reset").catch((err) => {
        logger.error("Failed to send password reset email", { error: err.message });
      })
    );
  }
  if (user.mobileNumber) {
    sendPromises.push(
      sendSMS(
        user.mobileNumber,
        `Your Cryptians password reset code is: ${otpCode}. Valid for 5 minutes.`
      ).catch((err) => {
        logger.error("Failed to send password reset SMS", { error: err.message });
      })
    );
  }
  await Promise.all(sendPromises);

  logger.info("Password reset OTP sent via email & SMS", {
    userId: user._id,
    email: user.email,
    phone: user.mobileNumber,
  });

  res.json(
    new ApiResponse(
      200,
      {
        otpSent: true,
        expiresIn: 300,
        channels: {
          email: !!user.email,
          sms: !!user.mobileNumber,
        },
      },
      "Password reset OTP sent to your email and phone"
    )
  );
});

/**
 * Reset password with OTP
 * @route POST /api/v1/auth/reset-password
 * @access Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { identifier, otp, newPassword } = req.body;
  const lang = req.language || "en";

  if (!identifier || !otp || !newPassword) {
    throw BadRequestError(
      "Identifier, OTP, and new password are required",
      {},
      lang
    );
  }

  // Find user by email or phone
  const isEmail = identifier.includes("@");
  const normalizedIdentifier = isEmail
    ? identifier.toLowerCase()
    : identifier;

  const user = await User.findOne(
    isEmail
      ? { email: normalizedIdentifier }
      : { mobileNumber: normalizedIdentifier }
  ).select("+password");

  if (!user) {
    throw NotFoundError("User not found", {}, lang);
  }

  // Verify OTP against the identifier used
  const otpDoc = await OTP.findOne({
    identifier: normalizedIdentifier,
    type: "password_reset",
    otp,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpDoc) {
    throw BadRequestError("Invalid or expired OTP", {}, lang);
  }

  // Mark OTP as used
  otpDoc.isUsed = true;
  await otpDoc.save();

  // Also mark any OTP for the other identifier (email/phone) as used
  const otherIdentifier = isEmail ? user.mobileNumber : user.email?.toLowerCase();
  if (otherIdentifier) {
    await OTP.updateMany(
      { identifier: otherIdentifier, type: "password_reset", isUsed: false },
      { $set: { isUsed: true } }
    );
  }

  // Update password
  user.password = newPassword; // Will be hashed by pre-save hook
  await user.save();

  // Invalidate all refresh tokens (force re-login on all devices)
  await authService.removeRefreshToken(user._id);

  logger.info("Password reset successful", { userId: user._id });

  res.json(
    new ApiResponse(
      200,
      {},
      "Password reset successful. Please login with your new password."
    )
  );
});

/**
 * Resend OTP
 * @route POST /api/v1/auth/resend-otp
 * @access Public
 */
export const resendOTP = asyncHandler(async (req, res) => {
  const { email, otpType } = req.body;
  const lang = req.language || "en";

  if (!email) {
    throw BadRequestError("Email is required", {}, lang);
  }

  const validOtpTypes = ["email_verification", "password_reset"];
  const type = validOtpTypes.includes(otpType) ? otpType : "email_verification";

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw NotFoundError("User not found", {}, lang);
  }

  // If resending for email verification, check if already verified
  if (type === "email_verification" && user.emailVerified) {
    throw BadRequestError("Email is already verified. Please login.", {}, lang);
  }

  // If resending for password reset, check if email is verified
  if (type === "password_reset" && !user.emailVerified) {
    throw BadRequestError(
      "Email is not verified. Please verify your email first.",
      {},
      lang
    );
  }

  // Create and send OTP
  await authService.createAndSendOTP(email, type);

  logger.info("OTP resent", { userId: user._id, email, otpType: type });

  res.json(
    new ApiResponse(
      200,
      {
        otpSent: true,
        expiresIn: 300, // 5 minutes
        otpType: type,
      },
      "OTP sent successfully"
    )
  );
});

/**
 * Change password (for logged-in users)
 * @route POST /api/v1/auth/change-password
 * @access Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;
  const lang = req.language || "en";

  if (!currentPassword || !newPassword) {
    throw BadRequestError(
      "Current password and new password are required",
      {},
      lang
    );
  }

  // Find user
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw NotFoundError("User not found", {}, lang);
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw UnauthorizedError("Current password is incorrect", {}, lang);
  }

  // Update password
  user.password = newPassword; // Will be hashed by pre-save hook
  await user.save();

  // Invalidate all refresh tokens (force re-login on all devices)
  await authService.removeRefreshToken(userId);

  logger.info("Password changed", { userId });

  res.json(
    new ApiResponse(
      200,
      {},
      "Password changed successfully. Please login again with your new password."
    )
  );
});
