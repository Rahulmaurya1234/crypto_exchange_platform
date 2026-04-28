// src/api/v1/platform-a/kyc/routes.js
import { Router } from "express";
import * as kycController from "./controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";
import { validate } from "../../../../middleware/validate.middleware.js";
import { submitKycSchema } from "../../../../validators/kyc.validator.js";

const router = Router();

/**
 * @route   POST /api/v1/platform-a/kyc/submit
 * @desc    Submit KYC for verification
 * @access  Private
 */
router.post("/submit", auth, validate(submitKycSchema), kycController.submitKYC);

/**
 * @route   GET /api/v1/platform-a/kyc/status
 * @desc    Get own KYC status
 * @access  Private
 */
router.get("/status", auth, kycController.getOwnKYC);

export default router;
