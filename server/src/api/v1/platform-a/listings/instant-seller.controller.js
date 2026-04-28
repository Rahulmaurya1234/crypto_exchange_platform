// src/api/v1/platform-a/listings/instant-seller.controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import { BadRequestError, NotFoundError } from "../../../../utils/ApiError.js";
import * as listingService from "../../../../services/listing.service.js";

/**
 * Calculate deposit amount
 * @route GET /api/v1/platform-a/listings/instant-seller/calculate-deposit
 * @access Public
 */
export const calculateDeposit = asyncHandler(async (req, res) => {
    const { amount, network = "ethereum" } = req.query;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        throw new BadRequestError("Valid amount is required");
    }

    const calculation = await listingService.calculateDepositAmount(
        parseFloat(amount),
        network
    );

    res.json(
        new ApiResponse(
            200,
            { calculation },
            "Deposit calculation successful"
        )
    );
});

/**
 * Create instant seller listing
 * @route POST /api/v1/platform-a/listings/instant-seller
 * @access Private
 */
// export const createInstantSellerListing = asyncHandler(async (req, res) => {
//     const sellerId = req.user._id;
//     const {
//         // Listing data
//         availableAmount,
//         pricePerUnit,
//         minTradeLimit,
//         maxTradeLimit,
//         paymentMethods,
//         timeLimit,
//         terms,
//         instructions,
//         autoReplyMessage,
//         cryptoType,
//         priceType,
//         marketPlusPercentage,
//         expiresAt,

//         // Deposit data
//         transactionHash,
//         totalDepositAmount,
//         originalAmount,
//         platformFeeUSDT,
//         gasFeeUSDT,
//         network,
//         gasFeeCalculation,
//     } = req.body;

//     if (!transactionHash) {
//         throw new BadRequestError("Transaction hash is required");
//     }

//     if (!availableAmount || !pricePerUnit || !minTradeLimit || !maxTradeLimit) {
//         throw new BadRequestError("Missing required listing fields");
//     }

//     if (!paymentMethods || paymentMethods.length === 0) {
//         throw new BadRequestError("At least one payment method is required");
//     }

//     const listingData = {
//         availableAmount,
//         pricePerUnit,
//         minTradeLimit,
//         maxTradeLimit,
//         paymentMethods,
//         timeLimit,
//         terms,
//         instructions,
//         autoReplyMessage,
//         cryptoType,
//         priceType,
//         marketPlusPercentage,
//         expiresAt,
//     };

//     const depositData = {
//         transactionHash,
//         totalDepositAmount,
//         originalAmount,
//         platformFeeUSDT,
//         gasFeeUSDT,
//         network,
//         gasFeeCalculation,
//         ipAddress: req.ip,
//         userAgent: req.get("user-agent"),
//     };

//     const { listing, deposit } = await listingService.createInstantSellerListing(
//         sellerId,
//         listingData,
//         depositData
//     );

//     res.status(201).json(
//         new ApiResponse(
//             201,
//             { listing, deposit },
//             "Listing created successfully. Awaiting admin approval."
//         )
//     );
// });
// src/api/v1/platform-a/listings/instant-seller.controller.js

export const createInstantSellerListing = asyncHandler(async (req, res) => {
    const sellerId = req.user._id;
    const {
        // Listing data
        availableAmount,
        pricePerUnit,
        minTradeLimit,
        maxTradeLimit,
        paymentMethods,
        timeLimit,
        terms,
        instructions,
        autoReplyMessage,
        cryptoType,
        priceType,
        marketPlusPercentage,
        expiresAt,

        // ✅ Only transaction hash required now
        transactionHash,
    } = req.body;

    if (!transactionHash?.trim()) {
        throw new BadRequestError("Transaction hash is required");
    }

    if (!availableAmount || !pricePerUnit || !minTradeLimit || !maxTradeLimit) {
        throw new BadRequestError("Missing required listing fields");
    }

    if (!paymentMethods || paymentMethods.length === 0) {
        throw new BadRequestError("At least one payment method is required");
    }

    const listingData = {
        availableAmount,
        pricePerUnit,
        minTradeLimit,
        maxTradeLimit,
        paymentMethods,
        timeLimit,
        terms,
        instructions,
        autoReplyMessage,
        cryptoType: cryptoType || 'USDT',
        priceType: priceType || 'fixed',
        marketPlusPercentage,
        expiresAt,
    };

    // ✅ Simplified deposit data - backend will calculate
    const depositData = {
        transactionHash: transactionHash.trim(),
        originalAmount: availableAmount,  // Use listing amount as deposit
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    };

    const { listing, deposit } = await listingService.createInstantSellerListing(
        sellerId,
        listingData,
        depositData
    );

    res.status(201).json(
        new ApiResponse(
            201,
            { listing, deposit },
            "Listing created successfully. Awaiting admin approval."
        )
    );
});


/**
 * Resubmit rejected listing
 * @route PATCH /api/v1/platform-a/listings/instant-seller/:id/resubmit
 * @access Private
 */
export const resubmitListing = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sellerId = req.user._id;
    const { newTransactionHash, comments } = req.body;

    if (!newTransactionHash) {
        throw new BadRequestError("New transaction hash is required");
    }

    const { listing, deposit } = await listingService.resubmitInstantSellerListing(
        id,
        sellerId,
        newTransactionHash,
        comments
    );

    res.json(
        new ApiResponse(
            200,
            { listing, deposit },
            "Listing resubmitted successfully"
        )
    );
});

/**
 * Get own deposit history
 * @route GET /api/v1/platform-a/listings/instant-seller/deposits
 * @access Private
 */
export const getMyDeposits = asyncHandler(async (req, res) => {
    const sellerId = req.user._id;

    const deposits = await listingService.getSellerDepositHistory(sellerId);

    res.json(
        new ApiResponse(
            200,
            { deposits },
            "Deposit history retrieved successfully"
        )
    );
});

export default {
    calculateDeposit,
    createInstantSellerListing,
    resubmitListing,
    getMyDeposits,
};
