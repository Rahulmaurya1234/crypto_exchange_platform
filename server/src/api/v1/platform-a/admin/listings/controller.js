// src/api/v1/platform-a/admin/listings/controller.js
import { asyncHandler } from "../../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../../utils/ApiResponse.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../../../../utils/ApiError.js";
import * as listingService from "../../../../../services/listing.service.js";

/**
 * Get all pending instant seller deposits
 * @route GET /api/v1/platform-a/admin/listings/pending-deposits
 * @access Admin only
 */
export const getPendingDeposits = asyncHandler(async (req, res) => {
    const deposits = await listingService.getPendingDeposits();

    res.json(
        new ApiResponse(
            200,
            { deposits, total: deposits.length },
            "Pending deposits retrieved successfully"
        )
    );
});

/**
 * Approve instant seller deposit
 * @route PATCH /api/v1/platform-a/admin/listings/:id/approve-deposit
 * @access Admin only
 */
export const approveDeposit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user._id;
    const { verified, rejectionReason, canResubmit, notes } = req.body;

    if (verified === undefined) {
        throw new BadRequestError("'verified' field is required");
    }

    if (verified) {
        // Approve
        const { listing, deposit, user } = await listingService.approveInstantSellerDeposit(
            id,
            adminId,
            notes
        );

        res.json(
            new ApiResponse(
                200,
                { listing, deposit, user },
                "Deposit approved successfully. Seller is now an Instant Seller!"
            )
        );
    } else {
        // Reject
        if (!rejectionReason) {
            throw new BadRequestError("Rejection reason is required");
        }

        const { listing, deposit } = await listingService.rejectInstantSellerDeposit(
            id,
            adminId,
            rejectionReason,
            canResubmit !== false // default true
        );

        res.json(
            new ApiResponse(
                200,
                { listing, deposit },
                "Deposit rejected"
            )
        );
    }
});

/**
 * Get deposit by listing ID
 * @route GET /api/v1/platform-a/admin/listings/:id/deposit
 * @access Admin only
 */
export const getDepositByListingId = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const listing = await listingService.getListingById(id);
    if (!listing) {
        throw new NotFoundError("Listing not found");
    }

    const InstantSellerDeposit = (await import("../../../../../models/InstantSellerDeposit.model.js")).default;
    const deposit = await InstantSellerDeposit.findOne({ listingId: id })
        .populate("sellerId", "name email mobileNumber avatar")
        .populate("listingId");

    if (!deposit) {
        throw new NotFoundError("Deposit not found");
    }

    res.json(
        new ApiResponse(
            200,
            { deposit, listing },
            "Deposit details retrieved successfully"
        )
    );
});

export default {
    getPendingDeposits,
    approveDeposit,
    getDepositByListingId,
};
