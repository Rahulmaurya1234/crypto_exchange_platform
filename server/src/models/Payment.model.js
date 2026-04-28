// src/models/Payment.model.js
import mongoose from "mongoose";
import { PAYMENT_STATUS } from "../constants/index.js";

const { Schema } = mongoose;

const paymentSchema = new Schema(
    {
        tradeId: {
            type: Schema.Types.ObjectId,
            ref: "Trade",
            required: true,
            index: true,
        },
        fromUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        toUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
        paymentMethod: {
            type: String,
            enum: ["upi", "imps", "neft", "rtgs", "bank_transfer"],
            required: true,
        },
        transactionId: {
            type: String,
            required: true,
        },
        bankName: {
            type: String,
        },
        proofUrl: {
            type: String, // S3 URL
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.PENDING,
            index: true,
        },
        confirmedAt: {
            type: Date,
        },
        rejectedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
        },
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: "User", // Support who verified
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ tradeId: 1 });
paymentSchema.index({ fromUserId: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
