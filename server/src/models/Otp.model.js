// // src/models/Otp.model.js
// import mongoose from "mongoose";

// const { Schema } = mongoose;

// /**
//  * OTP Schema for Email Verification and Password Reset
//  */
// const otpSchema = new Schema(
//     {
//         email: {
//             type: String,
//             required: [true, "Email is required"],
//             lowercase: true,
//             trim: true,
//             match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
//         },
//         otp: {
//             type: String,
//             required: [true, "OTP is required"],
//         },
//         otpType: {
//             type: String,
//             enum: ["email_verification", "password_reset"],
//             default: "email_verification",
//         },
//         expireAt: {
//             type: Date,
//             required: true,
//             default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
//             index: { expires: 0 }, // TTL index - MongoDB will automatically delete expired documents
//         },
//     },
//     {
//         timestamps: true,
//     }
// );

// // Index for faster lookups
// otpSchema.index({ email: 1, otpType: 1 });

// // Create and export model
// const Otp = mongoose.model("Otp", otpSchema);

// export default Otp;

// D:\new office\CryptiansApplication\server\src\models\OTP.model.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const otpSchema = new Schema(
    {
        identifier: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        otp: {
            type: String,
            required: true,
            length: 6,
        },
        type: {
            type: String,
            required: true,
            enum: [
                "email_verification",
                "phone_verification",
                "password_reset",
                "login_verification",
                "email",
                "phone"
            ],
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index - automatically deletes expired documents
        },
        attempts: {
            type: Number,
            default: 0,
        },
        maxAttempts: {
            type: Number,
            default: 5,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for faster queries
otpSchema.index({ identifier: 1, type: 1, isUsed: 1 });
otpSchema.index({ expiresAt: 1 });

// Instance method to check if OTP is valid
otpSchema.methods.isValid = function () {
    return (
        !this.isUsed &&
        this.expiresAt > new Date() &&
        this.attempts < this.maxAttempts
    );
};

// Instance method to increment attempts
otpSchema.methods.incrementAttempts = async function () {
    this.attempts += 1;
    return this.save();
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function (identifier, otp, type) {
    const otpDoc = await this.findOne({
        identifier: identifier.toLowerCase(),
        otp: otp,
        type: type,
        isUsed: false,
        expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
        return { success: false, message: "Invalid or expired OTP" };
    }

    if (otpDoc.attempts >= otpDoc.maxAttempts) {
        return { success: false, message: "Maximum OTP attempts exceeded" };
    }

    // Mark as used
    otpDoc.isUsed = true;
    await otpDoc.save();

    return { success: true, message: "OTP verified successfully" };
};

// Static method to clean up expired OTPs (optional - TTL index handles this automatically)
otpSchema.statics.cleanupExpired = async function () {
    const result = await this.deleteMany({
        expiresAt: { $lt: new Date() },
    });
    return result.deletedCount;
};

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;