import mongoose, { Schema } from "mongoose";

const adSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        tokenName: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        pricePerUnit: {
            type: Number,
            required: true,
            min: 0,
        },
        minQuantity: {
            type: Number,
            required: true,
            min: 0,
        },
        maxQuantity: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["active", "paused", "removed", "sold"],
            default: "active",
        },
        imageUrl: {
            type: String, // S3 URL or local path
        },
        paymentMethods: [
            {
                type: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Add indexes for search/filtering
adSchema.index({ title: "text", tokenName: "text" });
adSchema.index({ status: 1 });
adSchema.index({ user: 1 });

const Ad = mongoose.model("Ad", adSchema);

export default Ad;
