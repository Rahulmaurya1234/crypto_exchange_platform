// src/models/Listing.model.js
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { LISTING_STATUS } from "../constants/index.js";

const { Schema } = mongoose;

/**
 * Listing Schema (Sell Orders)
 */
const listingSchema = new Schema(
  {
    // Seller Information
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Crypto Information
    cryptoType: {
      type: String,
      enum: ["USDT", "BTC", "ETH"],
      default: "USDT",
      required: true,
    },
    networkName: {
      type: String,
      required: true,
      default: "Ethereum", // Default for legacy listings
    },
    availableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Pricing
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR"],
    },
    priceType: {
      type: String,
      enum: ["fixed", "market_plus"],
      default: "fixed",
    },
    marketPlusPercentage: {
      type: Number,
      min: -10,
      max: 50,
      default: 0,
    },

    // Trade Limits
    minTradeLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    maxTradeLimit: {
      type: Number,
      required: true,
      min: 0,
    },

    // Payment Methods Accepted
    paymentMethods: [
      {
        type: String,
        enum: ["upi", "imps", "neft", "rtgs", "bank_transfer"],
      },
    ],

    // Time Limits
    timeLimit: {
      type: Number, // in minutes
      default: 30,
      min: 15,
      max: 120,
    },

    // Instant Seller
    isInstantSeller: {
      type: Boolean,
      default: false,
    },

    // Created By Type
    createdBy: {
      type: String,
      enum: ["InstantSeller", "RegularSeller"],
      default: "RegularSeller",
    },

    // Instant Seller Deposit Details
    escrowTransactionHash: {
      type: String,
      trim: true,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    originalDepositAmount: {
      type: Number,
      default: 0,
    },
    reservedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    platformFeeUSDT: {
      type: Number,
      default: 0,
    },
    gasFeeUSDT: {
      type: Number,
      default: 0,
    },
    depositVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },

    // Status
    status: {
      type: String,
      enum: Object.values(LISTING_STATUS),
      default: LISTING_STATUS.ACTIVE,
      index: true,
    },

    // Trading Terms & Instructions
    terms: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    instructions: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    // Auto-Reply Message
    autoReplyMessage: {
      type: String,
      maxlength: 500,
      trim: true,
    },

    // Availability
    isAvailable: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },

    // Statistics
    viewsCount: {
      type: Number,
      default: 0,
    },
    tradesCount: {
      type: Number,
      default: 0,
    },
    completedTradesCount: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Admin Actions
    isFeatured: {
      type: Boolean,
      default: false,
    },
    suspendedAt: {
      type: Date,
    },
    suspendedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    suspensionReason: {
      type: String,
    },
    isInstantListing:{
      type: Boolean,
      default: false,
    },
    // Soft Delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
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
listingSchema.index({ sellerId: 1, status: 1 });
listingSchema.index({ cryptoType: 1, status: 1 });
listingSchema.index({ pricePerUnit: 1 });
listingSchema.index({ isInstantSeller: 1, status: 1 });
listingSchema.index({ availableAmount: 1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ isFeatured: 1, status: 1 });
listingSchema.index({ isDeleted: 1, status: 1 });

// ==================== VIRTUALS ====================

// Total value in INR
listingSchema.virtual("totalValue").get(function () {
  return this.availableAmount * this.pricePerUnit;
});

// Is expired
listingSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// ==================== MIDDLEWARE ====================

// Update completion rate
listingSchema.pre("save", function (next) {
  if (this.tradesCount > 0) {
    this.completionRate = Math.round(
      (this.completedTradesCount / this.tradesCount) * 100
    );
  } else {
    this.completionRate = 0;
  }
  next();
});

// Check expiry and update status
listingSchema.pre("save", function (next) {
  if (
    this.expiresAt &&
    new Date() > this.expiresAt &&
    this.status === LISTING_STATUS.ACTIVE
  ) {
    this.status = LISTING_STATUS.EXPIRED;
  }
  next();
});

// ==================== INSTANCE METHODS ====================

/**
 * Check if listing is available for trading
 */
listingSchema.methods.isAvailableForTrade = function () {
  return (
    this.status === LISTING_STATUS.ACTIVE &&
    this.isAvailable &&
    this.availableAmount > 0 &&
    !this.isDeleted &&
    (!this.expiresAt || new Date() < this.expiresAt)
  );
};

/**
 * Reserve amount for a trade
 */
// listingSchema.methods.reserveAmount = function (amount) {
//   if (amount > this.availableAmount) {
//     throw new Error("Insufficient available amount");
//   }
//   this.availableAmount -= amount;
//   this.tradesCount += 1;

//   if (this.availableAmount === 0) {
//     this.status = LISTING_STATUS.COMPLETED;
//   }

//   return this.save();
// };

/**
 * Release reserved amount (trade cancelled)
 */
listingSchema.methods.releaseAmount = function (amount) {
  this.availableAmount += amount;

  if (this.status === LISTING_STATUS.COMPLETED && this.availableAmount > 0) {
    this.status = LISTING_STATUS.ACTIVE;
  }

  return this.save();
};

/**
 * Mark trade as completed
 */
listingSchema.methods.markTradeCompleted = function () {
  this.completedTradesCount += 1;
  return this.save();
};

/**
 * Pause listing
 */
listingSchema.methods.pause = function () {
  this.status = LISTING_STATUS.PAUSED;
  this.isAvailable = false;
  return this.save();
};

/**
 * Resume listing
 */
listingSchema.methods.resume = function () {
  if (
    this.availableAmount > 0 &&
    (!this.expiresAt || new Date() < this.expiresAt)
  ) {
    this.status = LISTING_STATUS.ACTIVE;
    this.isAvailable = true;
  }
  return this.save();
};

/**
 * Increment views
 */
listingSchema.methods.incrementViews = function () {
  this.viewsCount += 1;
  return this.save();
};

// ==================== STATIC METHODS ====================

/**
 * Get active listings
 */
listingSchema.statics.getActiveListings = function (filters = {}) {
  const query = {
    status: LISTING_STATUS.ACTIVE,
    isDeleted: false,
    isAvailable: true,
    availableAmount: { $gt: 0 },
    ...filters,
  };

  return this.find(query)
    .populate(
      "sellerId",
      "name avatar averageRating totalReviews isInstantSeller badges"
    )
    .sort({ isFeatured: -1, createdAt: -1 });
};

/**
 * Get listings by seller
 */
listingSchema.statics.getBySeller = function (
  sellerId,
  includeInactive = false
) {
  const query = { sellerId, isDeleted: false };

  if (!includeInactive) {
    query.status = LISTING_STATUS.ACTIVE;
  }

  return this.find(query).sort({ createdAt: -1 });
};

/**
 * Search listings
 */
listingSchema.statics.searchListings = function (searchParams) {
  const {
    cryptoType,
    minAmount,
    maxAmount,
    minPrice,
    maxPrice,
    paymentMethod,
    isInstantSeller,
    page = 1,
    limit = 20,
  } = searchParams;

  const query = {
    status: LISTING_STATUS.ACTIVE,
    isDeleted: false,
    isAvailable: true,
    availableAmount: { $gt: 0 },
  };

  if (cryptoType) query.cryptoType = cryptoType;
  if (minAmount)
    query.availableAmount = { ...query.availableAmount, $gte: minAmount };
  if (maxAmount)
    query.availableAmount = { ...query.availableAmount, $lte: maxAmount };
  if (minPrice) query.pricePerUnit = { $gte: minPrice };
  if (maxPrice) query.pricePerUnit = { ...query.pricePerUnit, $lte: maxPrice };
  if (paymentMethod) query.paymentMethods = paymentMethod;
  if (isInstantSeller !== undefined) query.isInstantSeller = isInstantSeller;

  return this.paginate(query, {
    page,
    limit,
    populate: {
      path: "sellerId",
      select:
        "name avatar averageRating totalReviews isInstantSeller badges completionRate",
    },
    sort: { isFeatured: -1, pricePerUnit: 1, createdAt: -1 },
  });
};

// Add pagination plugin
listingSchema.plugin(mongoosePaginate);

// Create and export model
const Listing = mongoose.model("Listing", listingSchema);

export default Listing;
