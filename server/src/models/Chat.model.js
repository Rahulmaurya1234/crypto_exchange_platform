// src/models/Chat.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Chat Schema
 */
const chatSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["direct", "group", "channel"],
            default: "direct",
        },
        tradeId: {
            type: Schema.Types.ObjectId,
            ref: "Trade",
            // optional: chats may be created without an associated trade (direct chats)
        },
        listingId: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
            // optional: associate a chat to a listing when available
        },
        participants: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                role: {
                    type: String,
                    enum: ["buyer", "seller", "support"],
                    required: true,
                },
                joinedAt: {
                    type: Date,
                    // Don't set default - let service set it explicitly
                },
                lastReadAt: {
                    type: Date,
                },
            },
        ],
        createdBy: {
            type: String,
            enum: ["buyer", "seller"],
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        closedAt: {
            type: Date,
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
chatSchema.index({ "participants.userId": 1 });
chatSchema.index({ isActive: 1, lastMessageAt: -1 });

// Instance methods
chatSchema.methods.addParticipant = function (userId, role) {
    const existing = this.participants.find((p) => p.userId.toString() === userId.toString());
    if (!existing) {
        this.participants.push({ userId, role, joinedAt: new Date() });
    }
    return this.save();
};

chatSchema.methods.markAsRead = function (userId) {
    const participant = this.participants.find((p) => p.userId.toString() === userId.toString());
    if (participant) {
        participant.lastReadAt = new Date();
    }
    return this.save();
};

chatSchema.methods.close = function () {
    this.isActive = false;
    this.closedAt = new Date();
    return this.save();
};

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
