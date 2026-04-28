// src/utils/encryption.js
import crypto from "crypto";

/**
 * Encryption utility for sensitive data (Aadhaar, PAN, Bank Details)
 * Uses AES-256-GCM encryption
 */

// Get encryption key from environment or generate a secure one
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const AUTH_TAG_LENGTH = 16; // For GCM mode


// Ensure the key is 32 bytes for AES-256
const getKey = () => {
    const key = Buffer.from(ENCRYPTION_KEY, "hex");
    if (key.length !== 32) {
        throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex characters)");
    }
    console.log("🔑 Key Info:");
    console.log("  - Hex length:", ENCRYPTION_KEY.length);
    console.log("  - Buffer length:", key.length);
    console.log("  - Buffer:", key.toString("hex"));
    return key;
};

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: iv:authTag:encrypted
 */
export const encrypt = (text) => {
    if (!text || typeof text !== "string") {
        return null;
    }

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");

        const authTag = cipher.getAuthTag();

        // Return format: iv:authTag:encrypted
        return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Failed to encrypt data");
    }
};

/**
 * Check if data is encrypted (has the format: iv:authTag:encrypted)
 * @param {string} data - Data to check
 * @returns {boolean} - True if data appears to be encrypted
 */
export const isEncrypted = (data) => {
    if (!data || typeof data !== "string") {
        return false;
    }

    // Check if data has the encrypted format: iv:authTag:encrypted
    const parts = data.split(":");
    if (parts.length !== 3) {
        return false;
    }

    // Check if parts look like hex strings (iv and authTag should be 32 chars each)
    const ivPart = parts[0];
    const authTagPart = parts[1];

    // IV should be 32 hex chars (16 bytes)
    // AuthTag should be 32 hex chars (16 bytes)
    const hexPattern = /^[0-9a-f]+$/i;

    return (
        ivPart.length === 32 &&
        authTagPart.length === 32 &&
        hexPattern.test(ivPart) &&
        hexPattern.test(authTagPart)
    );
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Encrypted text in format: iv:authTag:encrypted
 * @returns {string} - Decrypted plain text or original data if not encrypted
 */
export const decrypt = (encryptedData) => {
    if (!encryptedData || typeof encryptedData !== "string") {
        return null;
    }

    // If data is not encrypted (legacy data), return as-is
    if (!isEncrypted(encryptedData)) {
        console.warn("Data is not encrypted, returning as-is:", encryptedData.substring(0, 10) + "...");
        return encryptedData;
    }

    try {
        const parts = encryptedData.split(":");
        const iv = Buffer.from(parts[0], "hex");
        const authTag = Buffer.from(parts[1], "hex");
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("Decryption error:", error.message);
        // If decryption fails, return the original data (likely not encrypted)
        console.warn("Decryption failed, returning original data");
        return encryptedData;
    }
};

/**
 * Encrypt object fields
 * @param {object} obj - Object with fields to encrypt
 * @param {array} fieldsToEncrypt - Array of field names to encrypt
 * @returns {object} - Object with encrypted fields
 */
export const encryptFields = (obj, fieldsToEncrypt) => {
    if (!obj || typeof obj !== "object") {
        return obj;
    }

    const encrypted = { ...obj };

    fieldsToEncrypt.forEach((field) => {
        if (encrypted[field]) {
            encrypted[field] = encrypt(encrypted[field].toString());
        }
    });

    return encrypted;
};

/**
 * Decrypt object fields
 * @param {object} obj - Object with encrypted fields
 * @param {array} fieldsToDecrypt - Array of field names to decrypt
 * @returns {object} - Object with decrypted fields
 */
export const decryptFields = (obj, fieldsToDecrypt) => {
    if (!obj || typeof obj !== "object") {
        return obj;
    }

    const decrypted = { ...obj };

    fieldsToDecrypt.forEach((field) => {
        if (decrypted[field]) {
            try {
                decrypted[field] = decrypt(decrypted[field]);
            } catch (error) {
                console.error(`Failed to decrypt field: ${field}`, error);
                decrypted[field] = null;
            }
        }
    });

    return decrypted;
};

/**
 * Hash data (one-way, for verification only)
 * @param {string} text - Text to hash
 * @returns {string} - Hashed text
 */
export const hash = (text) => {
    if (!text) return null;
    return crypto.createHash("sha256").update(text).digest("hex");
};

/**
 * Mask sensitive data for display (e.g., Aadhaar: XXXX-XXXX-1234)
 * @param {string} text - Text to mask
 * @param {number} visibleChars - Number of characters to show at the end
 * @returns {string} - Masked text
 */
export const maskSensitiveData = (text, visibleChars = 4) => {
    if (!text || typeof text !== "string") {
        return "";
    }

    if (text.length <= visibleChars) {
        return text;
    }

    const masked = "X".repeat(text.length - visibleChars);
    const visible = text.slice(-visibleChars);

    return masked + visible;
};

/**
 * Mask Aadhaar number (XXXX-XXXX-1234)
 * @param {string} aadhaar - Aadhaar number
 * @returns {string} - Masked Aadhaar
 */
export const maskAadhaar = (aadhaar) => {
    if (!aadhaar) return "";
    const cleaned = aadhaar.replace(/\D/g, "");
    if (cleaned.length !== 12) return aadhaar;

    return `XXXX-XXXX-${cleaned.slice(-4)}`;
};

/**
 * Mask PAN card (ABCDE****F)
 * @param {string} pan - PAN card number
 * @returns {string} - Masked PAN
 */
export const maskPAN = (pan) => {
    if (!pan || pan.length !== 10) return pan;
    return `${pan.slice(0, 5)}****${pan.slice(-1)}`;
};

/**
 * Mask bank account number (XXXXXXXX1234)
 * @param {string} accountNumber - Bank account number
 * @returns {string} - Masked account number
 */
export const maskBankAccount = (accountNumber) => {
    if (!accountNumber) return "";
    return maskSensitiveData(accountNumber, 4);
};

/**
 * Generate encryption key (for initial setup)
 * Run this once and save to .env as ENCRYPTION_KEY
 */
export const generateEncryptionKey = () => {
    return crypto.randomBytes(32).toString("hex");
};

export default {
    encrypt,
    decrypt,
    isEncrypted,
    encryptFields,
    decryptFields,
    hash,
    maskSensitiveData,
    maskAadhaar,
    maskPAN,
    maskBankAccount,
    generateEncryptionKey,
};
