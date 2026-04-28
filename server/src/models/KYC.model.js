// src/models/KYC.model.js
import mongoose from "mongoose";
import { KYC_STATUS, KYC_LEVEL } from "../constants/index.js";

const { Schema } = mongoose;

/**
 * KYC Document Sub-Schema
 */
const kycDocumentSchema = new Schema({
    documentType: {
        type: String,
        enum: ["aadhaar", "pan", "passport", "driving_license", "selfie", "address_proof"],
        required: true,
    },
    documentNumber: {
        type: String,
        trim: true,
    },
    frontImageUrl: {
        type: String, // S3 URL
        required: true,
    },
    backImageUrl: {
        type: String, // S3 URL (for documents with back side)
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
});

/**
 * KYC Verification Schema
 */
const kycSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        // KYC Status
        status: {
            type: String,
            enum: Object.values(KYC_STATUS),
            default: KYC_STATUS.NOT_SUBMITTED,
        },
        level: {
            type: String,
            enum: Object.values(KYC_LEVEL),
            default: KYC_LEVEL.LEVEL_0,
        },

        // Personal Information
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        dateOfBirth: {
            type: Date,
        },
        nationality: {
            type: String,
            default: "Indian",
        },

        // Documents
        documents: [kycDocumentSchema],

        // Bank Details
        bankDetails: {
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
            branch: {
                type: String,
                trim: true,
            },
            accountHolderName: {
                type: String,
                trim: true,
            },
            upiId: {
                type: String,
                trim: true,
                lowercase: true,
            },
            bankProofUrl: {
                type: String, // S3 URL for bank statement/passbook
            },
        },

        // Verification Provider Response (ShuftiPro/Signzy/Sumsub)
        providerName: {
            type: String,
            enum: ["shufti", "signzy", "sumsub", "manual"],
            default: "manual",
        },
        providerReference: {
            type: String, // External reference ID
        },
        providerResponse: {
            type: Schema.Types.Mixed, // Store provider's full response
        },
        providerVerifiedAt: {
            type: Date,
        },

        // Submission & Review Dates
        submittedAt: {
            type: Date,
        },
        reviewedAt: {
            type: Date,
        },
        approvedAt: {
            type: Date,
        },
        rejectedAt: {
            type: Date,
        },

        // Reviewer Information
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User", // Admin/Support who reviewed
        },
        rejectionReason: {
            type: String,
            maxlength: 1000,
        },

        // Audit Trail
        reviewNotes: {
            type: String,
            maxlength: 2000,
        },
        statusHistory: [
            {
                status: {
                    type: String,
                    enum: Object.values(KYC_STATUS),
                },
                changedBy: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
                changedAt: {
                    type: Date,
                    default: Date.now,
                },
                reason: String,
            },
        ],

        // Resubmission
        resubmissionCount: {
            type: Number,
            default: 0,
        },
        lastResubmittedAt: {
            type: Date,
        },

        // Verification Flags
        isDocumentVerified: {
            type: Boolean,
            default: false,
        },
        isFaceVerified: {
            type: Boolean,
            default: false,
        },
        isAddressVerified: {
            type: Boolean,
            default: false,
        },

        // Expiry (for KYC renewal)
        expiresAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// ==================== INDEXES ====================
kycSchema.index({ userId: 1 }, { unique: true });
kycSchema.index({ status: 1 });
kycSchema.index({ level: 1 });
kycSchema.index({ submittedAt: -1 });
kycSchema.index({ reviewedBy: 1 });

// ==================== MIDDLEWARE ====================

// Add to status history when status changes
kycSchema.pre("save", function (next) {
    if (this.isModified("status") && !this.isNew) {
        this.statusHistory.push({
            status: this.status,
            changedBy: this.reviewedBy,
            changedAt: new Date(),
            reason: this.rejectionReason || "Status updated",
        });
    }
    next();
});

// ==================== INSTANCE METHODS ====================

/**
 * Submit KYC for review
 */
kycSchema.methods.submitForReview = function () {
    this.status = KYC_STATUS.SUBMITTED;
    this.submittedAt = new Date();
    return this.save();
};

/**
 * Approve KYC
 */
kycSchema.methods.approve = function (reviewerId, level = KYC_LEVEL.LEVEL_2) {
    this.status = KYC_STATUS.APPROVED;
    this.level = level;
    this.reviewedBy = reviewerId;
    this.reviewedAt = new Date();
    this.approvedAt = new Date();

    // Set expiry (1 year from approval)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    this.expiresAt = expiryDate;

    return this.save();
};

/**
 * Reject KYC
 */
kycSchema.methods.reject = function (reviewerId, reason) {
    this.status = KYC_STATUS.REJECTED;
    this.reviewedBy = reviewerId;
    this.reviewedAt = new Date();
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
    return this.save();
};

/**
 * Request resubmission
 */
kycSchema.methods.requestResubmission = function (reviewerId, reason) {
    this.status = KYC_STATUS.RESUBMIT_REQUIRED;
    this.reviewedBy = reviewerId;
    this.reviewedAt = new Date();
    this.rejectionReason = reason;
    this.resubmissionCount += 1;
    return this.save();
};

/**
 * Check if KYC is expired
 */
kycSchema.methods.isExpired = function () {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
};

// ==================== STATIC METHODS ====================

/**
 * Get pending KYC submissions
 */
kycSchema.statics.getPendingSubmissions = function () {
    return this.find({
        status: { $in: [KYC_STATUS.SUBMITTED, KYC_STATUS.UNDER_REVIEW] },
    })
        .populate("userId", "name email mobileNumber")
        .sort({ submittedAt: 1 });
};

/**
 * Get KYC by user ID
 */
kycSchema.statics.getByUserId = function (userId) {
    return this.findOne({ userId }).populate("userId reviewedBy");
};

// Create and export model
const KYC = mongoose.model("KYC", kycSchema);

export default KYC;
