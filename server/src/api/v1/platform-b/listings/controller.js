// src/api/v1/platform-a/admin/listings/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../../../utils/ApiError.js";
import * as listingService from "../../../../services/listing.service.js";
import { logListingAction } from "../../../../services/audit.service.js";
import { AUDIT_ACTION } from "../../../../constants/index.js";

/**
 * Get all pending instant seller deposits
 * @route GET /api/v1/platform-b/admin/listings/pending-deposits
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
 * @route PATCH /api/v1/platform-b/admin/listings/:id/approve-deposit
 * @access Admin only
 */
export const approveDeposit = asyncHandler(async (req, res) => {
    console.log("req.body:", req.body);
    const { id } = req.params;  // ✅ listingId
    const adminId = req.user._id;  // ✅ From auth middleware
    const { verified, rejectionReason, canResubmit, notes } = req.body;

    if (verified === undefined) {  // ✅ Good validation
        throw new BadRequestError("'verified' field is required");
    }

    if (verified) {
        // ✅ Approve path
        const { listing, deposit, user } = await listingService.approveInstantSellerDeposit(
            id,
            adminId,
            notes
        );

        // Audit Log
        await logListingAction(
            AUDIT_ACTION.LISTING_UPDATE,
            adminId,
            req.user.role,
            id,
            { event: "deposit_approved", notes },
            req
        );

        res.json(
            new ApiResponse(
                200,
                { listing, deposit, user },
                "Deposit approved successfully. Seller is now an Instant Seller!"
            )
        );
    } else {
        // ✅ Reject path
        if (!rejectionReason) {  // ✅ Good validation
            throw new BadRequestError("Rejection reason is required");
        }

        const { listing, deposit } = await listingService.rejectInstantSellerDeposit(
            id,
            adminId,
            rejectionReason,
            canResubmit !== false  // ✅ Default true
        );

        // Audit Log
        await logListingAction(
            AUDIT_ACTION.LISTING_UPDATE,
            adminId,
            req.user.role,
            id,
            { event: "deposit_rejected", rejectionReason },
            req
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

    const InstantSellerDeposit = (await import("../../../../models/InstantSellerDeposit.model.js")).default;
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

export const getAllDeposits = asyncHandler(async (req, res) => {
    const deposits = await listingService.getAllDeposits();

    res.json(
        new ApiResponse(
            200,
            { deposits },
            "All deposits retrieved successfully"
        )
    );
});

export default {
    getPendingDeposits,
    approveDeposit,
    getDepositByListingId,
};
