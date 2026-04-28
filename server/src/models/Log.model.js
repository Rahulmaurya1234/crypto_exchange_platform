import mongoose, { Schema } from "mongoose";

const logSchema = new Schema(
    {
        admin: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        targetType: {
            type: String,
            enum: ["user", "ad", "kyc"],
            required: true,
        },
        targetId: {
            type: String, // Can be ObjectId of User or Ad, but storing as string for flexibility
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        reason: {
            type: String,
            trim: true,
        },
        metadata: {
            type: Object, // Store any extra details (e.g., previous status)
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
logSchema.index({ createdAt: -1 });
logSchema.index({ admin: 1 });
logSchema.index({ targetType: 1, targetId: 1 });

const Log = mongoose.model("Log", logSchema);

export default Log;
