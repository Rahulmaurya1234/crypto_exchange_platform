// src/services/r2-upload.service.js
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    r2Client,
    r2Config,
    getR2PublicUrl,
    generateR2FileKey,
    isValidFileType,
    isValidFileSize
} from "../config/r2.config.js";
import { logger } from "../utils/logger.js";

/**
 * Upload file to Cloudflare R2
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - File mimetype
 * @param {string} folder - Folder category (kyc, paymentProofs, etc.)
 * @returns {Promise<{url: string, key: string}>}
 */
export const uploadToR2 = async (fileBuffer, filename, mimetype, folder = "general") => {
    try {
        // Validate file type
        if (!isValidFileType(mimetype)) {
            throw new Error(`Invalid file type: ${mimetype}. Allowed types: ${r2Config.allowedFileTypes.join(", ")}`);
        }

        // Validate file size
        if (!isValidFileSize(fileBuffer.length)) {
            throw new Error(`File size exceeds maximum limit of ${r2Config.maxFileSize / (1024 * 1024)}MB`);
        }

        // Get folder path from config
        const folderPath = r2Config.folders[folder] || r2Config.folders.general;

        // Generate unique file key
        const fileKey = generateR2FileKey(folderPath, filename);

        // Upload to R2
        const command = new PutObjectCommand({
            Bucket: r2Config.bucket,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: mimetype,
            // Optional: Add metadata
            Metadata: {
                originalName: filename,
                uploadedAt: new Date().toISOString(),
            },
        });

        await r2Client.send(command);

        // Generate public URL
        const publicUrl = getR2PublicUrl(fileKey);

        logger.info("File uploaded to R2", { fileKey, publicUrl, folder });

        return {
            url: publicUrl,
            key: fileKey,
            bucket: r2Config.bucket,
            mimetype,
            size: fileBuffer.length,
        };
    } catch (error) {
        logger.error("Error uploading to R2:", error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
};

/**
 * Delete file from R2
 * @param {string} fileKey - File key to delete
 * @returns {Promise<boolean>}
 */
export const deleteFromR2 = async (fileKey) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: r2Config.bucket,
            Key: fileKey,
        });

        await r2Client.send(command);

        logger.info("File deleted from R2", { fileKey });
        return true;
    } catch (error) {
        logger.error("Error deleting from R2:", error);
        throw new Error(`Failed to delete file: ${error.message}`);
    }
};

/**
 * Generate presigned URL for temporary access
 * @param {string} fileKey - File key
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>}
 */
export const getPresignedUrl = async (fileKey, expiresIn = 3600) => {
    try {
        const command = new GetObjectCommand({
            Bucket: r2Config.bucket,
            Key: fileKey,
        });

        const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn });

        logger.info("Presigned URL generated", { fileKey, expiresIn });
        return presignedUrl;
    } catch (error) {
        logger.error("Error generating presigned URL:", error);
        throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
};

/**
 * Upload KYC document
 * @param {Buffer} fileBuffer - Document buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - File mimetype
 * @returns {Promise<{url: string, key: string}>}
 */
export const uploadKYCDocument = async (fileBuffer, filename, mimetype) => {
    return uploadToR2(fileBuffer, filename, mimetype, "kyc");
};

/**
 * Upload payment proof
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - File mimetype
 * @returns {Promise<{url: string, key: string}>}
 */
export const uploadPaymentProof = async (fileBuffer, filename, mimetype) => {
    return uploadToR2(fileBuffer, filename, mimetype, "paymentProofs");
};

/**
 * Upload profile picture
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - File mimetype
 * @returns {Promise<{url: string, key: string}>}
 */
export const uploadProfilePicture = async (fileBuffer, filename, mimetype) => {
    return uploadToR2(fileBuffer, filename, mimetype, "profilePictures");
};

/**
 * Upload listing image
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - File mimetype
 * @returns {Promise<{url: string, key: string}>}
 */
export const uploadListingImage = async (fileBuffer, filename, mimetype) => {
    return uploadToR2(fileBuffer, filename, mimetype, "listings");
};

export default {
    uploadToR2,
    deleteFromR2,
    getPresignedUrl,
    uploadKYCDocument,
    uploadPaymentProof,
    uploadProfilePicture,
    uploadListingImage,
};
