// src/models/Dispute.model.js
import mongoose from "mongoose";
import { DISPUTE_STATUS, DISPUTE_RESOLUTION } from "../constants/index.js";

const { Schema } = mongoose;

const disputeSchema = new Schema(
    {
        tradeId: {
            type: Schema.Types.ObjectId,
            ref: "Trade",
            required: true,
            unique: true,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false, // Optional to allow system-created disputes
        },
        reason: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        evidence: [
            {
                type: {
                    type: String,
                    enum: ["screenshot", "document", "bank_statement", "other"],
                },
                url: String,
                description: String,
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        status: {
            type: String,
            enum: Object.values(DISPUTE_STATUS),
            default: DISPUTE_STATUS.OPEN,
            index: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User", // Support agent
        },
        assignedAt: {
            type: Date,
        },
        resolution: {
            type: String,
            enum: Object.values(DISPUTE_RESOLUTION),
        },
        resolutionNotes: {
            type: String,
            maxlength: 2000,
        },
        resolvedAt: {
            type: Date,
        },
        resolvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ assignedTo: 1 });

const Dispute = mongoose.model("Dispute", disputeSchema);
export default Dispute;
