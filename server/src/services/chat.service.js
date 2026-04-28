// src/services/chat.service.js
import Chat from "../models/Chat.model.js";
import Message from "../models/Message.model.js";
import Trade from "../models/Trade.model.js";
import { logger } from "../utils/logger.js";

/**
 * Get chat by trade ID
 */
export const getChatByTradeId = async (tradeId, userId) => {
    try {
        const chat = await Chat.findOne({ tradeId })
            .populate("participants.userId", "name avatar")
            .populate("tradeId")
            .populate("listingId");

        if (!chat) {
            return null;
        }

        // Verify user is a participant
        const isParticipant = chat.participants.some(
            (p) => p.userId._id.toString() === userId.toString()
        );

        if (!isParticipant) {
            throw new Error("Unauthorized access to chat");
        }

        return chat;
    } catch (error) {
        logger.error("Error getting chat:", error);
        throw error;
    }
};

/**
 * Get chat by ID
 */
export const getChatById = async (chatId, userId) => {
    try {
        const chat = await Chat.findById(chatId)
            .populate("participants.userId", "name avatar")
            .populate("tradeId")
            .populate("listingId");

        if (!chat) {
            return null;
        }

        // Verify user is a participant
        const isParticipant = chat.participants.some(
            (p) => p.userId._id.toString() === userId.toString()
        );

        if (!isParticipant) {
            throw new Error("Unauthorized access to chat");
        }

        return chat;
    } catch (error) {
        logger.error("Error getting chat:", error);
        throw error;
    }
};

/**
 * Get user's chats
 */
export const getUserChats = async (userId, filters = {}) => {
    const { page = 1, limit = 20, isActive } = filters;

    const query = {
        "participants.userId": userId,
    };

    if (isActive !== undefined) {
        query.isActive = isActive === "true" || isActive === true;
    }

    const skip = (page - 1) * limit;

    const [chats, total] = await Promise.all([
        Chat.find(query)
            .populate("participants.userId", "name avatar")
            .populate("tradeId", "tradeNumber status cryptoAmount")
            .populate("listingId", "cryptoType pricePerUnit")
            .sort({ lastMessageAt: -1 })
            .skip(skip)
            .limit(limit),
        Chat.countDocuments(query),
    ]);

    return {
        chats,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Send message
 */
export const sendMessage = async (chatId, senderId, messageData) => {
    try {
        const { content, messageType = "text", attachments = [] } = messageData;

        // Get chat and verify sender is participant
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new Error("Chat not found");
        }

        const participant = chat.participants.find(
            (p) => p.userId.toString() === senderId.toString()
        );

        if (!participant) {
            throw new Error("User is not a participant in this chat");
        }

        // Create message
        const message = new Message({
            chatId,
            senderId,
            senderRole: participant.role,
            messageType,
            content,
            attachments,
        });

        await message.save();

        // Update chat's lastMessageAt
        chat.lastMessageAt = new Date();
        await chat.save();

        // Populate sender info
        await message.populate("senderId", "name avatar");

        logger.info("Message sent", { chatId, senderId, messageId: message._id });

        return message;
    } catch (error) {
        logger.error("Error sending message:", error);
        throw error;
    }
};

/**
 * Get messages for chat
 */
export const getMessages = async (chatId, userId, filters = {}) => {
    try {
        const { page = 1, limit = 50, before } = filters;

        // Verify user is participant
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new Error("Chat not found");
        }

        const isParticipant = chat.participants.some(
            (p) => p.userId.toString() === userId.toString()
        );

        if (!isParticipant) {
            throw new Error("Unauthorized access to messages");
        }

        const query = {
            chatId,
            isDeleted: false,
        };

        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            Message.find(query)
                .populate("senderId", "name avatar")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Message.countDocuments(query),
        ]);

        return {
            messages: messages.reverse(), // Return in chronological order
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        logger.error("Error getting messages:", error);
        throw error;
    }
};

/**
 * Mark chat as read
 */
export const markChatAsRead = async (chatId, userId) => {
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new Error("Chat not found");
        }

        await chat.markAsRead(userId);

        // Mark all unread messages as read
        await Message.updateMany(
            {
                chatId,
                senderId: { $ne: userId },
                "readBy.userId": { $ne: userId },
            },
            {
                $push: {
                    readBy: {
                        userId,
                        readAt: new Date(),
                    },
                },
            }
        );

        logger.info("Chat marked as read", { chatId, userId });

        return chat;
    } catch (error) {
        logger.error("Error marking chat as read:", error);
        throw error;
    }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (userId) => {
    try {
        const chats = await Chat.find({
            "participants.userId": userId,
            isActive: true,
        }).select("_id participants");

        let totalUnread = 0;

        for (const chat of chats) {
            const participant = chat.participants.find(
                (p) => p.userId.toString() === userId.toString()
            );

            if (participant) {
                const unreadCount = await Message.countDocuments({
                    chatId: chat._id,
                    senderId: { $ne: userId },
                    createdAt: { $gt: participant.lastReadAt },
                    isDeleted: false,
                });

                totalUnread += unreadCount;
            }
        }

        return totalUnread;
    } catch (error) {
        logger.error("Error getting unread count:", error);
        throw error;
    }
};

/**
 * Close chat
 */
export const closeChat = async (chatId) => {
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new Error("Chat not found");
        }

        await chat.close();

        logger.info("Chat closed", { chatId });

        return chat;
    } catch (error) {
        logger.error("Error closing chat:", error);
        throw error;
    }
};

/**
 * Add support agent to chat
 */
export const addSupportAgent = async (chatId, supportUserId) => {
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new Error("Chat not found");
        }

        await chat.addParticipant(supportUserId, "support");

        // Send system message
        const systemMessage = new Message({
            chatId,
            senderId: supportUserId,
            senderRole: "support",
            messageType: "system",
            content: "Support agent has joined the conversation",
        });

        await systemMessage.save();

        logger.info("Support agent added to chat", { chatId, supportUserId });

        return chat;
    } catch (error) {
        logger.error("Error adding support agent:", error);
        throw error;
    }
};

/**
 * Find an existing direct chat between two users (optionally scoped to a listing),
 * or create a new direct chat.
 */
export const findOrCreateDirectChat = async (userAId, userBId, listingId = null) => {
    try {
        // Build query to find direct chat between the two users
        const participantQuery = {
            $and: [
                { 'participants.userId': userAId },
                { 'participants.userId': userBId },
            ],
            type: 'direct',
        };

        if (listingId) {
            participantQuery.listingId = listingId;
        }

        let chat = await Chat.findOne(participantQuery)
            .populate('participants.userId', 'name avatar')
            .populate('listingId')
            .populate('tradeId');

        if (chat) return chat;

        // Create a new chat
        const newChat = new Chat({
            type: 'direct',
            listingId: listingId || undefined,
            createdBy: 'buyer', // Chat initiated by buyer
            participants: [
                {
                    userId: userAId,
                    role: 'buyer',
                    joinedAt: new Date(), // Buyer joins immediately
                    lastReadAt: new Date()
                },
                {
                    userId: userBId,
                    role: 'seller',
                    // joinedAt: undefined - seller must join explicitly
                },
            ],
            isActive: true,
        });

        await newChat.save();

        return await Chat.findById(newChat._id)
            .populate('participants.userId', 'name avatar')
            .populate('listingId')
            .populate('tradeId');
    } catch (error) {
        logger.error('Error in findOrCreateDirectChat:', error);
        throw error;
    }
};

export default {
    getChatByTradeId,
    getChatById,
    getUserChats,
    sendMessage,
    getMessages,
    markChatAsRead,
    getUnreadCount,
    closeChat,
    addSupportAgent,
};

