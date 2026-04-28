// src/controllers/upload.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { BadRequestError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { generatePresignedUploadUrl } from "../utils/s3.util.js";
import path from "path";

/**
 * Upload KYC documents (Aadhaar, PAN, Selfie)
 * @route POST /api/v1/upload/kyc
 * @access Private
 */
export const uploadKYCDocuments = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const lang = req.language || "en";

    // Check if files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
        throw BadRequestError("No files uploaded", {}, lang);
    }

    const uploadedFiles = {};

    // Process each uploaded file
    Object.keys(req.files).forEach((fieldName) => {
        const fileArray = req.files[fieldName];
        const file = fileArray[0]; // Get first file from array

        // For S3 uploads, multer-s3 provides these properties
        if (file.key) {
            // R2 or S3 upload
            // Prefer constructing URL from base if R2 is configured
            if (process.env.R2_PUBLIC_URL && process.env.R2_ACCOUNT_ID) {
                uploadedFiles[fieldName] = `${process.env.R2_PUBLIC_URL}/${file.key}`;
            } else {
                uploadedFiles[fieldName] = file.location;
            }
        } else if (file.location) {
            // S3 upload fallback
            uploadedFiles[fieldName] = file.location;
        } else {
            // Local disk upload
            uploadedFiles[fieldName] = `/uploads/${file.path.split('/').pop()}`;
        }
    });

    logger.info("KYC documents uploaded", {
        userId,
        files: Object.keys(uploadedFiles),
    });

    res.status(200).json(
        new ApiResponse(
            200,
            uploadedFiles,
            "Documents uploaded successfully"
        )
    );
});

/**
 * Upload single document
 * @route POST /api/v1/upload/document
 * @access Private
 */
export const uploadSingleDocument = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const lang = req.language || "en";

    if (!req.file) {
        throw BadRequestError("No file uploaded", {}, lang);
    }

    let fileUrl;
    if (req.file.key) {
        // R2 or S3
        if (process.env.R2_PUBLIC_URL && process.env.R2_ACCOUNT_ID) {
            fileUrl = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;
        } else {
            fileUrl = req.file.location;
        }
    } else {
        fileUrl = req.file.location || `/uploads/${req.file.path.split('/').pop()}`;
    }

    logger.info("Document uploaded", {
        userId,
        fileName: req.file.originalname,
    });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                url: fileUrl,
                fileName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
            },
            "Document uploaded successfully"
        )
    );
});

/**
 * Upload profile avatar
 * @route POST /api/v1/upload/avatar
 * @access Private
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const lang = req.language || "en";

    if (!req.file) {
        throw BadRequestError("No file uploaded", {}, lang);
    }

    let avatarUrl;
    if (req.file.key) {
        if (process.env.R2_PUBLIC_URL && process.env.R2_ACCOUNT_ID) {
            avatarUrl = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;
        } else {
            avatarUrl = req.file.location;
        }
    } else {
        avatarUrl = req.file.location || `/uploads/${req.file.path.split('/').pop()}`;
    }

    logger.info("Avatar uploaded", { userId });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                avatarUrl,
            },
            "Avatar uploaded successfully"
        )
    );
});

/**
 * Generate pre-signed URL for direct S3 upload (KYC documents)
 * @route POST /api/v1/upload/kyc/presigned-url
 * @access Private
 */
export const getKYCUploadUrl = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { fileName, fileType, documentType } = req.body;
    const lang = req.language || "en";

    // Validate inputs
    if (!fileName || !fileType || !documentType) {
        throw BadRequestError("fileName, fileType, and documentType are required", {}, lang);
    }

    // Validate document type
    const validDocTypes = ["aadhaar_front", "aadhaar_back", "pan_card", "bank_proof", "selfie"];
    if (!validDocTypes.includes(documentType)) {
        throw BadRequestError(
            `Invalid documentType. Must be one of: ${validDocTypes.join(", ")}`,
            {},
            lang
        );
    }

    // Validate file type
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedMimeTypes.includes(fileType)) {
        throw BadRequestError("Invalid file type. Only JPG, PNG, and PDF are allowed", {}, lang);
    }

    // Generate unique file key
    const ext = path.extname(fileName);
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const key = `kyc/${userId}/${documentType}-${timestamp}-${randomSuffix}${ext}`;

    // Generate pre-signed POST URL (better for CORS)
    // Generate pre-signed POST URL (better for CORS)
    const { uploadUrl, fields, fileUrl, method } = await generatePresignedUploadUrl(key, {
        contentType: fileType,
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        expiresIn: 300, // 5 minutes
    });

    logger.info("Pre-signed POST URL generated for KYC upload", {
        userId,
        documentType,
        key,
    });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                uploadUrl, // Frontend uploads to this URL
                method,    // HTTP Method (POST for S3, PUT for R2)
                fields,    // Form fields to include in POST
                fileUrl,   // Store this URL in database
                key,       // S3 object key
                expiresIn: 300, // 5 minutes
            },
            "Upload URL generated successfully"
        )
    );
});

/**
 * Generate pre-signed URL for trade document upload (Aadhaar, Payment Proof)
 * @route POST /api/v1/upload/trade/presigned-url
 * @access Private
 */
export const getTradeDocumentUploadUrl = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { fileName, fileType, documentType, tradeId } = req.body;
    const lang = req.language || "en";

    // Validate inputs
    if (!fileName || !fileType || !documentType) {
        throw BadRequestError("fileName, fileType, and documentType are required", {}, lang);
    }

    // Validate document type
    const validDocTypes = [
        "aadhaar_front",       // Buyer's Aadhaar front for trade
        "aadhaar_back",        // Buyer's Aadhaar back for trade
        "payment_proof",       // Bank transfer screenshot
        "payment_screenshot"   // Alternative name
    ];

    if (!validDocTypes.includes(documentType)) {
        throw BadRequestError(
            `Invalid documentType. Must be one of: ${validDocTypes.join(", ")}`,
            {},
            lang
        );
    }

    // Validate file type
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(fileType)) {
        throw BadRequestError(
            "Invalid file type. Only JPG, PNG, and WEBP images are allowed",
            {},
            lang
        );
    }

    // Generate unique file key
    const ext = path.extname(fileName);
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);

    // Organize by trade ID if provided
    const folder = tradeId ? `trades/${tradeId}` : `trades/${userId}`;
    const key = `${folder}/${documentType}-${timestamp}-${randomSuffix}${ext}`;

    // Generate pre-signed POST URL
    const { uploadUrl, fields, fileUrl, method } = await generatePresignedUploadUrl(key, {
        contentType: fileType,
        maxSizeBytes: 10 * 1024 * 1024, // 10MB for payment screenshots
        expiresIn: 600, // 10 minutes
    });

    logger.info("Pre-signed POST URL generated for trade document", {
        userId,
        documentType,
        tradeId,
        key,
    });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                uploadUrl,  // Frontend uploads to this URL
                method,     // HTTP Method
                fields,     // Form fields to include in POST
                fileUrl,    // Store this URL in database
                key,        // S3 object key
                expiresIn: 600, // 10 minutes
            },
            "Upload URL generated successfully"
        )
    );
});

/**
 * Generate pre-signed URL for payment proof upload
 * @route POST /api/v1/upload/payment-proof/presigned-url
 * @access Private
 */
export const getPaymentProofUploadUrl = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { fileName, fileType, tradeId } = req.body;
    const lang = req.language || "en";

    // Validate inputs
    if (!fileName || !fileType || !tradeId) {
        throw BadRequestError("fileName, fileType, and tradeId are required", {}, lang);
    }

    // Validate file type
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(fileType)) {
        throw BadRequestError(
            "Invalid file type. Only JPG, PNG, and WEBP images are allowed",
            {},
            lang
        );
    }

    // Generate unique file key
    const ext = path.extname(fileName);
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const key = `trades/${tradeId}/payment-proof-${timestamp}-${randomSuffix}${ext}`;

    // Generate pre-signed POST URL
    const { uploadUrl, fields, fileUrl, method } = await generatePresignedUploadUrl(key, {
        contentType: fileType,
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        expiresIn: 600, // 10 minutes
    });

    logger.info("Pre-signed POST URL generated for payment proof", {
        userId,
        tradeId,
        key,
    });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                uploadUrl,
                method,
                fields,
                fileUrl,
                key,
                expiresIn: 600,
            },
            "Upload URL generated successfully"
        )
    );
});

export default {
    uploadKYCDocuments,
    uploadSingleDocument,
    uploadAvatar,
    getKYCUploadUrl,
    getTradeDocumentUploadUrl,
    getPaymentProofUploadUrl,
};
