import { Server } from "socket.io";
import { logger } from "../utils/logger.js";
import jwt from "jsonwebtoken";
import { jwtConfig } from "./jwt.config.js";
import cookie from "cookie";
import { ROLES } from "../constants/roles.js";

// If you have message/chat services, import them here
// import * as chatService from "../api/v1/platform-a/chat/service.js";

let io = null;

/**
 * Initialize Socket.IO server
 * @param {import('http').Server} httpServer - HTTP server instance
 */
export const initializeSocketIO = (httpServer) => {
  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
    : [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://localhost:5174",
    ];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // AUTH MIDDLEWARE
  io.use((socket, next) => {
    try {
      const rawCookie = socket.request.headers.cookie || "";
      const cookies = cookie.parse(rawCookie);
      const token =
        cookies.accessToken ||
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: Token required"));
      }

      const decoded = jwt.verify(token, jwtConfig.accessToken.secret);

      socket.userId = decoded.userId || decoded.sub;
      socket.userEmail = decoded.email;
      socket.userRole = decoded.role; // Store user role for admin room

      logger.info(`Socket authenticated for user: ${socket.userId} (role: ${socket.userRole})`);
      next();
    } catch (error) {
      logger.error("Socket authentication error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // CONNECTION HANDLER
  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.userId} (Socket ID: ${socket.id}, Role: ${socket.userRole})`);

    // personal room
    socket.join(`user:${socket.userId}`);

    // Auto-join admin room for admin users
    const adminRoles = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SUPPORT, ROLES.SUPPORT_MANAGER];
    if (socket.userRole && adminRoles.includes(socket.userRole)) {
      socket.join("admin:notifications");
      logger.info(`Admin user ${socket.userId} joined admin:notifications room`);
    }

    // --- LEGACY CHAT ROOMS (BY chatId) ------------------------------------
    socket.on("chat:join", (chatId) => {
      socket.join(`chat:${chatId}`);
      logger.info(`User ${socket.userId} joined chat room: ${chatId}`);
    });

    socket.on("chat:leave", (chatId) => {
      socket.leave(`chat:${chatId}`);
      logger.info(`User ${socket.userId} left chat room: ${chatId}`);
    });

    socket.on("chat:typing", ({ chatId, isTyping }) => {
      socket.to(`chat:${chatId}`).emit("chat:typing", {
        userId: socket.userId,
        chatId,
        isTyping,
      });
    });

    socket.on("message:read", ({ chatId, messageId }) => {
      socket.to(`chat:${chatId}`).emit("message:read", {
        userId: socket.userId,
        chatId,
        messageId,
      });
    });

    // --- TRADE-BASED CHAT ROOMS (MATCHES YOUR CLIENT socket.service.ts) ---
    // Client: socketService.joinTrade(tradeId) -> emit('join-trade', { tradeId })
    socket.on("join-trade", ({ tradeId }) => {
      if (!tradeId) return;
      socket.join(`trade:${tradeId}`);
      logger.info(`User ${socket.userId} joined trade room: ${tradeId}`);
    });

    // Client: socketService.leaveTrade(tradeId) -> emit('leave-trade', { tradeId })
    socket.on("leave-trade", ({ tradeId }) => {
      if (!tradeId) return;
      socket.leave(`trade:${tradeId}`);
      logger.info(`User ${socket.userId} left trade room: ${tradeId}`);
    });

    // Client: socketService.emitTyping(tradeId, isTyping) -> emit('typing', { tradeId, isTyping })
    // Client listens on: 'user-typing'
    socket.on("typing", ({ tradeId, isTyping }) => {
      if (!tradeId) return;
      socket.to(`trade:${tradeId}`).emit("user-typing", {
        userId: socket.userId,
        tradeId,
        isTyping,
      });
    });

    // Client: socketService.sendMessage(...) -> emit('send-message', payload)
    // Client listens on: 'new-message' and 'message:new'
    socket.on("send-message", async (payload) => {
      try {
        const { tradeId, text, type = "text", senderRole } = payload || {};

        if (!tradeId || !text) return;

        // TODO: persist message in DB using your existing service
        // const saved = await chatService.createMessageFromSocket({
        //   tradeId,
        //   senderId: socket.userId,
        //   senderRole,
        //   content: text,
        //   type,
        // });

        const msg = {
          _id: Date.now().toString(), // replace with real DB id
          tradeId,
          text,
          content: text,
          type,
          senderRole,
          senderId: socket.userId,
          createdAt: new Date().toISOString(),
        };

        // Notify other clients in this trade room
        io.to(`trade:${tradeId}`).emit("new-message", msg);
        io.to(`trade:${tradeId}`).emit("message:new", msg);
      } catch (error) {
        logger.error("Error handling send-message:", error);
      }
    });

    // TRADE STATUS UPDATES (emit from controllers using emitToTrade)
    // Client listens on: 'trade-status-update'
    // Example emit (from controller): emitToTrade(tradeId, "trade-status-update", { status, expiryTime });

    // USER ONLINE / OFFLINE
    socket.on("user:online", () => {
      socket.broadcast.emit("user:status", {
        userId: socket.userId,
        status: "online",
      });
    });

    socket.on("disconnect", (reason) => {
      logger.info(`User disconnected: ${socket.userId} (Reason: ${reason})`);

      socket.broadcast.emit("user:status", {
        userId: socket.userId,
        status: "offline",
      });
    });

    socket.on("error", (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  logger.info("Socket.IO server initialized successfully");
  return io;
};

/**
 * Get Socket.IO instance
 * @returns {Server|null}
 */
export const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized. Call initializeSocketIO first."
    );
  }
  return io;
};

/**
 * Emit event to specific user
 */
export const emitToUser = (userId, event, data) => {
  if (io && userId) {
    const room = `user:${userId.toString()}`;
    const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
    logger.info(`📤 Emitting "${event}" to room: ${room} (Size: ${roomSize})`, { userId, event, dataType: data?.type });
    io.to(room).emit(event, data);
  } else {
    logger.warn("⚠️ emitToUser called but io or userId is missing", { hasIO: !!io, userId });
  }
};

/**
 * Emit event to specific chat room
 */
export const emitToChat = (chatId, event, data) => {
  if (io && chatId) {
    io.to(`chat:${chatId.toString()}`).emit(event, data);
  }
};

/**
 * Emit event to specific trade
 */
export const emitToTrade = (tradeId, event, data) => {
  if (io && tradeId) {
    io.to(`trade:${tradeId.toString()}`).emit(event, data);
  }
};

/**
 * Broadcast event to all connected clients
 */
export const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

/**
 * Emit event to all connected admins
 */
export const emitToAdmins = (event, data) => {
  if (io) {
    io.to("admin:notifications").emit(event, data);
    logger.info(`Emitted ${event} to admin:notifications room`, { data });
  }
};

// Order / Trade events (unchanged – they use emitToUser/emitToTrade)
export const emitOrderCreated = (trade) => {
  const data = {
    tradeId: trade._id,
    status: trade.status,
    cryptoAmount: trade.cryptoAmount,
    totalINR: trade.totalINRAmount,
    expiresAt: trade.expiresAt,
    isInstantSeller: trade.isInstantSeller,
  };

  emitToUser(trade.buyerId, "order:created", data);
  emitToUser(trade.sellerId, "order:created", data);
  emitToTrade(trade._id, "order:created", data);
};

export const emitDepositRequired = (trade) => {
  const data = {
    tradeId: trade._id,
    requiredAmount: trade.sellerMustSend,
    expiresAt: trade.expiresAt,
    timerMinutes: 30,
  };

  emitToUser(trade.sellerId, "order:deposit_required", data);
  emitToTrade(trade._id, "order:deposit_required", data);
};

export const emitDepositSubmitted = (trade) => {
  const data = {
    tradeId: trade._id,
    status: trade.status,
    txHash: trade.escrowTransactionHash,
  };

  emitToUser(trade.buyerId, "order:deposit_submitted", data);
  emitToUser(trade.sellerId, "order:deposit_submitted", data);
  emitToTrade(trade._id, "order:deposit_submitted", data);
};

export const emitEscrowConfirmed = (trade) => {
  const data = {
    tradeId: trade._id,
    status: trade.status,
    amountToPay: trade.totalINRAmount,
    expiresAt: trade.expiresAt,
    timerMinutes: 30,
  };

  emitToUser(trade.buyerId, "order:escrow_confirmed", data);
  emitToUser(trade.sellerId, "order:escrow_confirmed", data);
  emitToTrade(trade._id, "order:escrow_confirmed", data);
};

export const emitPaymentTimer = (trade, remainingMinutes) => {
  const data = {
    tradeId: trade._id,
    remainingMinutes,
    expiresAt: trade.expiresAt,
  };

  emitToTrade(trade._id, "order:payment_timer", data);
};

export const emitPaymentUploaded = (trade) => {
  const data = {
    tradeId: trade._id,
    status: trade.status,
    proofUrl: trade.buyerPaymentProof?.proofUrl,
    utrNumber: trade.buyerPaymentProof?.utrNumber,
    expiresAt: trade.expiresAt,
    timerMinutes: 15,
  };

  emitToUser(trade.sellerId, "order:payment_uploaded", data);
  emitToUser(trade.buyerId, "order:payment_uploaded", data);
  emitToTrade(trade._id, "order:payment_uploaded", data);
};

export const emitOrderPaymentConfirmed = (trade) => {
  const data = {
    tradeId: trade._id,
    status: trade.status,
    confirmedAt: new Date(),
  };

  emitToUser(trade.buyerId, "order:payment_confirmed", data);
  emitToTrade(trade._id, "order:payment_confirmed", data);
};

export const emitConfirmTimer = (trade, remainingMinutes) => {
  const data = {
    tradeId: trade._id,
    remainingMinutes,
    expiresAt: trade.expiresAt,
  };

  emitToTrade(trade._id, "order:confirm_timer", data);
};

export const emitOrderCompleted = (trade) => {
  const data = {
    tradeId: trade._id,
    status: trade.status,
    completedAt: trade.completedAt,
    releaseHash: trade.escrowReleaseHash,
  };

  emitToUser(trade.buyerId, "order:completed", data);
  emitToUser(trade.sellerId, "order:completed", data);
  emitToTrade(trade._id, "order:completed", data);
};

export const emitOrderDisputed = (trade, dispute) => {
  const data = {
    tradeId: trade._id,
    status: trade.status,
    disputeId: dispute._id,
    reason: dispute.reason,
  };

  emitToUser(trade.buyerId, "order:disputed", data);
  emitToUser(trade.sellerId, "order:disputed", data);
  emitToTrade(trade._id, "order:disputed", data);
};

export const emitOrderCancelled = (trade, reason) => {
  const data = {
    tradeId: trade._id,
    status: trade.status,
    reason: reason || trade.cancellationReason,
    cancelledAt: trade.cancelledAt,
  };

  emitToUser(trade.buyerId, "order:cancelled", data);
  emitToUser(trade.sellerId, "order:cancelled", data);
  emitToTrade(trade._id, "order:cancelled", data);
};

export const emitOrderAppealed = (trade) => {
  const data = {
    tradeId: trade._id,
    status: trade.status,
    appealReason: trade.appealReason,
    appealedAt: trade.appealedAt,
  };

  emitToUser(trade.buyerId, "order:appealed", data);
  emitToUser(trade.sellerId, "order:appealed", data);
  emitToTrade(trade._id, "order:appealed", data);
};

export const emitChatForm = (chatId, message) => {
  emitToChat(chatId, "chat:form", {
    messageId: message._id,
    formType: message.metadata?.formType,
    data: message.metadata?.data,
    content: message.content,
  });
};

export const emitSystemMessage = (chatId, message) => {
  emitToChat(chatId, "chat:system_message", {
    messageId: message._id,
    content: message.content,
    metadata: message.metadata,
    createdAt: message.createdAt,
  });
};

export default {
  initializeSocketIO,
  getIO,
  emitToUser,
  emitToChat,
  emitToTrade,
  broadcast,
  emitToAdmins,
  emitOrderCreated,
  emitDepositRequired,
  emitDepositSubmitted,
  emitEscrowConfirmed,
  emitPaymentTimer,
  emitPaymentUploaded,
  emitOrderPaymentConfirmed,
  emitConfirmTimer,
  emitOrderCompleted,
  emitOrderDisputed,
  emitOrderCancelled,
  emitOrderAppealed,
  emitChatForm,
  emitSystemMessage,
};
