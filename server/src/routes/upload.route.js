// server/src/routes/upload.route.js
import express from "express";
import { getObjectSignedUrl } from "../utils/s3.util.js";
import * as uploadController from "../controllers/upload.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import { uploadKycDocs, handleMulterError } from "../middleware/multer.middleware.js";

const router = express.Router();

/**
 * POST /api/v1/upload/kyc/presigned-url
 * Get pre-signed URL for direct S3 upload (recommended approach)
 * Expects JSON body:
 *  - fileName (string)
 *  - fileType (string) - MIME type
 *  - documentType (string) - aadhaar_front, aadhaar_back, pan_card, bank_proof, selfie
 */
router.post(
  "/kyc/presigned-url",
  auth,
  uploadController.getKYCUploadUrl
);

/**
 * POST /api/v1/upload/trade/presigned-url
 * Get pre-signed URL for trade document upload (Aadhaar, Payment Proof)
 * Expects JSON body:
 *  - fileName (string)
 *  - fileType (string) - MIME type
 *  - documentType (string) - aadhaar_front, aadhaar_back, payment_proof
 *  - tradeId (string) - optional
 */
router.post(
  "/trade/presigned-url",
  auth,
  uploadController.getTradeDocumentUploadUrl
);

/**
 * POST /api/v1/upload/payment-proof/presigned-url
 * Get pre-signed URL for payment proof screenshot
 * Expects JSON body:
 *  - fileName (string)
 *  - fileType (string) - MIME type
 *  - tradeId (string) - required
 */
router.post(
  "/payment-proof/presigned-url",
  auth,
  uploadController.getPaymentProofUploadUrl
);

/**
 * POST /api/v1/upload/kyc
 * Upload multiple KYC documents (Aadhaar front/back, PAN, Selfie)
 * Expects multipart/form-data with fields:
 *  - aadhar_image (file)
 *  - pan_image (file)
 *
 * NOTE: This endpoint passes files through backend server.
 * For production, prefer using /kyc/presigned-url for direct S3 upload.
 */
router.post(
  "/kyc",
  auth,
  uploadKycDocs,
  handleMulterError,
  uploadController.uploadKYCDocuments
);

/**
 * GET /api/uploads/:key
 *
 * Example request from the client:
 *   GET /api/uploads/kyc/5f6a8c9e-1234-5678-90ab-cdef12345678.png
 *
 * The `:key` param must be URL‑encoded because it can contain slashes.
 */
router.get("/:key", async (req, res) => {
  try {
    // Decode the key – Express leaves it URL‑encoded.
    const key = decodeURIComponent(req.params.key);

    // Generate a signed URL (5 min expiry by default)
    const url = await getObjectSignedUrl(key);

    res.status(200).json({
      success: true,
      url,
    });
  } catch (err) {
    console.error("❌ Signed-URL error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to generate signed URL",
    });
  }
});

export default router;