// src/models/AuditLog.model.js
import mongoose from "mongoose";
import { AUDIT_ACTION } from "../constants/index.js";

const { Schema } = mongoose;

const auditLogSchema = new Schema(
    {
        action: {
            type: String,
            enum: Object.values(AUDIT_ACTION),
            required: true,
        },
        actorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        actorRole: {
            type: String,
            required: true,
        },
        targetModel: {
            type: String,
            enum: ["User", "Trade", "Listing", "KYC", "Dispute", "EscrowTransaction"],
        },
        targetId: {
            type: Schema.Types.ObjectId,
        },
        details: {
            type: Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: false, // Using custom timestamp field
        capped: { size: 100000000, max: 1000000 }, // 100MB, max 1M documents
    }
);

auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ targetModel: 1, targetId: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
