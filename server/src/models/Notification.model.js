// src/models/Notification.model.js
import mongoose from "mongoose";
import { NOTIFICATION_TYPE, NOTIFICATION_STATUS } from "../constants/index.js";

const { Schema } = mongoose;

const notificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: Object.values(NOTIFICATION_TYPE),
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(NOTIFICATION_STATUS),
            default: NOTIFICATION_STATUS.UNREAD,
            index: true,
        },
        relatedModel: {
            type: String,
            enum: ["Trade", "Listing", "Dispute", "KYC", "User", "InstantSellerDeposit"],
        },
        relatedId: {
            type: Schema.Types.ObjectId,
        },
        actionUrl: {
            type: String,
        },
        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
