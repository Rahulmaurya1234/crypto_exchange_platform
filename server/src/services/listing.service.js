// src/services/listing.service.js
import Listing from "../models/Listing.model.js";
import User from "../models/User.model.js";
import InstantSellerDeposit from "../models/InstantSellerDeposit.model.js";
import { LISTING_STATUS, DEPOSIT_STATUS } from "../constants/statuses.js";
import { logger } from "../utils/logger.js";
import { calculateInstantSellerDepositFees } from "./fee-calculator.service.js";
import {
  sendDepositCreatedNotification,
  sendDepositApprovedNotification,
  sendDepositRejectedNotification,
} from "./notification.service.js";

/**
 * Create listing
 */
export const createListing = async (sellerId, listingData) => {
  try {
    // Check if user can create listing
    const user = await User.findById(sellerId);
    if (!user) {
      throw new Error("User cannot create listing");
    }
    // Check if user's KYC is approved
    if (user.kycStatus !== "approved") {
      throw new Error(
        "KYC verification required. Your KYC status must be approved to create listings"
      );
    }
    const listing = new Listing({
      sellerId,
      cryptoType: listingData.cryptoType || "USDT",
      availableAmount: listingData.availableAmount,
      originalAmount: listingData.availableAmount,
      pricePerUnit: listingData.pricePerUnit,
      priceType: listingData.priceType || "fixed",
      marketPlusPercentage: listingData.marketPlusPercentage || 0,
      minTradeLimit: listingData.minTradeLimit,
      maxTradeLimit: listingData.maxTradeLimit,
      paymentMethods: listingData.paymentMethods,
      timeLimit: listingData.timeLimit || 30,
      terms: listingData.terms,
      instructions: listingData.instructions,
      autoReplyMessage: listingData.autoReplyMessage,
      isInstantSeller: user.isInstantSeller || false,
      createdBy: "RegularSeller",
      expiresAt: listingData.expiresAt,
    });

    await listing.save();

    logger.info("Listing created", { listingId: listing._id, sellerId });

    return listing;
  } catch (error) {
    logger.error("Error creating listing:", error);
    throw error;
  }
};

/**
 * Get listing by ID
 */
export const getListingById = async (listingId) => {
  return await Listing.findById(listingId).populate(
    "sellerId",
    "name avatar averageRating totalReviews isInstantSeller"
  );
};

/**
 * Get seller's listings
 */
export const getSellerListings = async (sellerId, filters = {}) => {
  const { page = 1, limit = 20, status } = filters;

  const query = { sellerId };

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [listings, total] = await Promise.all([
    Listing.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Listing.countDocuments(query),
  ]);

  return {
    listings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Search listings
 */
export const searchListings = async (filters = {}) => {
  const {
    page = 1,
    limit = 20,
    cryptoType,
    minAmount,
    maxAmount,
    minPrice,
    maxPrice,
    paymentMethod,
    isInstantSeller,
  } = filters;

  const query = { status: LISTING_STATUS.ACTIVE };

  if (cryptoType) {
    query.cryptoType = cryptoType;
  }

  if (minAmount) {
    query.availableAmount = { $gte: minAmount };
  }

  if (maxAmount) {
    query.availableAmount = query.availableAmount
      ? { ...query.availableAmount, $lte: maxAmount }
      : { $lte: maxAmount };
  }

  if (minPrice) {
    query.pricePerUnit = { $gte: minPrice };
  }

  if (maxPrice) {
    query.pricePerUnit = query.pricePerUnit
      ? { ...query.pricePerUnit, $lte: maxPrice }
      : { $lte: maxPrice };
  }

  if (paymentMethod) {
    query.paymentMethods = paymentMethod;
  }

  if (isInstantSeller !== undefined) {
    query.isInstantSeller =
      isInstantSeller === "true" || isInstantSeller === true;
  }

  const skip = (page - 1) * limit;

  const [listings, total] = await Promise.all([
    Listing.find(query)
      .populate(
        "sellerId",
        "name avatar averageRating totalReviews isInstantSeller completionRate"
      )
      .sort({ isInstantSeller: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Listing.countDocuments(query),
  ]);

  return {
    listings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update listing
 */
export const updateListing = async (listingId, sellerId, updateData) => {
  try {
    const listing = await Listing.findOne({ _id: listingId, sellerId });

    if (!listing) {
      return null;
    }

    // Only allow updates if listing is active or paused
    if (
      ![LISTING_STATUS.ACTIVE, LISTING_STATUS.PAUSED].includes(listing.status)
    ) {
      throw new Error("Cannot update listing in current status");
    }

    // Update allowed fields
    const allowedFields = [
      "pricePerUnit",
      "marketPlusPercentage",
      "minTradeLimit",
      "maxTradeLimit",
      "paymentMethods",
      "timeLimit",
      "terms",
      "instructions",
      "autoReplyMessage",
      "isAvailable",
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        listing[field] = updateData[field];
      }
    });

    await listing.save();

    logger.info("Listing updated", { listingId, sellerId });

    return listing;
  } catch (error) {
    logger.error("Error updating listing:", error);
    throw error;
  }
};

/**
 * Delete listing
 */
export const deleteListing = async (listingId, sellerId) => {
  try {
    const listing = await Listing.findOne({ _id: listingId, sellerId });

    if (!listing) {
      return null;
    }

    // Soft delete by marking as deleted
    listing.status = LISTING_STATUS.DELETED;
    listing.deletedAt = new Date();
    await listing.save();

    logger.info("Listing deleted", { listingId, sellerId });

    return listing;
  } catch (error) {
    logger.error("Error deleting listing:", error);
    throw error;
  }
};

/**
 * Pause listing
 */
export const pauseListing = async (listingId, sellerId) => {
  const listing = await Listing.findOne({ _id: listingId, sellerId });

  if (!listing) {
    return null;
  }

  listing.status = LISTING_STATUS.PAUSED;
  await listing.save();

  return listing;
};

/**
 * Resume listing
 */
export const resumeListing = async (listingId, sellerId) => {
  const listing = await Listing.findOne({ _id: listingId, sellerId });

  if (!listing) {
    return null;
  }

  listing.status = LISTING_STATUS.ACTIVE;
  await listing.save();

  return listing;
};

/**
 * Decrease available amount after trade
 */
// export const decreaseAvailableAmount = async (listingId, amount) => {
//     const listing = await Listing.findById(listingId);

//     if (!listing) {
//         return null;
//     }

//     listing.availableAmount -= amount;

//     if (listing.availableAmount <= 0) {
//         listing.status = LISTING_STATUS.COMPLETED;
//         listing.availableAmount = 0;
//     }

//     await listing.save();

//     return listing;
// };

// ==================== INSTANT SELLER FUNCTIONS ====================

/**
 * Calculate instant seller deposit
 */
export const calculateDepositAmount = async (amount, network = "ethereum") => {
  try {
    const calculation = await calculateInstantSellerDepositFees(
      amount,
      network
    );
    return calculation;
  } catch (error) {
    logger.error("Error calculating deposit amount:", error);
    throw error;
  }
};

/**
 * Create instant seller listing
 */
// export const createInstantSellerListing = async (
//   sellerId,
//   listingData,
//   depositData
// ) => {
//   try {
//     const user = await User.findById(sellerId);
//     if (!user) {
//       throw new Error("User not found");
//     }

//     // Check for duplicate transaction hash
//     const existingDeposit = await InstantSellerDeposit.findByTransactionHash(
//       depositData.transactionHash
//     );
//     if (existingDeposit) {
//       throw new Error("Transaction hash already used");
//     }

//     // Create listing with PENDING status
//     const listing = new Listing({
//       sellerId,
//       cryptoType: listingData.cryptoType || "USDT",
//       availableAmount: listingData.availableAmount,
//       originalAmount: listingData.availableAmount,
//       pricePerUnit: listingData.pricePerUnit,
//       priceType: listingData.priceType || "fixed",
//       marketPlusPercentage: listingData.marketPlusPercentage || 0,
//       minTradeLimit: listingData.minTradeLimit,
//       maxTradeLimit: listingData.maxTradeLimit,
//       paymentMethods: listingData.paymentMethods,
//       timeLimit: listingData.timeLimit || 30,
//       terms: listingData.terms,
//       instructions: listingData.instructions,
//       autoReplyMessage: listingData.autoReplyMessage,
//       expiresAt: listingData.expiresAt,

//       // Instant seller specific
//       isInstantSeller: true,
//       createdBy: "InstantSeller",
//       status: LISTING_STATUS.PENDING,
//       depositVerified: false,

//       // Deposit details
//       escrowTransactionHash: depositData.transactionHash,
//       depositAmount: depositData.totalDepositAmount,
//       originalDepositAmount: depositData.originalAmount,
//       platformFeeUSDT: depositData.platformFeeUSDT,
//       gasFeeUSDT: depositData.gasFeeUSDT,
//     });

//     await listing.save();

//     // Create deposit record
//     const deposit = new InstantSellerDeposit({
//       sellerId,
//       listingId: listing._id,
//       originalAmount: depositData.originalAmount,
//       platformFeeUSDT: depositData.platformFeeUSDT,
//       gasFeeUSDT: depositData.gasFeeUSDT,
//       totalDepositAmount: depositData.totalDepositAmount,
//       transactionHash: depositData.transactionHash,
//       blockchainNetwork: depositData.network || "ethereum",
//       gasFeeCalculation: depositData.gasFeeCalculation,
//       status: DEPOSIT_STATUS.PENDING,
//       ipAddress: depositData.ipAddress,
//       userAgent: depositData.userAgent,
//     });

//     await deposit.save();

//     // Send notifications
//     await sendDepositCreatedNotification(deposit, user);

//     logger.info("Instant seller listing created", {
//       listingId: listing._id,
//       depositId: deposit._id,
//     });

//     return { listing, deposit };
//   } catch (error) {
//     logger.error("Error creating instant seller listing:", error);
//     throw error;
//   }
// };
export const createInstantSellerListing = async (
  sellerId,
  listingData,
  depositData
) => {
  try {
    const user = await User.findById(sellerId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check for duplicate transaction hash
    const existingDeposit = await InstantSellerDeposit.findByTransactionHash(
      depositData.transactionHash
    );
    if (existingDeposit) {
      throw new Error("Transaction hash already used");
    }

    // ✅ BACKEND CALCULATES FEES AUTOMATICALLY
    const originalAmount = depositData.originalAmount || listingData.availableAmount;

    // Platform fee: 5%
    const platformFeePercent = 5;
    const platformFeeUSDT = (originalAmount * platformFeePercent) / 100;

    // Gas fee: Fixed or dynamic (you can make this configurable)
    const gasFeeUSDT = 0.5; // Example: $0.50 gas fee

    // Total deposit = original + fees
    const totalDepositAmount = originalAmount + platformFeeUSDT + gasFeeUSDT;
    const totalFees = platformFeeUSDT + gasFeeUSDT;

    // ✅ Gas fee calculation object (optional, for reference)
    const gasFeeCalculation = {
      estimatedGasPrice: "20 gwei",
      estimatedGasLimit: 21000,
      networkFee: gasFeeUSDT,
      network: depositData.network || "ethereum",
    };

    // Create listing with PENDING status
    const listing = new Listing({
      sellerId,
      cryptoType: listingData.cryptoType || "USDT",
      availableAmount: listingData.availableAmount,
      originalAmount: listingData.availableAmount,
      pricePerUnit: listingData.pricePerUnit,
      priceType: listingData.priceType || "fixed",
      marketPlusPercentage: listingData.marketPlusPercentage || 0,
      minTradeLimit: listingData.minTradeLimit,
      maxTradeLimit: listingData.maxTradeLimit,
      paymentMethods: listingData.paymentMethods,
      timeLimit: listingData.timeLimit || 30,
      terms: listingData.terms,
      instructions: listingData.instructions,
      autoReplyMessage: listingData.autoReplyMessage,
      expiresAt: listingData.expiresAt,

      // Instant seller specific
      isInstantSeller: true,
      createdBy: "InstantSeller",
      status: LISTING_STATUS.PENDING,
      depositVerified: false,

      // ✅ Use backend-calculated values
      escrowTransactionHash: depositData.transactionHash,
      depositAmount: totalDepositAmount,
      originalDepositAmount: originalAmount,
      platformFeeUSDT: platformFeeUSDT,
      gasFeeUSDT: gasFeeUSDT,
    });

    await listing.save();

    // Create deposit record with calculated fees
    const deposit = new InstantSellerDeposit({
      sellerId,
      listingId: listing._id,

      // ✅ Backend-calculated values
      originalAmount: originalAmount,
      platformFeeUSDT: platformFeeUSDT,
      gasFeeUSDT: gasFeeUSDT,
      totalFees: totalFees,
      totalDepositAmount: totalDepositAmount,

      transactionHash: depositData.transactionHash,
      blockchainNetwork: depositData.network || "ethereum",
      gasFeeCalculation: gasFeeCalculation,
      status: DEPOSIT_STATUS.PENDING,
      ipAddress: depositData.ipAddress,
      userAgent: depositData.userAgent,

      // ✅ Set expiry (24 hours from now)
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await deposit.save();

    // Send notifications
    await sendDepositCreatedNotification(deposit, user, listing);

    logger.info("Instant seller listing created with auto-calculated fees", {
      listingId: listing._id,
      depositId: deposit._id,
      originalAmount,
      platformFeeUSDT,
      gasFeeUSDT,
      totalDepositAmount,
    });

    return { listing, deposit };
  } catch (error) {
    logger.error("Error creating instant seller listing:", error);
    throw error;
  }
};
/**
 * Admin approve instant seller deposit
 */
export const approveInstantSellerDeposit = async (
  listingId,
  adminId,
  notes = ""
) => {
  try {
    const listing = await Listing.findById(listingId).populate("sellerId");
    if (!listing) {
      throw new Error("Listing not found");
    }

    if (listing.status !== LISTING_STATUS.PENDING) {
      throw new Error("Listing is not pending approval");
    }

    const deposit = await InstantSellerDeposit.findOne({ listingId });
    if (!deposit) {
      throw new Error("Deposit record not found");
    }

    if (!deposit.canBeVerified()) {
      throw new Error(
        "Deposit cannot be verified (expired or already processed)"
      );
    }

    // Update user to instant seller
    const user = await User.findById(listing.sellerId._id);

    // Add original amount to balance (not including fees)
    user.escrowDepositAmount += listing.originalDepositAmount;
    user.isInstantSeller = true;
    user.instantSellerApprovedAt = new Date();

    // Add instant seller badge if not already present
    const hasBadge = user.badges.some((b) => b.type === "instant_seller");
    if (!hasBadge) {
      user.badges.push({
        type: "instant_seller",
        earnedAt: new Date(),
      });
    }

    await user.save();

    // Update listing
    listing.status = LISTING_STATUS.ACTIVE;
    listing.depositVerified = true;
    listing.verifiedBy = adminId;
    listing.verifiedAt = new Date();
    listing.isInstantListing = true;
    await listing.save();

    // Update deposit
    await deposit.approve(adminId, notes);

    // Send notifications
    await sendDepositApprovedNotification(deposit, user);

    logger.info("Instant seller deposit approved", {
      listingId,
      depositId: deposit._id,
      userId: user._id,
    });

    return { listing, deposit, user };
  } catch (error) {
    logger.error("Error approving instant seller deposit:", error);
    throw error;
  }
};

/**
 * Admin reject instant seller deposit
 */
export const rejectInstantSellerDeposit = async (
  listingId,
  adminId,
  rejectionReason,
  canResubmit = true
) => {
  try {
    const listing = await Listing.findById(listingId).populate("sellerId");
    if (!listing) {
      throw new Error("Listing not found");
    }

    if (listing.status !== LISTING_STATUS.PENDING) {
      throw new Error("Listing is not pending approval");
    }

    const deposit = await InstantSellerDeposit.findOne({ listingId });
    if (!deposit) {
      throw new Error("Deposit record not found");
    }

    // Update listing
    listing.status = LISTING_STATUS.REJECTED;
    listing.suspensionReason = rejectionReason;
    await listing.save();

    // Update deposit
    await deposit.reject(adminId, rejectionReason, canResubmit);

    // Send notifications
    const user = await User.findById(listing.sellerId._id);
    await sendDepositRejectedNotification(deposit, user);

    logger.info("Instant seller deposit rejected", {
      listingId,
      depositId: deposit._id,
      reason: rejectionReason,
    });

    return { listing, deposit };
  } catch (error) {
    logger.error("Error rejecting instant seller deposit:", error);
    throw error;
  }
};

/**
 * Resubmit rejected instant seller listing
 */
export const resubmitInstantSellerListing = async (
  listingId,
  sellerId,
  newTransactionHash,
  comments = ""
) => {
  try {
    const listing = await Listing.findOne({ _id: listingId, sellerId });
    if (!listing) {
      throw new Error("Listing not found or you don't have permission");
    }

    if (listing.status !== LISTING_STATUS.REJECTED) {
      throw new Error("Only rejected listings can be resubmitted");
    }

    const deposit = await InstantSellerDeposit.findOne({ listingId });
    if (!deposit) {
      throw new Error("Deposit record not found");
    }

    if (!deposit.canResubmit) {
      throw new Error(
        "This listing cannot be resubmitted. Please contact support."
      );
    }

    // Check for duplicate transaction hash
    const existingDeposit =
      await InstantSellerDeposit.findByTransactionHash(newTransactionHash);
    if (
      existingDeposit &&
      existingDeposit._id.toString() !== deposit._id.toString()
    ) {
      throw new Error("Transaction hash already used");
    }

    // Update listing
    listing.status = LISTING_STATUS.PENDING;
    listing.escrowTransactionHash = newTransactionHash;
    listing.depositVerified = false;
    listing.verifiedBy = null;
    listing.verifiedAt = null;
    await listing.save();

    // Update deposit
    deposit.transactionHash = newTransactionHash;
    deposit.status = DEPOSIT_STATUS.PENDING;
    deposit.depositVerified = false;
    deposit.rejectedBy = null;
    deposit.rejectedAt = null;
    deposit.verificationNotes = comments;
    // Reset expiry
    deposit.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await deposit.save();

    // Send notification
    const user = await User.findById(sellerId);
    await sendDepositCreatedNotification(deposit, user);

    logger.info("Instant seller listing resubmitted", {
      listingId,
      depositId: deposit._id,
    });

    return { listing, deposit };
  } catch (error) {
    logger.error("Error resubmitting instant seller listing:", error);
    throw error;
  }
};

/**
 * Get pending instant seller deposits (Admin)
 */
export const getPendingDeposits = async (filters = {}) => {
  try {
    const deposits = await InstantSellerDeposit.getPendingDeposits(filters);
    return deposits;
  } catch (error) {
    logger.error("Error getting pending deposits:", error);
    throw error;
  }
};

/**
 * Get seller's deposit history
 */
export const getSellerDepositHistory = async (sellerId) => {
  try {
    const deposits = await InstantSellerDeposit.getSellerHistory(sellerId);
    return deposits;
  } catch (error) {
    logger.error("Error getting seller deposit history:", error);
    throw error;
  }
};

export const getAllDeposits = async (filters = {}) => {
  try {
    const deposits = await InstantSellerDeposit.getAllDeposits(filters);
    return deposits;
  } catch (error) {
    logger.error("Error getting all deposits:", error);
    throw error;
  }
};

// ==================== LISTING RESERVATION LOGIC ====================

// 1️⃣ Trade INIT pe amount RESERVE karo
export const reserveAmountForTrade = async (listingId, amount) => {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    throw new Error("Listing not found");
  }

  if (listing.availableAmount < amount) {
    throw new Error("Insufficient available amount in listing");
  }

  listing.availableAmount -= amount;
  listing.reservedAmount += amount;
  listing.tradesCount = (listing.tradesCount || 0) + 1; // Increment total trades count

  await listing.save();
  return listing;
};

// 2️⃣ Trade CANCEL / EXPIRE pe RESERVED amount wapas karo
export const releaseReservedAmount = async (listingId, amount) => {
  const listing = await Listing.findById(listingId);

  if (!listing) return;

  listing.availableAmount += amount;
  listing.reservedAmount -= amount;

  if (listing.reservedAmount < 0) {
    listing.reservedAmount = 0;
  }

  await listing.save();
};

// 3️⃣ Trade COMPLETE hone par FINALIZE karo
export const finalizeTradeAmount = async (listingId, amount) => {
  const listing = await Listing.findById(listingId);

  if (!listing) return;

  listing.reservedAmount -= amount;

  if (listing.reservedAmount < 0) {
    listing.reservedAmount = 0;
  }

  // optional: completed trade count
  listing.completedTradesCount = (listing.completedTradesCount || 0) + 1;

  if (listing.availableAmount === 0 && listing.reservedAmount === 0) {
    listing.status = LISTING_STATUS.COMPLETED;
  }

  await listing.save();
};

export default {
  createListing,
  getListingById,
  getSellerListings,
  searchListings,
  updateListing,
  deleteListing,
  pauseListing,
  resumeListing,
  // decreaseAvailableAmount,

  // Instant seller functions
  calculateDepositAmount,
  createInstantSellerListing,
  approveInstantSellerDeposit,
  rejectInstantSellerDeposit,
  resubmitInstantSellerListing,
  getPendingDeposits,
  getSellerDepositHistory,
  reserveAmountForTrade,
  releaseReservedAmount,
  finalizeTradeAmount,
};
