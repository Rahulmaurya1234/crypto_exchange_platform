// src/routes/ad.route.js
import express from "express";
import { auth, requireRole } from "../middleware/auth.middleware.js";
import { kycCheck } from "../middleware/kycCheck.js";
import { USER_ROLES } from "../models/User.model.js";
import {
    getAllAds,
    updateAdStatus,
    createAd,
    browseAds,
    getAdDetail,
    deleteAd,
    flagAd,
    getAdContact,
} from "../controllers/ad.controller.js";
import { uploadAdImage, handleMulterError } from "../middleware/multer.middleware.js";

const router = express.Router();

// --------------------
// Admin Routes (relative to /api/ads)
// --------------------

// GET /api/ads/admin/ads  → list all ads (admin)
router.get(
    "/admin/ads",
    auth,
    requireRole(USER_ROLES.ADMIN),
    getAllAds
);

// DELETE /api/ads/admin/ads/:id  → delete ad (admin)
router.delete(
    "/admin/ads/:id",
    auth,
    requireRole(USER_ROLES.ADMIN),
    deleteAd
);

// PATCH /api/ads/admin/ads/:id/flag  → flag ad (admin)
router.patch(
    "/admin/ads/:id/flag",
    auth,
    requireRole(USER_ROLES.ADMIN),
    flagAd
);

// PATCH /api/ads/admin/ads/:id/status  → update status (admin)
router.patch(
    "/admin/ads/:id/status",
    auth,
    requireRole(USER_ROLES.ADMIN),
    updateAdStatus
);

// --------------------
// Public / User Routes (relative to /api/ads)
// --------------------

// POST /api/ads  → create ad (user, KYC required, with optional image)
router.post(
    "/",
    auth,
    kycCheck,
    uploadAdImage,          // <- this handles "image" from FormData
    handleMulterError,      // <- clean error response for upload issues
    createAd
);

// GET /api/ads  → browse ads (public)
router.get(
    "/",
    browseAds
);

// GET /api/ads/:id  → ad details (public)
router.get(
    "/:id",
    getAdDetail
);

// GET /api/ads/:id/contact  → ad contact (public)
router.get("/:id/contact", auth, getAdContact);

export default router;
