// src/middleware/r2-upload.middleware.js
import multer from "multer";
import { r2Config } from "../config/r2.config.js";

/**
 * Multer configuration for R2 uploads
 * Using memory storage to get buffer for R2 upload
 */

// Memory storage - stores files as Buffer in memory
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    // Check if file type is allowed
    if (r2Config.allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `Invalid file type: ${file.mimetype}. Allowed types: ${r2Config.allowedFileTypes.join(", ")}`
            ),
            false
        );
    }
};

// Multer upload configuration
export const r2Upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: r2Config.maxFileSize, // 10MB
    },
});

/**
 * Middleware for single file upload
 * @param {string} fieldName - Form field name
 */
export const uploadSingle = (fieldName) => {
    return r2Upload.single(fieldName);
};

/**
 * Middleware for multiple files upload
 * @param {string} fieldName - Form field name
 * @param {number} maxCount - Maximum number of files
 */
export const uploadMultiple = (fieldName, maxCount = 5) => {
    return r2Upload.array(fieldName, maxCount);
};

/**
 * Middleware for multiple fields with files
 * @param {Array} fields - Array of field configurations
 * Example: [{ name: 'avatar', maxCount: 1 }, { name: 'documents', maxCount: 3 }]
 */
export const uploadFields = (fields) => {
    return r2Upload.fields(fields);
};

export default {
    r2Upload,
    uploadSingle,
    uploadMultiple,
    uploadFields,
};
