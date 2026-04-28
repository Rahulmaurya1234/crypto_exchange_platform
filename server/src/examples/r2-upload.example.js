// EXAMPLE: How to use R2 upload in your controllers
// src/controllers/upload.controller.example.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as r2UploadService from "../services/r2-upload.service.js";

/**
 * Example: Upload profile picture
 * Route: POST /api/v1/upload/profile-picture
 * Middleware: uploadSingle('avatar')
 */
export const uploadProfilePicture = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new Error("No file uploaded");
    }

    // Upload to R2
    const result = await r2UploadService.uploadProfilePicture(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
    );

    res.json(
        new ApiResponse(
            200,
            {
                url: result.url,
                key: result.key,
                size: result.size,
            },
            "Profile picture uploaded successfully"
        )
    );
});

/**
 * Example: Upload KYC documents
 * Route: POST /api/v1/upload/kyc-document
 * Middleware: uploadSingle('document')
 */
export const uploadKYCDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new Error("No file uploaded");
    }

    // Upload to R2
    const result = await r2UploadService.uploadKYCDocument(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
    );

    res.json(
        new ApiResponse(
            200,
            {
                url: result.url,
                key: result.key,
            },
            "KYC document uploaded successfully"
        )
    );
});

/**
 * Example: Upload payment proof
 * Route: POST /api/v1/upload/payment-proof
 * Middleware: uploadSingle('proof')
 */
export const uploadPaymentProof = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new Error("No file uploaded");
    }

    // Upload to R2
    const result = await r2UploadService.uploadPaymentProof(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
    );

    res.json(
        new ApiResponse(
            200,
            {
                url: result.url,
                key: result.key,
            },
            "Payment proof uploaded successfully"
        )
    );
});

/**
 * Example: Upload multiple files
 * Route: POST /api/v1/upload/multiple
 * Middleware: uploadMultiple('files', 5)
 */
export const uploadMultipleFiles = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        throw new Error("No files uploaded");
    }

    // Upload all files to R2
    const uploadPromises = req.files.map((file) =>
        r2UploadService.uploadToR2(
            file.buffer,
            file.originalname,
            file.mimetype,
            "general"
        )
    );

    const results = await Promise.all(uploadPromises);

    res.json(
        new ApiResponse(
            200,
            {
                files: results.map((r) => ({
                    url: r.url,
                    key: r.key,
                    size: r.size,
                })),
            },
            `${results.length} files uploaded successfully`
        )
    );
});

/**
 * Example: Delete file
 * Route: DELETE /api/v1/upload/:fileKey
 */
export const deleteFile = asyncHandler(async (req, res) => {
    const { fileKey } = req.params;

    await r2UploadService.deleteFromR2(fileKey);

    res.json(new ApiResponse(200, {}, "File deleted successfully"));
});

/**
 * Example: Get presigned URL for temporary access
 * Route: GET /api/v1/upload/presigned/:fileKey
 */
export const getPresignedUrl = asyncHandler(async (req, res) => {
    const { fileKey } = req.params;
    const expiresIn = parseInt(req.query.expiresIn) || 3600; // Default 1 hour

    const presignedUrl = await r2UploadService.getPresignedUrl(fileKey, expiresIn);

    res.json(
        new ApiResponse(
            200,
            {
                presignedUrl,
                expiresIn,
            },
            "Presigned URL generated successfully"
        )
    );
});

// EXAMPLE ROUTE DEFINITION
// src/routes/upload.routes.js
/*
import express from 'express';
import { uploadSingle, uploadMultiple } from '../middleware/r2-upload.middleware.js';
import * as uploadController from '../controllers/upload.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Upload profile picture
router.post(
  '/profile-picture',
  auth,
  uploadSingle('avatar'),
  uploadController.uploadProfilePicture
);

// Upload KYC document
router.post(
  '/kyc-document',
  auth,
  uploadSingle('document'),
  uploadController.uploadKYCDocument
);

// Upload payment proof
router.post(
  '/payment-proof',
  auth,
  uploadSingle('proof'),
  uploadController.uploadPaymentProof
);

// Upload multiple files
router.post(
  '/multiple',
  auth,
  uploadMultiple('files', 5),
  uploadController.uploadMultipleFiles
);

// Delete file
router.delete('/:fileKey', auth, uploadController.deleteFile);

// Get presigned URL
router.get('/presigned/:fileKey', auth, uploadController.getPresignedUrl);

export default router;
*/
