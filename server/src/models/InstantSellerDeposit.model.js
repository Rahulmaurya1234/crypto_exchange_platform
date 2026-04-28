// src/models/InstantSellerDeposit.model.js
import mongoose from "mongoose";
import { DEPOSIT_STATUS } from "../constants/statuses.js";

const { Schema } = mongoose;

/**
 * Instant Seller Deposit Schema
 * Tracks all deposits made by sellers for instant seller status
 */
const instantSellerDepositSchema = new Schema(
  {
    // Seller Information
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Related Listing
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    // Deposit Details
    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFeeUSDT: {
      type: Number,
      required: false, // ✅ Changed from true
      min: 0,
      default: 0, // ✅ Added default
    },
    gasFeeUSDT: {
      type: Number,
      required: false, // ✅ Changed from true
      min: 0,
      default: 0, // ✅ Added default
    },
    totalDepositAmount: {
      type: Number,
      required: false, // ✅ Changed from true
      min: 0,
      default: 0, // ✅ Added default
    },
    // Blockchain Transaction
    transactionHash: {
      type: String,
      required: true,
      trim: true,
    },
    blockchainNetwork: {
      type: String,
      enum: ["ethereum", "polygon", "bsc", "tron"],
      default: "ethereum",
    },
    fromAddress: {
      type: String,
      trim: true,
    },
    toAddress: {
      type: String,
      trim: true,
    },
    blockNumber: {
      type: Number,
    },
    gasUsed: {
      type: Number,
    },

    // Gas Fee Calculation Details
    gasFeeCalculation: {
      baseGasFee: Number,
      bufferPercentage: Number,
      totalGasFee: Number,
      calculatedAt: Date,
      gasPrice: Number,
      gasLimit: Number,
    },

    // Status & Verification
    status: {
      type: String,
      enum: Object.values(DEPOSIT_STATUS),
      default: DEPOSIT_STATUS.PENDING,
      index: true,
    },
    depositVerified: {
      type: Boolean,
      default: false,
    },

    // Admin Actions
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
    verificationNotes: {
      type: String,
      maxlength: 1000,
    },

    // Rejection Details
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: Date,
    rejectionReason: {
      type: String,
      maxlength: 500,
    },
    canResubmit: {
      type: Boolean,
      default: true,
    },

    // Refund Details
    refundTransactionHash: String,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String,

    // Notifications Sent
    notificationsSent: {
      depositCreated: {
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        sentAt: Date,
      },
      depositApproved: {
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        sentAt: Date,
      },
      depositRejected: {
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        sentAt: Date,
      },
    },

    // Metadata
    ipAddress: String,
    userAgent: String,

    // Expiry (if not verified within time)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================
instantSellerDepositSchema.index({ sellerId: 1, status: 1 });
instantSellerDepositSchema.index({ listingId: 1 });
instantSellerDepositSchema.index({ transactionHash: 1 });
instantSellerDepositSchema.index({ status: 1, createdAt: -1 });
instantSellerDepositSchema.index({ expiresAt: 1 });

// ==================== VIRTUALS ====================

// Is expired
instantSellerDepositSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiresAt && this.status === DEPOSIT_STATUS.PENDING;
});

// Total fees
instantSellerDepositSchema.virtual("totalFees").get(function () {
  return this.platformFeeUSDT + this.gasFeeUSDT;
});

// ==================== MIDDLEWARE ====================

// Auto-expire pending deposits
instantSellerDepositSchema.pre("save", function (next) {
  if (this.isExpired && this.status === DEPOSIT_STATUS.PENDING) {
    this.status = DEPOSIT_STATUS.EXPIRED;
  }
  next();
});

// ==================== INSTANCE METHODS ====================

/**
 * Approve deposit
 */
instantSellerDepositSchema.methods.approve = async function (adminId, notes) {
  this.status = DEPOSIT_STATUS.APPROVED;
  this.depositVerified = true;
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  return this.save();
};

/**
 * Reject deposit
 */
instantSellerDepositSchema.methods.reject = async function (
  adminId,
  reason,
  canResubmit = true
) {
  this.status = DEPOSIT_STATUS.REJECTED;
  this.depositVerified = false;
  this.rejectedBy = adminId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.canResubmit = canResubmit;
  return this.save();
};

/**
 * Mark as refunded
 */
instantSellerDepositSchema.methods.markRefunded = async function (
  refundTxHash,
  refundAmount,
  reason
) {
  this.status = DEPOSIT_STATUS.REFUNDED;
  this.refundTransactionHash = refundTxHash;
  this.refundedAt = new Date();
  this.refundAmount = refundAmount;
  this.refundReason = reason;
  return this.save();
};

/**
 * Check if can be verified
 */
instantSellerDepositSchema.methods.canBeVerified = function () {
  return this.status === DEPOSIT_STATUS.PENDING && !this.isExpired;
};

// ==================== STATIC METHODS ====================

/**
 * Get pending deposits for admin
 */
instantSellerDepositSchema.statics.getPendingDeposits = function (
  filters = {}
) {
  const query = {
    status: DEPOSIT_STATUS.PENDING,
    expiresAt: { $gt: new Date() },
    ...filters,
  };

  return this.find(query)
    .populate("sellerId", "name email mobileNumber avatar")
    .populate("listingId", "availableAmount pricePerUnit cryptoType")
    .sort({ createdAt: -1 });
};

/**
 * Get deposit by transaction hash
 */
instantSellerDepositSchema.statics.findByTransactionHash = function (txHash) {
  return this.findOne({ transactionHash: txHash });
};

/**
 * Get seller's deposit history
 */
instantSellerDepositSchema.statics.getSellerHistory = function (sellerId) {
  return this.find({ sellerId })
    .populate("listingId", "availableAmount status")
    .sort({ createdAt: -1 });
};

instantSellerDepositSchema.statics.getAllDeposits = function (filters = {}) {
  const query = { ...filters };

  return this.find(query)
    .populate("sellerId", "name email mobileNumber avatar")
    .populate("listingId", "availableAmount pricePerUnit cryptoType")
    .sort({ createdAt: -1 });
};
// Create and export model
const InstantSellerDeposit = mongoose.model(
  "InstantSellerDeposit",
  instantSellerDepositSchema
);

export default InstantSellerDeposit;
