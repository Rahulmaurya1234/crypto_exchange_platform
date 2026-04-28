// src/api/v1/platform-a/chat/routes.js
import { Router } from "express";
import * as chatController from "./controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";

const router = Router();

/**
 * @route   GET /api/v1/platform-a/chat/unread/count
 * @desc    Get unread message count
 * @access  Private
 */
router.get("/unread/count", auth, chatController.getUnreadCount);

/**
 * @route   GET /api/v1/platform-a/chat/trade/:tradeId
 * @desc    Get chat by trade ID
 * @access  Private
 */
router.get("/trade/:tradeId", auth, chatController.getChatByTradeId);

/**
 * @route   POST /api/v1/platform-a/chat/listing/:listingId/chat
 * @desc    Buyer initiates chat from listing page
 * @access  Private
 */
router.post("/listing/:listingId/chat", auth, chatController.initiateListingChat);

/**
 * @route   GET /api/v1/platform-a/chat
 * @desc    Get user's chats
 * @access  Private
 */
router.get("/", auth, chatController.getUserChats);

/**
 * @route   GET /api/v1/platform-a/chat/:id
 * @desc    Get chat by ID
 * @access  Private
 */
router.get("/:id", auth, chatController.getChatById);

/**
 * @route   GET /api/v1/platform-a/chat/:id/messages
 * @desc    Get messages for chat
 * @access  Private
 */
router.get("/:id/messages", auth, chatController.getMessages);

/**
 * @route   POST /api/v1/platform-a/chat/:id/messages
 * @desc    Send message
 * @access  Private
 */
router.post("/:id/messages", auth, chatController.sendMessage);

/**
 * @route   POST /api/v1/platform-a/chat/:id/read
 * @desc    Mark chat as read
 * @access  Private
 */
router.post("/:id/read", auth, chatController.markChatAsRead);

/**
 * @route   POST /api/v1/platform-a/chat/open
 * @desc    Open or get a direct chat between current user and another user (seller)
 * @access  Private
 */
router.post('/open', auth, chatController.openOrGetDirectChat);

/**
 * @route   POST /api/v1/platform-a/chat/:id/join
 * @desc    Join chat (seller/buyer acknowledges and joins)
 * @access  Private
 */
router.post('/:id/join', auth, chatController.joinChat);

export default router;