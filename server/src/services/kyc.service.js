// src/services/kyc.service.js
import KYC from "../models/KYC.model.js";
import User from "../models/User.model.js";
import { KYC_STATUS, KYC_LEVEL } from "../constants/index.js";
import { logger } from "../utils/logger.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import * as adminNotificationService from "./adminNotification.service.js";
import * as notificationService from "./notification.service.js";

/**
 * Encrypt document numbers in documents array
 */
const encryptDocuments = (documents) => {
  return documents.map((doc) => {
    const encryptedDoc = { ...doc };
    // Encrypt document number if it exists
    if (doc.documentNumber) {
      encryptedDoc.documentNumber = encrypt(doc.documentNumber);
    }
    return encryptedDoc;
  });
};

/**
 * Decrypt document numbers in documents array
 */
const decryptDocuments = (documents) => {
  if (!documents || !Array.isArray(documents)) {
    return documents;
  }

  return documents.map((doc) => {
    const decryptedDoc = { ...(doc.toObject?.() || doc) };
    // Decrypt document number if it exists
    if (doc.documentNumber) {
      try {
        const decrypted = decrypt(doc.documentNumber);
        // decrypt() returns original data if not encrypted, or null if invalid
        decryptedDoc.documentNumber = decrypted || doc.documentNumber;
      } catch (error) {
        logger.error("Failed to decrypt document number", error);
        // Keep original value if decryption fails
        decryptedDoc.documentNumber = doc.documentNumber;
      }
    }
    return decryptedDoc;
  });
};

/**
 * Submit KYC
 */
export const submitKYC = async (userId, kycData) => {
  try {
    // Encrypt document numbers before saving
    const encryptedDocuments = encryptDocuments(kycData.documents);

    // Encrypt bank account number
    let bankDetails = null;
    if (kycData.bankDetails) {
      bankDetails = {
        ...kycData.bankDetails,
        accountNumber: kycData.bankDetails.accountNumber
          ? encrypt(kycData.bankDetails.accountNumber)
          : null,
      };
    }

    // Check if KYC already exists
    let kyc = await KYC.findOne({ userId });

    if (kyc) {
      // Update existing KYC
      kyc.fullName = kycData.fullName;
      kyc.dateOfBirth = kycData.dateOfBirth;
      kyc.nationality = kycData.nationality || "Indian";
      kyc.documents = encryptedDocuments;
      kyc.bankDetails = bankDetails;
      kyc.status = KYC_STATUS.SUBMITTED;
      kyc.submittedAt = new Date();
      kyc.lastResubmittedAt = new Date();
      kyc.resubmissionCount += 1;
    } else {
      // Create new KYC
      kyc = new KYC({
        userId,
        fullName: kycData.fullName,
        dateOfBirth: kycData.dateOfBirth,
        nationality: kycData.nationality || "Indian",
        documents: encryptedDocuments,
        bankDetails: bankDetails,
        status: KYC_STATUS.SUBMITTED,
        submittedAt: new Date(),
      });
    }

    await kyc.save();

    // Update user's KYC status
    await User.findByIdAndUpdate(userId, {
      kycStatus: KYC_STATUS.SUBMITTED,
      kycSubmittedAt: new Date(),
    });

    logger.info("KYC submitted", { userId, kycId: kyc._id });

    // Notifications
    try {
      const user = await User.findById(userId).select("name email");
      if (user) {
        // Notify admins
        await adminNotificationService.notifyKYCSubmitted(user, kyc._id);

        // Notify user (new)
        await notificationService.notifyKycSubmitted(userId, kyc._id);
      }
    } catch (notificationError) {
      logger.error("Failed to send notifications for KYC submission", {
        userId,
        kycId: kyc._id,
        error: notificationError.message,
      });
    }

    return kyc;
  } catch (error) {
    logger.error("Error submitting KYC:", error);
    throw error;
  }
};

/**
 * Decrypt bank details
 */
const decryptBankDetails = (bankDetails) => {
  if (!bankDetails) return null;

  const decrypted = { ...bankDetails };

  if (bankDetails.accountNumber) {
    const value = decrypt(bankDetails.accountNumber);

    if (!value) {
      throw new Error("BANK_ACCOUNT_DECRYPTION_FAILED");
    }

    decrypted.accountNumber = value; // 👈 yahi FULL PLAIN VALUE
  }
  console.log("🧪 decryptBankDetails CALLED");
  console.log("Encrypted value:", bankDetails.accountNumber);

  return decrypted;
};

/**
 * Get KYC by user ID
 */
export const getKYCByUserId = async (userId) => {
  const kyc = await KYC.findOne({ userId })
    .populate("userId", "name email mobileNumber avatar")
    .populate("reviewedBy", "name email");

  if (!kyc) return null;

  // Decrypt documents and bank details before returning
  const kycObj = kyc.toObject();
  kycObj.documents = decryptDocuments(kyc.documents);
  kycObj.bankDetails = decryptBankDetails(kyc.bankDetails);

  return kycObj;
};

/**
 * Get KYC by ID
 */
export const getKYCById = async (kycId) => {
  const kyc = await KYC.findById(kycId)
    .populate("userId", "name email mobileNumber avatar")
    .populate("reviewedBy", "name email");

  if (!kyc) return null;

  // Decrypt documents and bank details before returning
  const kycObj = kyc.toObject();
  kycObj.documents = decryptDocuments(kyc.documents);
  kycObj.bankDetails = decryptBankDetails(kyc.bankDetails);

  return kycObj;
};

/**
 * Review KYC (Admin)
 */
export const reviewKYC = async (kycId, reviewData, reviewerId) => {
  try {
    const kyc = await KYC.findById(kycId);
    if (!kyc) {
      return null;
    }

    const { action, level, reason, reviewNotes } = reviewData;

    if (reviewNotes) {
      kyc.reviewNotes = reviewNotes;
    }

    switch (action) {
      case "approve":
        await kyc.approve(reviewerId, level);
        // Update user's KYC status
        await User.findByIdAndUpdate(kyc.userId, {
          kycStatus: KYC_STATUS.APPROVED,
          kycLevel: level,
          kycApprovedAt: new Date(),
          kycReviewedBy: reviewerId,
        });
        break;

      case "reject":
        await kyc.reject(reviewerId, reason);
        // Update user's KYC status
        await User.findByIdAndUpdate(kyc.userId, {
          kycStatus: KYC_STATUS.REJECTED,
          kycRejectedAt: new Date(),
          kycRejectionReason: reason,
          kycReviewedBy: reviewerId,
        });
        break;

      case "request_resubmission":
        await kyc.requestResubmission(reviewerId, reason);
        // Update user's KYC status
        await User.findByIdAndUpdate(kyc.userId, {
          kycStatus: KYC_STATUS.RESUBMIT_REQUIRED,
          kycRejectionReason: reason,
          kycReviewedBy: reviewerId,
        });
        break;
    }

    logger.info("KYC reviewed", { kycId, action, reviewerId });

    // Send notifications for KYC review actions
    try {
      const user = await User.findById(kyc.userId).select("name email");
      const reviewer = await User.findById(reviewerId).select("name");
      if (user && reviewer) {
        if (action === "approve") {
          // Notify Admin history
          await adminNotificationService.notifyKYCApproved(user, kycId, reviewerId, reviewer.name);
          // Notify User (new)
          await notificationService.notifyKycStatus(user._id, "approved", "", kycId);
        } else if (action === "reject" || action === "request_resubmission") {
          const status = action === "reject" ? "rejected" : "resubmit_required";
          // Notify Admin history
          await adminNotificationService.notifyKYCRejected(user, kycId, reviewerId, reviewer.name, reason);
          // Notify User (new)
          await notificationService.notifyKycStatus(user._id, status, reason, kycId);
        }
      }
    } catch (notificationError) {
      logger.error("Failed to send notifications for KYC review", {
        kycId,
        action,
        error: notificationError.message,
      });
    }

    // Decrypt documents and bank details before returning
    const kycObj = kyc.toObject();
    kycObj.documents = decryptDocuments(kyc.documents);
    kycObj.bankDetails = decryptBankDetails(kyc.bankDetails);

    return kycObj;
  } catch (error) {
    logger.error("Error reviewing KYC:", error);
    throw error;
  }
};

/**
 * Get pending KYC submissions (Admin)
 */
export const getPendingKYCs = async (filters = {}) => {
  const { page = 1, limit = 20, status } = filters;

  const query = {};

  if (status) {
    query.status = status;
  } else {
    query.status = { $in: [KYC_STATUS.SUBMITTED, KYC_STATUS.UNDER_REVIEW] };
  }

  const skip = (page - 1) * limit;

  const [kycs, total] = await Promise.all([
    KYC.find(query)
      .populate("userId", "name email mobileNumber avatar")
      .sort({ submittedAt: 1 })
      .skip(skip)
      .limit(limit),
    KYC.countDocuments(query),
  ]);

  // Decrypt documents + bank details for each KYC (ADMIN FULL VIEW)
  const decryptedKYCs = kycs.map((kyc) => {
    const kycObj = kyc.toObject();

    // 🔓 decrypt documents
    kycObj.documents = decryptDocuments(kyc.documents);

    // 🔓 decrypt bank details (ACCOUNT NUMBER FULL PLAIN)
    kycObj.bankDetails = decryptBankDetails(kyc.bankDetails);

    return kycObj;
  });

  return {
    kycs: decryptedKYCs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all KYCs (Admin) with filters
 */
export const getAllKYCs = async (filters = {}) => {
  const { page = 1, limit = 20, status, level, search } = filters;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (level) {
    query.level = level;
  }

  const skip = (page - 1) * limit;

  let kycs, total;

  if (search) {
    // Search by user name, email, or mobile
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    const userIds = users.map((u) => u._id);
    query.userId = { $in: userIds };

    [kycs, total] = await Promise.all([
      KYC.find(query)
        .populate("userId", "name email mobileNumber avatar")
        .populate("reviewedBy", "name email")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      KYC.countDocuments(query),
    ]);
  } else {
    [kycs, total] = await Promise.all([
      KYC.find(query)
        .populate("userId", "name email mobileNumber avatar")
        .populate("reviewedBy", "name email")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      KYC.countDocuments(query),
    ]);
  }

  // Decrypt documents for each KYC
  const decryptedKYCs = kycs.map((kyc) => {
    const kycObj = kyc.toObject();
    kycObj.documents = decryptDocuments(kyc.documents);
    kycObj.bankDetails = decryptBankDetails(kyc.bankDetails);
    return kycObj;
  });

  return {
    kycs: decryptedKYCs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get KYC statistics (Admin)
 */
export const getKYCStats = async () => {
  const stats = await KYC.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const levelStats = await KYC.aggregate([
    {
      $match: { status: KYC_STATUS.APPROVED },
    },
    {
      $group: {
        _id: "$level",
        count: { $sum: 1 },
      },
    },
  ]);

  const formattedStats = {
    total: await KYC.countDocuments(),
    byStatus: {},
    byLevel: {},
  };

  stats.forEach((stat) => {
    formattedStats.byStatus[stat._id] = stat.count;
  });

  levelStats.forEach((stat) => {
    formattedStats.byLevel[stat._id] = stat.count;
  });

  return formattedStats;
};

/**
 * Delete KYC (for testing/development only)
 */
export const deleteKYC = async (kycId) => {
  return await KYC.findByIdAndDelete(kycId);
};

export default {
  submitKYC,
  getKYCByUserId,
  getKYCById,
  reviewKYC,
  getPendingKYCs,
  getAllKYCs,
  getKYCStats,
  deleteKYC,
};
