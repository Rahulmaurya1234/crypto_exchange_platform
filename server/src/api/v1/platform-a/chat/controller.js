// src/api/v1/platform-a/chat/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import { NotFoundError } from "../../../../utils/ApiError.js";
import * as chatService from "../../../../services/chat.service.js";
import { emitToChat, getIO, emitToUser } from "../../../../config/socket.config.js";
import Listing from "../../../../models/Listing.model.js";
import { logger } from "../../../../utils/logger.js";
/**
 * Get chat by trade ID
 * @route GET /api/v1/platform-a/chat/trade/:tradeId
 * @access Private
 */

export const getChatByTradeId = asyncHandler(async (req, res) => {
    const { tradeId } = req.params;
    const userId = req.user._id;
    const lang = req.language || "en";

    const chat = await chatService.getChatByTradeId(tradeId, userId);

    if (!chat) {
        throw NotFoundError("Chat not found for this trade", {}, lang);
    }

    res.json(new ApiResponse(200, { chat }, "Chat retrieved successfully"));
});

/**
 * Get chat by ID
 * @route GET /api/v1/platform-a/chat/:id
 * @access Private
 */
export const getChatById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const lang = req.language || "en";

    const chat = await chatService.getChatById(id, userId);

    if (!chat) {
        throw NotFoundError("Chat not found", {}, lang);
    }

    res.json(new ApiResponse(200, { chat }, "Chat retrieved successfully"));
});

/**
 * Get user's chats
 * @route GET /api/v1/platform-a/chat
 * @access Private
 */
export const getUserChats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const filters = req.query;

    const result = await chatService.getUserChats(userId, filters);

    res.json(
        new ApiResponse(
            200,
            {
                chats: result.chats,
                pagination: result.pagination,
            },
            "Chats retrieved successfully"
        )
    );
});

/**
 * Send message
 * @route POST /api/v1/platform-a/chat/:id/messages
 * @access Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const senderId = req.user._id;
    const messageData = req.body;
    const lang = req.language || "en";

    const message = await chatService.sendMessage(id, senderId, messageData);

    // Emit the message to all users in the chat room via Socket.IO
    emitToChat(id, "message:new", {
        messageId: message._id,
        chatId: id,
        senderId: message.senderId,
        senderRole: message.senderRole,
        content: message.content,
        messageType: message.messageType,
        attachments: message.attachments,
        timestamp: message.createdAt,
    });

    res.status(201).json(new ApiResponse(201, { message }, "Message sent successfully"));
});

/**
 * Get messages for chat
 * @route GET /api/v1/platform-a/chat/:id/messages
 * @access Private
 */
export const getMessages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const filters = req.query;

    const result = await chatService.getMessages(id, userId, filters);

    res.json(
        new ApiResponse(
            200,
            {
                messages: result.messages,
                pagination: result.pagination,
            },
            "Messages retrieved successfully"
        )
    );
});

/**
 * Mark chat as read
 * @route POST /api/v1/platform-a/chat/:id/read
 * @access Private
 */
export const markChatAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    await chatService.markChatAsRead(id, userId);

    res.json(new ApiResponse(200, {}, "Chat marked as read"));
});

/**
 * Get unread message count
 * @route GET /api/v1/platform-a/chat/unread/count
 * @access Private
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const unreadCount = await chatService.getUnreadCount(userId);

    res.json(new ApiResponse(200, { unreadCount }, "Unread count retrieved successfully"));
});

/**
 * Buyer initiates chat from listing page
 * @route POST /api/v1/platform-a/listing/:listingId/chat
 * @access Private (Buyer)
 */
export const initiateListingChat = asyncHandler(async (req, res) => {
    const { listingId } = req.params;
    const buyerId = req.user._id;
    const lang = req.language || "en";

    // Get listing to find seller
    const listing = await Listing.findById(listingId).select("sellerId");
    if (!listing) {
        throw NotFoundError("Listing not found", {}, lang);
    }

    const sellerId = listing.sellerId;

    // Check if buyer is trying to chat with themselves
    if (buyerId.toString() === sellerId.toString()) {
        return res.status(400).json(new ApiResponse(400, {}, "Cannot chat with yourself"));
    }

    // Create/get chat
    const chat = await chatService.findOrCreateDirectChat(buyerId, sellerId, listingId);

    // Notify seller (only if chat was just created or seller hasn't joined)
    const sellerParticipant = chat.participants.find(
        p => p.userId._id.toString() === sellerId.toString()
    );

    if (!sellerParticipant?.joinedAt) {
        try {
            const io = getIO();
            const chatData = {
                chatId: chat._id,
                chat: chat, // Include full chat object
                listingId,
                buyer: {
                    id: buyerId,
                    name: req.user.name,
                    avatar: req.user.avatar,
                },
                listing: chat.listingId,
                timestamp: new Date(),
            };

            // Emit to seller's personal room
            io?.to(`user:${sellerId}`).emit("chat:request", chatData);
            io?.to(`user:${sellerId}`).emit("chat:created", chatData);

            // Also emit to buyer (for their own chat list)
            io?.to(`user:${buyerId}`).emit("chat:created", chatData);

            logger.info("Chat notification sent", { chatId: chat._id, sellerId, buyerId });
        } catch (err) {
            logger.error("Failed to notify seller:", err);
        }
    }

    res.json(new ApiResponse(200, { chat }, "Chat initiated successfully"));
});

/**
 * Join chat (seller/buyer acknowledges and joins)
 * @route POST /api/v1/platform-a/chat/:id/join
 * @access Private
 */
export const joinChat = asyncHandler(async (req, res) => {
    const { id: chatId } = req.params;
    const userId = req.user._id;
    const lang = req.language || "en";

    const chat = await chatService.getChatById(chatId, userId);

    if (!chat) {
        throw new NotFoundError("Chat not found", {}, lang);
    }

    // Update joinedAt timestamp if not already joined
    const participant = chat.participants.find(
        p => p.userId._id.toString() === userId.toString()
    );

    if (participant && !participant.joinedAt) {
        participant.joinedAt = new Date();
        participant.lastReadAt = new Date();
        await chat.save();

        // Notify other user that this user joined
        const otherUser = chat.participants.find(
            p => p.userId._id.toString() !== userId.toString()
        );

        if (otherUser) {
            try {
                const io = getIO();
                io?.to(`user:${otherUser.userId._id}`).emit("chat:user-joined", {
                    chatId: chat._id,
                    user: {
                        id: userId,
                        name: req.user.name,
                        avatar: req.user.avatar,
                    },
                });
            } catch (err) {
                logger.error("Failed to notify user about join:", err);
            }
        }
    }

    res.json(new ApiResponse(200, { chat }, "Joined chat successfully"));
});

/**
 * Open or get a direct chat between current user and another user (seller)
 * POST /api/v1/platform-a/chat/open
 */
export const openOrGetDirectChat = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { userId: otherUserId, listingId } = req.body; // otherUserId is the seller's id
    const lang = req.language || 'en';

    if (!otherUserId) {
        return res.status(400).json(new ApiResponse(400, {}, 'seller userId is required'));
    }

    // Try to find existing direct chat between these two users (optionally for the listing)
    const chat = await chatService.findOrCreateDirectChat(userId, otherUserId, listingId);

    res.json(new ApiResponse(200, { chat }, 'Chat retrieved/created successfully'));
});

export default {
    getChatByTradeId,
    getChatById,
    getUserChats,
    sendMessage,
    getMessages,
    markChatAsRead,
    getUnreadCount,
    initiateListingChat,
    joinChat,
    openOrGetDirectChat,
};