// src/models/EscrowTransaction.model.js
import mongoose from "mongoose";
import { ESCROW_TRANSACTION_TYPE, ESCROW_TRANSACTION_STATUS } from "../constants/index.js";

const { Schema } = mongoose;

const escrowTransactionSchema = new Schema(
    {
        tradeId: {
            type: Schema.Types.ObjectId,
            ref: "Trade",
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        transactionType: {
            type: String,
            enum: Object.values(ESCROW_TRANSACTION_TYPE),
            required: true,
            index: true,
        },
        cryptoType: {
            type: String,
            default: "USDT",
            required: true,
        },
        network: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        fromAddress: {
            type: String,
        },
        toAddress: {
            type: String,
        },
        txHash: {
            type: String,
            index: true,
            sparse: true,
        },
        blockNumber: {
            type: Number,
        },
        confirmations: {
            type: Number,
            default: 0,
        },
        requiredConfirmations: {
            type: Number,
            default: 12,
        },
        status: {
            type: String,
            enum: Object.values(ESCROW_TRANSACTION_STATUS),
            default: ESCROW_TRANSACTION_STATUS.PENDING,
            index: true,
        },
        completedAt: {
            type: Date,
        },
        failedAt: {
            type: Date,
        },
        failureReason: {
            type: String,
        },
        processedBy: {
            type: Schema.Types.ObjectId,
            ref: "User", // Support/Admin who processed
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

escrowTransactionSchema.index({ status: 1, createdAt: -1 });
escrowTransactionSchema.index({ userId: 1, transactionType: 1 });

const EscrowTransaction = mongoose.model("EscrowTransaction", escrowTransactionSchema);
export default EscrowTransaction;
