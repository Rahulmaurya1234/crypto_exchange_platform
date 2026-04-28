// src/api/v1/platform-a/listings/routes.js
import { Router } from "express";
import * as listingController from "./controller.js";
import * as instantSellerController from "./instant-seller.controller.js";
import { auth, optionalAuth } from "../../../../middleware/auth.middleware.js";
import { validate } from "../../../../middleware/validate.middleware.js";
import {
    createListingSchema,
    updateListingSchema,
    searchListingsSchema,
    calculateDepositSchema,
    createInstantSellerListingSchema,
    resubmitListingSchema,
} from "../../../../validators/listing.validator.js";

const router = Router();

// ==================== INSTANT SELLER ROUTES ====================

/**
 * @route   GET /api/v1/platform-a/listings/instant-seller/calculate-deposit
 * @desc    Calculate instant seller deposit amount
 * @access  Public
 */
router.get(
    "/instant-seller/calculate-deposit",
    validate(calculateDepositSchema, "query"),
    instantSellerController.calculateDeposit
);

/**
 * @route   POST /api/v1/platform-a/listings/instant-seller
 * @desc    Create instant seller listing
 * @access  Private
 */
router.post(
    "/instant-seller",
    auth,
    validate(createInstantSellerListingSchema),
    instantSellerController.createInstantSellerListing
);

/**
 * @route   GET /api/v1/platform-a/listings/instant-seller/deposits
 * @desc    Get own deposit history
 * @access  Private
 */
router.get(
    "/instant-seller/deposits",
    auth,
    instantSellerController.getMyDeposits
);

/**
 * @route   PATCH /api/v1/platform-a/listings/instant-seller/:id/resubmit
 * @desc    Resubmit rejected instant seller listing
 * @access  Private
 */
router.patch(
    "/instant-seller/:id/resubmit",
    auth,
    validate(resubmitListingSchema),
    instantSellerController.resubmitListing
);

// ==================== REGULAR LISTING ROUTES ====================

/**
 * @route   POST /api/v1/platform-a/listings
 * @desc    Create new listing
 * @access  Private - Sellers only
 */
router.post("/", auth, validate(createListingSchema), listingController.createListing);

/**
 * @route   GET /api/v1/platform-a/listings
 * @desc    Search/filter listings
 * @access  Public
 */
router.get("/", listingController.searchListings);

/**
 * @route   GET /api/v1/platform-a/listings/my-listings
 * @desc    Get own listings
 * @access  Private
 */
router.get("/my-listings", auth, listingController.getMyListings);

/**
 * @route   GET /api/v1/platform-a/listings/:id
 * @desc    Get listing by ID
 * @access  Public
 */
router.get("/:id", listingController.getListingById);

/**
 * @route   PUT /api/v1/platform-a/listings/:id
 * @desc    Update listing
 * @access  Private
 */
router.put("/:id", auth, validate(updateListingSchema), listingController.updateListing);

/**
 * @route   DELETE /api/v1/platform-a/listings/:id
 * @desc    Delete listing
 * @access  Private
 */
router.delete("/:id", auth, listingController.deleteListing);

/**
 * @route   PATCH /api/v1/platform-a/listings/:id/pause
 * @desc    Pause listing
 * @access  Private
 */
router.patch("/:id/pause", auth, listingController.pauseListing);

/**
 * @route   PATCH /api/v1/platform-a/listings/:id/resume
 * @desc    Resume listing
 * @access  Private
 */
router.patch("/:id/resume", auth, listingController.resumeListing);

export default router;
