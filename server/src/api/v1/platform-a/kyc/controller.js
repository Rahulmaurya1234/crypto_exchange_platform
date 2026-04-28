// src/api/v1/platform-a/kyc/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import { BadRequestError, NotFoundError } from "../../../../utils/ApiError.js";
import * as kycService from "../../../../services/kyc.service.js";
import { KYC_STATUS } from "../../../../constants/index.js";

/**
 * Submit KYC
 * @route POST /api/v1/platform-a/kyc/submit
 * @access Private
 */
export const submitKYC = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const kycData = req.body;
    const lang = req.language || "en";

    // Check if user already has approved KYC
    const existingKYC = await kycService.getKYCByUserId(userId);
    if (existingKYC && existingKYC.status === KYC_STATUS.APPROVED) {
        throw BadRequestError("KYC is already approved", {}, lang);
    }

    const kyc = await kycService.submitKYC(userId, kycData);

    res.status(201).json(
        new ApiResponse(
            201,
            {
                kyc: {
                    _id: kyc._id,
                    status: kyc.status,
                    submittedAt: kyc.submittedAt,
                },
            },
            "KYC submitted successfully. It will be reviewed within 24-48 hours."
        )
    );
});

/**
 * Get own KYC status
 * @route GET /api/v1/platform-a/kyc/status
 * @access Private
 */
export const getOwnKYC = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const kyc = await kycService.getKYCByUserId(userId);

    if (!kyc) {
        return res.json(
            new ApiResponse(
                200,
                {
                    kyc: null,
                    message: "KYC not submitted yet",
                },
                "No KYC found"
            )
        );
    }

    res.json(new ApiResponse(200, { kyc }, "KYC status retrieved successfully"));
});

export default {
    submitKYC,
    getOwnKYC,
};
