// src/api/v1/platform-a/admin/listings/routes.js
import { Router } from "express";
import * as adminListingController from "./controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";
import { validate } from "../../../../middleware/validate.middleware.js";
import { approveDepositSchema } from "../../../../validators/listing.validator.js";
import { isAdmin } from "../../../../middleware/rbac.middleware.js";

const router = Router();

// All routes require auth and admin role
router.use(auth);
router.use(isAdmin());

/**
 * @route   GET /api/v1/platform-a/admin/listings/pending-deposits
 * @desc    Get all pending instant seller deposits
 * @access  Admin only
 */
router.get("/pending-deposits", adminListingController.getPendingDeposits);
/**
 * @route   GET /api/v1/platform-a/admin/listings/instant-seller/deposits
 * @desc    Get all instant seller deposits (all statuses)
 * @access  Admin only
 */
router.get("/instant-seller/deposits", adminListingController.getAllDeposits);

/**
 * @route   GET /api/v1/platform-a/admin/listings/:id/deposit
 * @desc    Get deposit details for a listing
 * @access  Admin only
 */
router.get("/:id/deposit", adminListingController.getDepositByListingId);

/**
 * @route   PATCH /api/v1/platform-a/admin/listings/:id/approve-deposit
 * @desc    Approve or reject instant seller deposit
 * @access  Admin only
 */
router.patch(
    "/:id/approve-deposit",
    validate(approveDepositSchema),
    adminListingController.approveDeposit
);

export default router;
