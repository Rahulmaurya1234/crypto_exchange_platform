// src/models/User.model.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ROLES, ACCOUNT_STATUS, KYC_STATUS, KYC_LEVEL } from "../constants/index.js";
import { jwtConfig } from "../config/jwt.config.js";

const { Schema } = mongoose;

/**
 * Review Sub-Schema
 * Other users can leave reviews for sellers after completing trades
 */
const reviewSchema = new Schema(
    {
        reviewerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reviewerName: {
            type: String, // Cached for performance
            required: true,
        },
        reviewerRole: {
            type: String,
            enum: ["buyer", "seller"],
            required: true,
        },
        tradeId: {
            type: Schema.Types.ObjectId,
            ref: "Trade",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            maxlength: 500,
            trim: true,
        },
        isVerifiedTrade: {
            type: Boolean,
            default: true, // True if trade was completed successfully
        },
        // Response to review (seller can reply)
        response: {
            text: {
                type: String,
                maxlength: 500,
                trim: true,
            },
            respondedAt: Date,
        },
    },
    { timestamps: true }
);

// Compound index to prevent duplicate reviews for same trade
// reviewSchema.index({ tradeId: 1 }, { unique: true });
reviewSchema.index(
  { tradeId: 1, reviewerId: 1 },
  { unique: true }
);


/**
 * Bank Details Sub-Schema
 */
const bankDetailsSchema = new Schema({
    accountHolderName: {
        type: String,
        trim: true,
    },
    accountNumber: {
        type: String,
        trim: true,
    },
    ifscCode: {
        type: String,
        trim: true,
        uppercase: true,
    },
    bankName: {
        type: String,
        trim: true,
    },
    upiId: {
        type: String,
        trim: true,
        lowercase: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
});

/**
 * Main User Schema
 */
const userSchema = new Schema(
    {
        // ========== BASIC INFORMATION ==========
        name: {
            type: String,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 8,
            select: false,
        },
        mobileNumber: {
            type: String,
            trim: true,
        },
        altMobileNumber: {
            type: String,
            trim: true,
        },
        gender: {
            type: String,
            enum: ["male", "female", "other", "prefer_not_to_say"],
        },

        // ========== ADDRESS INFORMATION ==========
        address: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        pincode: {
            type: String,
            trim: true,
        },

        // ========== ROLE & PERMISSIONS ==========
        role: {
            type: String,
            enum: Object.values(ROLES),
            default: ROLES.BUYER,
        },
        permissions: {
            type: [String],
            default: [],
        },

        // ========== ACCOUNT STATUS ==========
        accountStatus: {
            type: String,
            enum: Object.values(ACCOUNT_STATUS),
            default: ACCOUNT_STATUS.ACTIVE,
        },

        // ========== KYC INFORMATION ==========
        kycStatus: {
            type: String,
            enum: Object.values(KYC_STATUS),
            default: KYC_STATUS.NOT_SUBMITTED,
        },
        kycLevel: {
            type: String,
            enum: Object.values(KYC_LEVEL),
            default: KYC_LEVEL.LEVEL_0,
        },
        kycSubmittedAt: Date,
        kycApprovedAt: Date,
        kycRejectedAt: Date,
        kycRejectionReason: String,
        kycReviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        // ========== INSTANT SELLER INFORMATION ==========
        isInstantSeller: {
            type: Boolean,
            default: false,
        },
        instantSellerApprovedAt: Date,
        escrowDepositAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // ========== BANK & WALLET INFORMATION ==========
        bankDetails: bankDetailsSchema,
        cryptoWalletAddress: {
            type: String,
            trim: true,
            sparse: true,
        },

        // ========== PROFILE & PREFERENCES ==========
        avatar: String,
        bio: {
            type: String,
            maxlength: 500,
        },
        preferredLanguage: {
            type: String,
            enum: ["en", "hi"],
            default: "en",
        },

        // ========== REVIEWS SYSTEM ==========
        reviews: [reviewSchema],
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalReviews: {
            type: Number,
            default: 0,
        },

        // ========== TRADING STATISTICS ==========
        totalTrades: {
            type: Number,
            default: 0,
        },
        completedTrades: {
            type: Number,
            default: 0,
        },
        cancelledTrades: {
            type: Number,
            default: 0,
        },
        disputedTrades: {
            type: Number,
            default: 0,
        },
        completionRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        // ========== VERIFICATION BADGES ==========
        badges: [
            {
                type: {
                    type: String,
                    enum: ["verified_email", "verified_phone", "kyc_approved", "instant_seller", "top_trader"],
                },
                earnedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // ========== SECURITY ==========
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        twoFactorSecret: {
            type: String,
            select: false,
        },
        lastLoginAt: Date,
        lastLoginIp: String,

        // ========== PASSWORD RESET ==========
        passwordResetToken: {
            type: String,
            select: false,
        },
        passwordResetExpires: {
            type: Date,
            select: false,
        },

        // ========== EMAIL/PHONE VERIFICATION ==========
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerifiedAt: Date,
        emailApprovedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        phoneVerified: {
            type: Boolean,
            default: false,
        },

        // ========== SUSPENSION/BAN INFO ==========
        suspendedAt: Date,
        suspendedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        suspensionReason: String,
        bannedAt: Date,
        bannedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        banReason: String,

        // ========== SOFT DELETE ==========
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: Date,
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.twoFactorSecret;
                delete ret.passwordResetToken;
                delete ret.passwordResetExpires;
                delete ret.__v;
                return ret;
            },
        },
        toObject: { virtuals: true },
    }
);

// ==================== INDEXES ====================
userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ kycStatus: 1 });
userSchema.index({ isInstantSeller: 1 });
userSchema.index({ averageRating: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isDeleted: 1, accountStatus: 1 });
userSchema.index({ "reviews.tradeId": 1 }); // For faster review lookups

// ==================== MIDDLEWARE ====================

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Update averageRating when reviews change
userSchema.pre("save", function (next) {
    if (this.isModified("reviews")) {
        if (this.reviews.length > 0) {
            const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
            this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
            this.totalReviews = this.reviews.length;
        } else {
            this.averageRating = 0;
            this.totalReviews = 0;
        }
    }
    next();
});

// Update completion rate
userSchema.pre("save", function (next) {
    if (this.totalTrades > 0) {
        this.completionRate = Math.round((this.completedTrades / this.totalTrades) * 100);
    } else {
        this.completionRate = 0;
    }
    next();
});

// ==================== INSTANCE METHODS ====================

/**
 * Compare password
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generate Access Token
 */
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            sub: this._id,
            email: this.email,
            role: this.role,
            tokenType: "access",
        },
        jwtConfig.accessToken.secret,
        {
            expiresIn: jwtConfig.accessToken.expiresIn,
        }
    );
};

/**
 * Generate Refresh Token
 */
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            sub: this._id,
            tokenType: "refresh",
        },
        jwtConfig.refreshToken.secret,
        {
            expiresIn: jwtConfig.refreshToken.expiresIn,
        }
    );
};

/**
 * Check if user is active
 */
userSchema.methods.isActive = function () {
    return this.accountStatus === ACCOUNT_STATUS.ACTIVE && !this.isDeleted;
};

/**
 * Check if user can trade
 */
userSchema.methods.canTrade = function () {
    return (
        this.isActive() &&
        this.kycStatus === KYC_STATUS.APPROVED &&
        this.kycLevel !== KYC_LEVEL.LEVEL_0
    );
};

/**
 * Check if user can create listings
 */
userSchema.methods.canCreateListing = function () {
    return (
        this.canTrade() &&
        (this.role === ROLES.SELLER || this.role === ROLES.INSTANT_SELLER)
    );
};

/**
 * Check if KYC is approved
 */
userSchema.methods.isKycApproved = function () {
    return this.kycStatus === KYC_STATUS.APPROVED;
};

// ==================== REVIEW METHODS ====================

/**
 * Add review to user (seller receives review from buyer)
 * @param {ObjectId} reviewerId - Buyer's ID
 * @param {String} reviewerName - Buyer's name
 * @param {String} reviewerRole - 'buyer' or 'seller'
 * @param {ObjectId} tradeId - Trade ID
 * @param {Number} rating - 1 to 5
 * @param {String} comment - Review comment
 * @param {Boolean} isVerifiedTrade - Trade verified or not
 */
userSchema.methods.addReview = async function (
    reviewerId, 
    reviewerName, 
    reviewerRole,
    tradeId, 
    rating, 
    comment, 
    isVerifiedTrade = true
) {
    // Check if reviewer already reviewed this trade
    const existingReview = this.reviews.find(
        (r) => r.tradeId.toString() === tradeId.toString()
    );

    if (existingReview) {
        throw new Error("You have already reviewed this trade");
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }

    this.reviews.push({
        reviewerId,
        reviewerName,
        reviewerRole,
        tradeId,
        rating,
        comment: comment?.trim() || "",
        isVerifiedTrade,
    });

    return await this.save();
};

/**
 * Update existing review
 * @param {ObjectId} tradeId - Trade ID
 * @param {Number} rating - New rating
 * @param {String} comment - New comment
 */
userSchema.methods.updateReview = async function (tradeId, rating, comment) {
    const review = this.reviews.find(
        (r) => r.tradeId.toString() === tradeId.toString()
    );

    if (!review) {
        throw new Error("Review not found for this trade");
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }

    review.rating = rating;
    if (comment !== undefined) {
        review.comment = comment.trim();
    }

    return await this.save();
};

/**
 * Delete review (admin only)
 * @param {ObjectId} tradeId - Trade ID
 */
userSchema.methods.deleteReview = async function (tradeId) {
    const reviewIndex = this.reviews.findIndex(
        (r) => r.tradeId.toString() === tradeId.toString()
    );

    if (reviewIndex === -1) {
        throw new Error("Review not found");
    }

    this.reviews.splice(reviewIndex, 1);
    return await this.save();
};

/**
 * Add response to a review (seller can respond)
 * @param {ObjectId} tradeId - Trade ID
 * @param {String} responseText - Response text
 */
userSchema.methods.addReviewResponse = async function (tradeId, responseText) {
    const review = this.reviews.find(
        (r) => r.tradeId.toString() === tradeId.toString()
    );

    if (!review) {
        throw new Error("Review not found");
    }

    if (review.response && review.response.text) {
        throw new Error("Response already exists for this review");
    }

    review.response = {
        text: responseText.trim(),
        respondedAt: Date.now(),
    };

    return await this.save();
};

/**
 * Check if user can review for a specific trade
 * @param {ObjectId} tradeId - Trade ID
 * @returns {Boolean}
 */
userSchema.methods.canReviewForTrade = function (tradeId) {
    const existingReview = this.reviews.find(
        (r) => r.tradeId.toString() === tradeId.toString()
    );
    return !existingReview;
};

/**
 * Get review by trade ID
 * @param {ObjectId} tradeId - Trade ID
 * @returns {Object|null}
 */
userSchema.methods.getReviewByTradeId = function (tradeId) {
    return this.reviews.find(
        (r) => r.tradeId.toString() === tradeId.toString()
    );
};

/**
 * Get paginated reviews
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Object}
 */
userSchema.methods.getPaginatedReviews = async function (page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    await this.populate({
        path: "reviews.reviewerId",
        select: "name avatar averageRating totalReviews role",
    });

    const sortedReviews = [...this.reviews].sort((a, b) => b.createdAt - a.createdAt);
    const paginatedReviews = sortedReviews.slice(skip, skip + limit);

    return {
        reviews: paginatedReviews,
        total: this.reviews.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(this.reviews.length / limit),
        hasMore: skip + limit < this.reviews.length,
    };
};

/**
 * Get reviews statistics
 * @returns {Object}
 */
userSchema.methods.getReviewStats = function () {
    if (this.reviews.length === 0) {
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            verifiedReviewsCount: 0,
            percentageDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        };
    }

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let verifiedCount = 0;

    this.reviews.forEach((review) => {
        ratingDistribution[review.rating]++;
        if (review.isVerifiedTrade) verifiedCount++;
    });

    // Calculate percentage distribution
    const percentageDistribution = {};
    Object.keys(ratingDistribution).forEach((rating) => {
        percentageDistribution[rating] = Math.round(
            (ratingDistribution[rating] / this.reviews.length) * 100
        );
    });

    return {
        averageRating: this.averageRating,
        totalReviews: this.totalReviews,
        ratingDistribution,
        percentageDistribution,
        verifiedReviewsCount: verifiedCount,
    };
};

/**
 * Get user's reviews with reviewer details (populated)
 */
userSchema.methods.getReviewsWithDetails = async function () {
    await this.populate({
        path: "reviews.reviewerId",
        select: "name avatar averageRating totalReviews role",
    });
    return this.reviews;
};

// ==================== INSTANT SELLER METHODS ====================

/**
 * Check if instant seller has sufficient balance
 */
userSchema.methods.hasInstantSellerBalance = function (amount) {
    if (!this.isInstantSeller) {
        return false;
    }
    return this.escrowDepositAmount >= amount;
};

/**
 * Deduct from instant seller balance
 */
userSchema.methods.deductInstantSellerBalance = async function (amount, tradeId) {
    if (!this.isInstantSeller) {
        throw new Error("User is not an instant seller");
    }

    if (this.escrowDepositAmount < amount) {
        throw new Error("Insufficient instant seller balance");
    }

    this.escrowDepositAmount -= amount;
    return this.save();
};

/**
 * Add to instant seller balance
 */
userSchema.methods.addInstantSellerBalance = async function (amount) {
    if (!this.isInstantSeller) {
        throw new Error("User is not an instant seller");
    }

    this.escrowDepositAmount += amount;
    return this.save();
};

/**
 * Get instant seller balance
 */
userSchema.methods.getInstantSellerBalance = function () {
    return this.isInstantSeller ? this.escrowDepositAmount : 0;
};

// ==================== STATIC METHODS ====================

/**
 * Find active user by email
 */
userSchema.statics.findActiveByEmail = function (email) {
    return this.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
    });
};

/**
 * Find by email or mobile
 */
userSchema.statics.findByEmailOrMobile = function (emailOrMobile) {
    return this.findOne({
        $or: [
            { email: emailOrMobile.toLowerCase() },
        ],
        isDeleted: false,
    });
};

/**
 * Get seller statistics
 */
userSchema.statics.getSellerStats = async function (userId) {
    const user = await this.findById(userId);
    if (!user) return null;

    return {
        totalTrades: user.totalTrades,
        completedTrades: user.completedTrades,
        cancelledTrades: user.cancelledTrades,
        disputedTrades: user.disputedTrades,
        completionRate: user.completionRate,
        averageRating: user.averageRating,
        totalReviews: user.totalReviews,
        isInstantSeller: user.isInstantSeller,
        badges: user.badges,
    };
};

/**
 * Get top rated sellers
 * @param {Number} limit - Number of sellers to return
 */
userSchema.statics.getTopRatedSellers = async function (limit = 10) {
    return this.find({
        role: { $in: [ROLES.SELLER, ROLES.INSTANT_SELLER] },
        isDeleted: false,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
        totalReviews: { $gte: 5 }, // At least 5 reviews
    })
        .sort({ averageRating: -1, totalReviews: -1 })
        .limit(limit)
        .select("name email avatar averageRating totalReviews completionRate badges");
};

// Create and export model
const User = mongoose.model("User", userSchema);

export default User;
export { ROLES, ACCOUNT_STATUS, KYC_STATUS, KYC_LEVEL };