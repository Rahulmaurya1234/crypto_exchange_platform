// src/config/r2.config.js
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

/**
 * Cloudflare R2 Storage Configuration
 * R2 is S3-compatible, so we use AWS SDK with custom endpoint
 */

// R2 endpoint URL format: https://<account_id>.r2.cloudflarestorage.com
const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Initialize R2 Client (S3-compatible)
export const r2Client = new S3Client({
    region: "auto", // R2 uses 'auto' for region
    endpoint: R2_ENDPOINT,
    forcePathStyle: true, // Required for R2
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// R2 Configuration
export const r2Config = {
    bucket: process.env.R2_BUCKET_NAME || "cryptians",
    publicUrl: process.env.R2_PUBLIC_URL,
    endpoint: R2_ENDPOINT,
    accountId: process.env.R2_ACCOUNT_ID,

    // File upload settings
    allowedFileTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"],
    maxFileSize: 10 * 1024 * 1024, // 10MB

    // Folder structure
    folders: {
        kyc: "kyc-documents",
        paymentProofs: "payment-proofs",
        profilePictures: "profile-pictures",
        listings: "listings",
        general: "uploads",
    },
};

/**
 * Generate public URL for uploaded file
 * @param {string} key - File key/path in R2 bucket
 * @returns {string} Public URL
 */
export const getR2PublicUrl = (key) => {
    return `${r2Config.publicUrl}/${key}`;
};

/**
 * Generate file key with folder structure
 * @param {string} folder - Folder name (kyc, paymentProofs, etc.)
 * @param {string} filename - Original filename
 * @returns {string} File key
 */
export const generateR2FileKey = (folder, filename) => {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `${folder}/${timestamp}-${sanitizedFilename}`;
};

/**
 * Validate file type
 * @param {string} mimetype - File mimetype
 * @returns {boolean} Is valid
 */
export const isValidFileType = (mimetype) => {
    return r2Config.allowedFileTypes.includes(mimetype);
};

/**
 * Validate file size
 * @param {number} size - File size in bytes
 * @returns {boolean} Is valid
 */
export const isValidFileSize = (size) => {
    return size <= r2Config.maxFileSize;
};

export default {
    r2Client,
    r2Config,
    getR2PublicUrl,
    generateR2FileKey,
    isValidFileType,
    isValidFileSize,
};
