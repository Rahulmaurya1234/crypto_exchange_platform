// src/models/Message.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Form Types for interactive messages
 */
export const FORM_TYPES = {
    BUYER_REQUEST_FORM: "BUYER_REQUEST_FORM", // Buyer request form with amount breakdown
    DEPOSIT_CONFIRMATION_FORM: "DEPOSIT_CONFIRMATION_FORM", // Seller deposit confirmation
    PAYMENT_PROOF_FORM: "PAYMENT_PROOF_FORM", // Buyer payment proof upload
    PAYMENT_CONFIRMATION_FORM: "PAYMENT_CONFIRMATION_FORM", // Seller payment confirmation
};

/**
 * Message Schema
 */
const messageSchema = new Schema(
    {
        chatId: {
            type: Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
            index: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: function () {
                // senderId is not required for system messages
                return this.senderRole !== "system";
            },
        },
        senderRole: {
            type: String,
            enum: ["buyer", "seller", "support", "system"],
            required: true,
        },
        messageType: {
            type: String,
            enum: ["text", "image", "file", "system", "action", "form"],
            default: "text",
        },
        content: {
            type: String,
            required: true,
            maxlength: 2000,
        },
        attachments: [
            {
                url: String,
                type: {
                    type: String,
                    enum: ["image", "document", "payment_proof"],
                },
                filename: String,
                size: Number,
            },
        ],
        readBy: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
                readAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
        metadata: {
            type: Schema.Types.Mixed, // For action-specific data
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

// Instance methods
messageSchema.methods.markAsReadBy = function (userId) {
    const existing = this.readBy.find((r) => r.userId.toString() === userId.toString());
    if (!existing) {
        this.readBy.push({ userId, readAt: new Date() });
    }
    return this.save();
};

// Static methods for creating form messages
messageSchema.statics.createBuyerRequestForm = function (chatId, tradeData) {
    return this.create({
        chatId,
        senderId: tradeData.buyerId,
        senderRole: "buyer",
        messageType: "form",
        content: "Buyer has requested to purchase crypto",
        metadata: {
            formType: FORM_TYPES.BUYER_REQUEST_FORM,
            tradeId: tradeData.tradeId,
            data: {
                usdtAmount: tradeData.cryptoAmount,
                totalINR: tradeData.totalINRAmount,
                fees: tradeData.feeBreakdown,
                sellerBank: tradeData.sellerBankDetails,
                pricePerUnit: tradeData.pricePerUnit,
            },
        },
    });
};

messageSchema.statics.createDepositConfirmationForm = function (chatId, sellerId, tradeData) {
    return this.create({
        chatId,
        senderId: sellerId,
        senderRole: "seller",
        messageType: "form",
        content: "Please deposit crypto to escrow",
        metadata: {
            formType: FORM_TYPES.DEPOSIT_CONFIRMATION_FORM,
            tradeId: tradeData.tradeId,
            data: {
                escrowWallet: tradeData.escrowWallet,
                requiredAmount: tradeData.sellerMustSend,
                deadline: tradeData.expiresAt,
                cryptoType: tradeData.cryptoType || "USDT",
            },
        },
    });
};

messageSchema.statics.createPaymentProofForm = function (chatId, buyerId, tradeData) {
    return this.create({
        chatId,
        senderId: buyerId,
        senderRole: "buyer",
        messageType: "form",
        content: "Upload payment proof after transferring INR",
        metadata: {
            formType: FORM_TYPES.PAYMENT_PROOF_FORM,
            tradeId: tradeData.tradeId,
            data: {
                amountToPay: tradeData.totalINRAmount,
                sellerBank: tradeData.sellerBankDetails,
                deadline: tradeData.expiresAt,
            },
        },
    });
};

messageSchema.statics.createSystemMessage = function (chatId, content, metadata = {}) {
    return this.create({
        chatId,
        senderId: null,
        senderRole: "system",
        messageType: "system",
        content,
        metadata,
    });
};

const Message = mongoose.model("Message", messageSchema);
export default Message;
