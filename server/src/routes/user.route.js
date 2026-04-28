// routes/auth.routes.js
import express from "express";
import { auth, requireRole } from "../middleware/auth.middleware.js";
import {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getMe,
    getProfile,
    createProfile,
    updateProfile,
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
} from "../controllers/user.controller.js";

import {
    submitKyc,
    getKycQueue,
    approveKyc,
    rejectKyc,
} from "../controllers/kyc.controller.js";

import {
    uploadKycDocs,
    handleMulterError,
} from "../middleware/multer.middleware.js";

import { USER_ROLES } from "../models/User.model.js";

const router = express.Router();

// --------------------
// Auth
// --------------------
// router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);

router.post("/logout", auth, logoutUser);
router.get("/me", auth, getMe);

// --------------------
// Profile
// --------------------
router.get("/profile", auth, getProfile);
router.post("/profile", auth, createProfile);
router.patch("/profile", auth, updateProfile);

// --------------------
// Admin Dashboard
// --------------------
router.get(
    "/admin/dashboard",
    auth,
    requireRole(USER_ROLES.ADMIN),
    getDashboardStats
);

// --------------------
// KYC FLOW
// --------------------

// 4.1 User KYC upload
router.post(
    "/kyc",
    auth,
    uploadKycDocs,
    handleMulterError,
    submitKyc
);

// 4.2 Admin: KYC queue
router.get(
    "/admin/kyc-queue",
    auth,
    requireRole(USER_ROLES.ADMIN),
    getKycQueue
);

// 4.2 Admin: approve KYC
router.post(
    "/admin/kyc/:userId/approve",
    auth,
    requireRole(USER_ROLES.ADMIN),
    approveKyc
);

// 4.2 Admin: reject KYC
router.post(
    "/admin/kyc/:userId/reject",
    auth,
    requireRole(USER_ROLES.ADMIN),
    rejectKyc
);

// --------------------
// Admin: User Management
// --------------------
router.get(
    "/admin/users",
    auth,
    requireRole(USER_ROLES.ADMIN),
    getAllUsers
);

router.patch(
    "/admin/users/:id/status",
    auth,
    requireRole(USER_ROLES.ADMIN),
    updateUserStatus
);

export default router;

