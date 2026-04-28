// src/api/v1/platform-a/listings/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../../../utils/ApiError.js";
import * as listingService from "../../../../services/listing.service.js";
import { logListingAction } from "../../../../services/audit.service.js";
import { AUDIT_ACTION } from "../../../../constants/index.js";

/**
 * Create listing
 * @route POST /api/v1/platform-a/listings
 * @access Private - Sellers only
 */
export const createListing = asyncHandler(async (req, res) => {
    console.log(" create listing req.body:", req.body);
    const sellerId = req.user._id;
    const listingData = req.body;
    const lang = req.language || "en";

    console.log("Creating listing with data:", listingData, sellerId);

    const listing = await listingService.createListing(sellerId, listingData);

    // Audit Log
    await logListingAction(
        AUDIT_ACTION.LISTING_CREATE,
        sellerId,
        req.user.role,
        listing._id,
        { coin: listing.coin, amount: listing.totalAmount },
        req
    );

    res.status(201).json(
        new ApiResponse(201, { listing }, "Listing created successfully")
    );
});

/**
 * Search listings
 * @route GET /api/v1/platform-a/listings
 * @access Public
 */
export const searchListings = asyncHandler(async (req, res) => {
    const filters = req.query;
    const result = await listingService.searchListings(filters);
    res.json(new ApiResponse(200, result, "Listings fetched successfully"));
});

/**
 * Get listing by ID
 * @route GET /api/v1/platform-a/listings/:id
 * @access Public
 */
export const getListingById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const lang = req.language || "en";

    const listing = await listingService.getListingById(id);

    if (!listing) {
        throw new NotFoundError("Listing not found", {}, lang);
    }

    res.json(new ApiResponse(200, { listing }, "Listing fetched successfully"));
});

/**
 * Get my listings (Seller)
 * @route GET /api/v1/platform-a/listings/my
 * @access Private
 */
export const getMyListings = asyncHandler(async (req, res) => {
    const sellerId = req.user._id;
    const filters = req.query;
    const result = await listingService.getSellerListings(sellerId, filters);
    res.json(new ApiResponse(200, result, "Your listings fetched successfully"));
});

/**
 * Update listing
 * @route PUT /api/v1/platform-a/listings/:id
 * @access Private
 */
export const updateListing = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sellerId = req.user._id;
    const updateData = req.body;
    const lang = req.language || "en";

    const listing = await listingService.updateListing(id, sellerId, updateData);

    if (!listing) {
        throw NotFoundError("Listing not found or you don't have permission to update it", {}, lang);
    }

    // Audit Log
    await logListingAction(
        AUDIT_ACTION.LISTING_UPDATE,
        sellerId,
        req.user.role,
        listing._id,
        { updates: Object.keys(updateData) },
        req
    );

    res.json(new ApiResponse(200, { listing }, "Listing updated successfully"));
});

/**
 * Delete listing
 * @route DELETE /api/v1/platform-a/listings/:id
 * @access Private
 */
export const deleteListing = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sellerId = req.user._id;
    const lang = req.language || "en";

    const listing = await listingService.deleteListing(id, sellerId);

    if (!listing) {
        throw NotFoundError("Listing not found or you don't have permission to delete it", {}, lang);
    }

    // Audit Log
    await logListingAction(
        AUDIT_ACTION.LISTING_DELETE,
        sellerId,
        req.user.role,
        id,
        {},
        req
    );

    res.json(new ApiResponse(200, { listing }, "Listing deleted successfully"));
});

/**
 * Pause listing
 * @route PATCH /api/v1/platform-a/listings/:id/pause
 * @access Private
 */
export const pauseListing = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sellerId = req.user._id;
    const lang = req.language || "en";

    const listing = await listingService.pauseListing(id, sellerId);

    if (!listing) {
        throw NotFoundError("Listing not found or you don't have permission", {}, lang);
    }

    // Audit Log
    await logListingAction(
        AUDIT_ACTION.LISTING_UPDATE,
        sellerId,
        req.user.role,
        id,
        { status: "paused" },
        req
    );

    res.json(new ApiResponse(200, { listing }, "Listing paused successfully"));
});

/**
 * Resume listing
 * @route PATCH /api/v1/platform-a/listings/:id/resume
 * @access Private
 */
export const resumeListing = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sellerId = req.user._id;
    const lang = req.language || "en";

    const listing = await listingService.resumeListing(id, sellerId);

    if (!listing) {
        throw NotFoundError("Listing not found or you don't have permission", {}, lang);
    }

    // Audit Log
    await logListingAction(
        AUDIT_ACTION.LISTING_UPDATE,
        sellerId,
        req.user.role,
        id,
        { status: "active" },
        req
    );

    res.json(new ApiResponse(200, { listing }, "Listing resumed successfully"));
});

export default {
    createListing,
    searchListings,
    getListingById,
    getMyListings,
    updateListing,
    deleteListing,
    pauseListing,
    resumeListing,
};
