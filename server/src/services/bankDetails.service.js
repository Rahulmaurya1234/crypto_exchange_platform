// src/services/bankDetails.service.js
import User from "../models/User.model.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { logger } from "../utils/logger.js";

/**
 * Encrypt bank details before saving
 * @param {object} bankDetails - Bank details object
 * @returns {object} - Encrypted bank details
 */
export const encryptBankDetails = (bankDetails) => {
    if (!bankDetails) return null;

    const encrypted = { ...bankDetails };

    // Encrypt sensitive fields
    if (bankDetails.accountNumber) {
        encrypted.accountNumber = encrypt(bankDetails.accountNumber);
    }

    if (bankDetails.ifscCode) {
        encrypted.ifscCode = encrypt(bankDetails.ifscCode);
    }

    if (bankDetails.upiId) {
        encrypted.upiId = encrypt(bankDetails.upiId);
    }

    // Keep non-sensitive fields as is
    encrypted.accountHolderName = bankDetails.accountHolderName;
    encrypted.bankName = bankDetails.bankName;
    encrypted.isVerified = bankDetails.isVerified || false;

    return encrypted;
};

/**
 * Decrypt bank details when fetching
 * @param {object} bankDetails - Encrypted bank details object
 * @returns {object} - Decrypted bank details
 */
export const decryptBankDetails = (bankDetails) => {
    if (!bankDetails) return null;

    const decrypted = { ...bankDetails };

    // Decrypt sensitive fields individually
    if (bankDetails.accountNumber) {
        try {
            const decryptedValue = decrypt(bankDetails.accountNumber);
            // decrypt() returns original data if not encrypted, or null if invalid
            decrypted.accountNumber = decryptedValue || bankDetails.accountNumber;
        } catch (error) {
            logger.error("Failed to decrypt accountNumber", error);
            // Keep original value if decryption fails
            decrypted.accountNumber = bankDetails.accountNumber;
        }
    }

    if (bankDetails.ifscCode) {
        try {
            const decryptedValue = decrypt(bankDetails.ifscCode);
            decrypted.ifscCode = decryptedValue || bankDetails.ifscCode;
        } catch (error) {
            logger.error("Failed to decrypt ifscCode", error);
            decrypted.ifscCode = bankDetails.ifscCode;
        }
    }

    if (bankDetails.upiId) {
        try {
            const decryptedValue = decrypt(bankDetails.upiId);
            decrypted.upiId = decryptedValue || bankDetails.upiId;
        } catch (error) {
            logger.error("Failed to decrypt upiId", error);
            decrypted.upiId = bankDetails.upiId;
        }
    }

    return decrypted;
};

/**
 * Update user bank details with encryption
 * @param {string} userId - User ID
 * @param {object} bankDetails - Bank details to save
 * @returns {object} - Updated user with decrypted bank details
 */
export const updateUserBankDetails = async (userId, bankDetails) => {
    try {
        // Encrypt before saving
        const encryptedBankDetails = encryptBankDetails(bankDetails);

        const user = await User.findByIdAndUpdate(
            userId,
            { bankDetails: encryptedBankDetails },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return null;
        }

        // Decrypt before returning
        const userObj = user.toObject();
        if (userObj.bankDetails) {
            userObj.bankDetails = decryptBankDetails(userObj.bankDetails);
        }

        logger.info("Bank details updated", { userId });

        return userObj;
    } catch (error) {
        logger.error("Error updating bank details:", error);
        throw error;
    }
};

/**
 * Get user with decrypted bank details
 * @param {string} userId - User ID
 * @returns {object} - User with decrypted bank details
 */
export const getUserWithBankDetails = async (userId) => {
    try {
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return null;
        }

        const userObj = user.toObject();

        // Decrypt bank details before returning
        if (userObj.bankDetails) {
            userObj.bankDetails = decryptBankDetails(userObj.bankDetails);
        }

        return userObj;
    } catch (error) {
        logger.error("Error fetching user with bank details:", error);
        throw error;
    }
};

export default {
    encryptBankDetails,
    decryptBankDetails,
    updateUserBankDetails,
    getUserWithBankDetails,
};
