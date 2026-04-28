// src/models/Trade.model.js
import mongoose from "mongoose";
import { TRADE_STATUS } from "../constants/index.js";

const { Schema } = mongoose;

/**
 * Fee Breakdown Sub-Schema
 * Updated to match calculateTradeFees() return structure
 */
const feeBreakdownSchema = new Schema({
  platformFeePercent: {
    type: Number,
    default: 5.0, // 5% platform fee on INR
  },
  platformFeeINR: {
    type: Number,
    default: 0,
  },
  platformFeeUSDT: {
    type: Number,
    default: 0,
  },
  gasFeePercent: {
    type: Number,
    default: 1.0, // 1% gas fee on INR
  },
  gasFeeINR: {
    type: Number,
    default: 0,
  },
  cryptoPlatformFeePercent: {
    type: Number,
    default: 4.0, // 4% platform fee on USDT
  },
});

/**
 * Timeline Event Sub-Schema
 */
const timelineEventSchema = new Schema({
  event: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  actor: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

/**
 * Trade Schema
 */
const tradeSchema = new Schema(
  {
    // Trade ID (human-readable)
    tradeNumber: {
      type: String,
      unique: true, // Index created automatically by unique constraint
    },

    // Parties
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Trade Amounts
    cryptoAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    cryptoType: {
      type: String,
      enum: ["USDT", "BTC", "ETH"],
      default: "USDT",
      required: true,
    },
    networkName: {
      type: String,
      required: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    totalINRAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    buyerReceivedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    sellerDepositAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Fee Calculation
    feeBreakdown: feeBreakdownSchema,

    // INR breakdown (buyer side)
    sellerNetINR: {
      type: Number, // What seller receives in INR (net amount)
      default: 0,
    },
    platformFeeINR: {
      type: Number, // Platform fee in INR (5%)
      default: 0,
    },
    gasFeeINR: {
      type: Number, // Gas fee in INR (1%)
      default: 0,
    },
    effectivePricePerUnit: {
      type: Number, // Actual price buyer pays per USDT (including fees)
      default: 0,
    },

    // Crypto breakdown (seller side)
    platformFeeUSDT: {
      type: Number, // Platform fee in USDT (4%)
      default: 0,
    },
    sellerMustDepositUSDT: {
      type: Number, // Total USDT seller must deposit to escrow
      default: 0,
    },

    // Legacy fields (for backward compatibility)
    sellerMustSend: {
      type: Number, // Total USDT seller must send to escrow (same as sellerMustDepositUSDT)
      required: true,
    },
    buyerWillReceive: {
      type: Number, // USDT buyer will receive
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: Object.values(TRADE_STATUS),
      default: TRADE_STATUS.INITIATED,
      index: true,
    },

    // Escrow Information
    escrowAddress: {
      type: String,
    },
    escrowTransactionHash: {
      type: String, // Blockchain tx hash
    },
    escrowDepositedAt: {
      type: Date,
    },
    escrowReleasedAt: {
      type: Date,
    },
    escrowReleaseHash: {
      type: String,
    },

    // Payment Information (INR from buyer to seller)
    paymentMethod: {
      type: String,
      enum: ["upi", "imps", "neft", "rtgs", "bank_transfer"],
    },
    buyerPaymentDetails: {
      transactionId: String,
      amount: Number,
      bank: String,
      proofUrl: String, // S3 URL to screenshot
      uploadedAt: Date,
    },
    sellerPaymentConfirmation: {
      confirmed: {
        type: Boolean,
        default: false,
      },
      confirmedAt: Date,
      remarks: String,
    },

    // Wallet Addresses
    buyerWalletAddress: {
      type: String,
      required: true,
    },
    sellerWalletAddress: {
      type: String,
    },

    // Document Sharing (Buyer agrees to share Aadhaar with Seller)
    isShareDocument: {
      type: Boolean,
      default: false,
      required: true,
    },

    // Buyer's Aadhaar Documents (uploaded during trade initiation)
    buyerAadhaarProof: {
      frontImageUrl: String, // S3 URL for Aadhaar front
      backImageUrl: String, // S3 URL for Aadhaar back
      uploadedAt: Date,
    },

    // Time Limits
    expiresAt: {
      type: Date,
    },
    paymentTimeLimit: {
      type: Number, // in minutes
      default: 30,
    },

    // Chat
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },

    // Completion
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    cancellationReason: {
      type: String,
    },

    // Dispute
    hasDispute: {
      type: Boolean,
      default: false,
    },
    disputeId: {
      type: Schema.Types.ObjectId,
      ref: "Dispute",
    },
    disputeCreatedAt: {
      type: Date,
    },
    // Appeal
    isAppealed: {
      type: Boolean,
      default: false,
    },
    appealReason: {
      type: String,
    },
    appealedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    appealedAt: {
      type: Date,
    },
    appealResolution: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      resolvedAt: Date,
      resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      remarks: String,
    },

    // Reviews
    buyerReviewed: {
      type: Boolean,
      default: false,
    },
    sellerReviewed: {
      type: Boolean,
      default: false,
    },
    // isReviewed: {
    //   type: Boolean,
    //   default: false,
    // },
    // reviewedAt: {
    //   type: Date,
    // },
    // Timeline
    timeline: [timelineEventSchema],

    // Instant Seller Flag
    isInstantSeller: {
      type: Boolean,
      default: false,
    },

    // Auto-actions
    autoReleaseEnabled: {
      type: Boolean,
      default: false, // True for instant sellers
    },
    autoReleasedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================
// Note: tradeNumber already has unique index from schema definition
tradeSchema.index({ buyerId: 1, status: 1 });
tradeSchema.index({ sellerId: 1, status: 1 });
tradeSchema.index({ listingId: 1 });
tradeSchema.index({ status: 1, createdAt: -1 });
tradeSchema.index({ expiresAt: 1 }, { sparse: true });
tradeSchema.index({ hasDispute: 1 });

// ==================== MIDDLEWARE ====================

// Generate trade number
tradeSchema.pre("save", async function (next) {
  if (this.isNew && !this.tradeNumber) {
    const count = await this.constructor.countDocuments();
    this.tradeNumber = `TRD${Date.now()}${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

// Add timeline event on status change
tradeSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.timeline.push({
      event: `Status changed to ${this.status}`,
      description: `Trade status updated`,
      timestamp: new Date(),
    });
  }
  next();
});

// ==================== INSTANCE METHODS ====================

/**
 * Add timeline event
 */
tradeSchema.methods.addTimelineEvent = function (event, description, actor) {
  this.timeline.push({ event, description, actor, timestamp: new Date() });
  return this;
};

/**
 * Mark escrow deposited
 */
tradeSchema.methods.markEscrowDeposited = function (
  transactionHash,
  escrowAddress
) {
  this.status = TRADE_STATUS.ESCROW_LOCKED;
  this.escrowTransactionHash = transactionHash;
  this.escrowAddress = escrowAddress;
  this.escrowDepositedAt = new Date();
  this.addTimelineEvent(
    "Escrow Deposited",
    `USDT locked in escrow: ${transactionHash}`
  );
  return this.save();
};

/**
 * Upload payment proof (buyer)
 * Accepts both 'utr' and 'transactionId' for backward compatibility
 */
tradeSchema.methods.uploadPaymentProof = function (paymentDetails) {
  this.status = TRADE_STATUS.PAYMENT_PROOF_UPLOADED;

  // Map 'utr' to 'transactionId' if provided
  const transactionId = paymentDetails.utr || paymentDetails.transactionId;

  this.buyerPaymentDetails = {
    transactionId: transactionId,
    amount: paymentDetails.amount,
    bank: paymentDetails.bank || "",
    proofUrl: paymentDetails.proofUrl,
    uploadedAt: new Date(),
  };

  this.addTimelineEvent(
    "Payment Proof Uploaded",
    `Buyer uploaded payment proof. UTR/Transaction ID: ${transactionId}`
  );

  return this.save();
};

/**
 * Confirm payment (seller)
 */
tradeSchema.methods.confirmPayment = function (remarks = "") {
  this.sellerPaymentConfirmation = {
    confirmed: true,
    confirmedAt: new Date(),
    remarks,
  };
  this.status = TRADE_STATUS.PENDING_CONFIRMATION;
  this.addTimelineEvent(
    "Payment Confirmed",
    "Seller confirmed payment receipt"
  );
  return this.save();
};

/**
 * Mark as completed
 */
tradeSchema.methods.complete = function (releaseHash) {
  this.status = TRADE_STATUS.COMPLETED;
  this.completedAt = new Date();
  this.escrowReleasedAt = new Date();
  this.escrowReleaseHash = releaseHash;
  this.addTimelineEvent(
    "Trade Completed",
    `USDT released to buyer: ${releaseHash}`
  );
  return this.save();
};

/**
 * Cancel trade
 */
tradeSchema.methods.cancel = function (cancelledBy, reason) {
  this.status = TRADE_STATUS.CANCELLED;
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
  this.addTimelineEvent("Trade Cancelled", reason, cancelledBy);
  return this.save();
};

/**
 * Create dispute
 */
tradeSchema.methods.createDispute = function (disputeId) {
  this.status = TRADE_STATUS.DISPUTED;
  this.hasDispute = true;
  this.disputeId = disputeId;
  this.disputeCreatedAt = new Date();
  this.addTimelineEvent("Dispute Created", "Dispute raised");
  return this.save();
};

/**
 * Check if trade is expired
 */
tradeSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

/**
 * Check if buyer can upload payment proof
 */
tradeSchema.methods.canUploadPaymentProof = function () {
  return this.status === TRADE_STATUS.ESCROW_LOCKED && !this.isExpired();
};

/**
 * Check if seller can confirm payment
 */
tradeSchema.methods.canConfirmPayment = function () {
  return this.status === TRADE_STATUS.PAYMENT_PROOF_UPLOADED;
};

// ==================== STATIC METHODS ====================

/**
 * Get trades by user (buyer or seller)
 */
tradeSchema.statics.getByUser = function (userId, filters = {}) {
  const query = {
    $or: [{ buyerId: userId }, { sellerId: userId }],
    ...filters,
  };

  return this.find(query)
    .populate("listingId")
    .populate("buyerId", "name avatar averageRating")
    .populate("sellerId", "name avatar averageRating isInstantSeller")
    .sort({ createdAt: -1 });
};

/**
 * Get active trades
 */
tradeSchema.statics.getActiveTrades = function () {
  return this.find({
    status: {
      $in: [
        TRADE_STATUS.INITIATED,
        TRADE_STATUS.PENDING_DEPOSIT,
        TRADE_STATUS.ESCROW_LOCKED,
        TRADE_STATUS.PAYMENT_PROOF_UPLOADED,
        TRADE_STATUS.PENDING_CONFIRMATION,
      ],
    },
  })
    .populate("buyerId sellerId listingId")
    .sort({ createdAt: -1 });
};

/**
 * Get expired trades
 */
tradeSchema.statics.getExpiredTrades = function () {
  return this.find({
    status: {
      $in: [TRADE_STATUS.INITIATED, TRADE_STATUS.ESCROW_LOCKED],
    },
    expiresAt: { $lt: new Date() },
  });
};


// ==================== CHAT CLEANUP AFTER TRADE END ====================

tradeSchema.post("save", async function (doc) {
  try {
    const terminalStatuses = [
      TRADE_STATUS.COMPLETED,
      TRADE_STATUS.CANCELLED,
      TRADE_STATUS.DISPUTED,
    ];

    if (!terminalStatuses.includes(doc.status)) return;

    const Chat = mongoose.model("Chat");

    await Chat.updateOne(
      { tradeId: doc._id },
      {
        $unset: { tradeId: "" },
        ...(doc.status === TRADE_STATUS.COMPLETED
          ? {
            $set: {
              isActive: false,
              closedAt: new Date(),
            },
          }
          : {}),
      }
    );
    console.log("chat tradeId cleared");
  } catch (error) {
    console.error("❌ Error clearing tradeId from chat:", error);
  }
});

// Create and export model
const Trade = mongoose.model("Trade", tradeSchema);

export default Trade;
