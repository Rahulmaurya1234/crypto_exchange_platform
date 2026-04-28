import { io, Socket } from "socket.io-client";

export type SenderRole = "buyer" | "seller" | "admin" | "system";

export interface RawServerMessage {
  messageId: string;
  chatId?: string;
  tradeId?: string;
  senderId?: string | { _id?: string };
  sender?: any;
  senderRole?: SenderRole;
  content?: string;
  messageType?: string;
  attachments?: any[];
  timestamp?: string | Date;
}

export interface ChatMessage {
  id: string;
  chatId?: string;
  tradeId?: string;
  senderId?: string;
  sender?: any;
  role?: SenderRole;
  content?: string;
  type?: string;
  attachments?: any[];
  timestamp?: string | Date;
}

class SocketService {
  private socket: Socket | null = null;

  // ✅ correct method syntax
  private getCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined; // SSR safety

    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));

    return value ? decodeURIComponent(value.split("=")[1]) : undefined;
  }

  connect(baseURL?: string) {
    if (this.socket?.connected) return;

    const url =
      baseURL ||
      (import.meta.env.VITE_API_URL as string) ||
      "http://localhost:5000";

    const accessToken = this.getCookie("accessToken"); // ✅ use this.
    console.log("[socket] document.cookie:", document.cookie);
    console.log("[socket] Connecting socket with token:", accessToken);

    this.socket = io(url, {
      auth: accessToken
        ? { token: accessToken } // only send if present
        : undefined,
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });

    this.setupDefaultListeners();
  }

  private setupDefaultListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id);
      this.socket?.emit("user:online");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket connect_error:", err);
    });

    this.socket.on("error", (err) => {
      console.error("Socket error:", err);
    });

    this.socket.on("user:status", (payload) => {
      console.log("user:status", payload);
    });

    // Listen for general notifications
    this.socket.on("notification", (data) => {
      console.log("📢 Notification received:", data);
      if (this.notificationCallback) {
        this.notificationCallback(data);
      }
    });

    // Listen for deposit status updates
    this.socket.on("deposit:status_updated", (data) => {
      console.log("💰 Deposit status updated:", data);
      if (this.depositStatusCallback) {
        this.depositStatusCallback(data);
      }
    });
  }

  // Notification callbacks
  private notificationCallback: ((data: any) => void) | null = null;
  private depositStatusCallback: ((data: any) => void) | null = null;

  // Set up notification listener
  onNotification(callback: (data: any) => void) {
    this.notificationCallback = callback;
  }

  offNotification() {
    this.notificationCallback = null;
  }

  // Set up deposit status listener
  onDepositStatusUpdate(callback: (data: any) => void) {
    this.depositStatusCallback = callback;
  }

  offDepositStatusUpdate() {
    this.depositStatusCallback = null;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinTrade(tradeId: string) {
    this.socket?.emit("join-trade", { tradeId });
  }
  leaveTrade(tradeId: string) {
    this.socket?.emit("leave-trade", { tradeId });
  }
  joinListing(listingId: string) {
    this.socket?.emit("listing:join", listingId);
  }
  leaveListing(listingId: string) {
    this.socket?.emit("listing:leave", listingId);
  }
  joinChat(chatId: string) {
    this.socket?.emit("chat:join", chatId);
  }
  leaveChat(chatId: string) {
    this.socket?.emit("chat:leave", chatId);
  }

  emitTyping(tradeId: string, isTyping: boolean) {
    this.socket?.emit("typing", { tradeId, isTyping });
  }
  onTyping(
    callback: (data: { userId: string; tradeId?: string; isTyping: boolean }) => void
  ) {
    this.socket?.on("user-typing", callback);
  }
  offTyping() {
    this.socket?.off("user-typing");
  }

  async sendMessage(payload: {
    listingId?: string;
    tradeId?: string;
    chatId?: string;
    text: string;
    type?: string;
    senderRole?: SenderRole;
  }): Promise<RawServerMessage> {
    if (!this.socket) throw new Error("Socket not connected");

    return new Promise((resolve, reject) => {
      if (
        (!payload.listingId && !payload.tradeId && !payload.chatId) ||
        !payload.text
      ) {
        return reject(
          new Error(
            "Invalid payload: text + one of listingId|tradeId|chatId required"
          )
        );
      }

      this.socket!.emit(
        "send-message",
        payload,
        (err: any, saved: RawServerMessage) => {
          if (err) return reject(err);
          resolve(saved);
        }
      );
    });
  }

  onMessage(callback: (m: ChatMessage) => void) {
    if (!this.socket) return;

    const handler = (raw: RawServerMessage) => {
      try {
        callback(this.normalizeMessage(raw));
      } catch (e) {
        console.error("onMessage handler error:", e);
      }
    };

    this.socket.on("new-message", handler);
    this.socket.on("message:new", handler);
  }

  offMessage() {
    this.socket?.off("new-message");
    this.socket?.off("message:new");
  }

  onTradeStatusUpdate(callback: (data: any) => void) {
    this.socket?.on("trade-status-update", callback);
  }
  offTradeStatusUpdate() {
    this.socket?.off("trade-status-update");
  }

  onPaymentUploaded(callback: (data: any) => void) {
    this.socket?.on("order:payment_uploaded", callback);
  }
  offPaymentUploaded() {
    this.socket?.off("order:payment_uploaded");
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
  isConnected() {
    return this.socket?.connected ?? false;
  }
  getSocket() {
    return this.socket;
  }
  onReviewSubmitted(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('trade:review-submitted', callback);
  }

  offReviewSubmitted() {
    if (!this.socket) return;
    this.socket.off('trade:review-submitted');
  }

  emitReviewSubmitted(tradeId: string, reviewData: any) {
    if (!this.socket) return;
    this.socket.emit('trade:review-submitted', { tradeId, ...reviewData });
  }
  private normalizeMessage(raw: RawServerMessage): ChatMessage {
    const senderId =
      typeof raw.senderId === "string"
        ? raw.senderId
        : (raw.senderId && (raw.senderId as any)._id) || undefined;

    return {
      id: String(raw.messageId),
      chatId: raw.chatId,
      tradeId: raw.tradeId,
      senderId,
      sender: raw.sender,
      role: raw.senderRole,
      content: raw.content,
      type: raw.messageType,
      attachments: raw.attachments,
      timestamp: raw.timestamp,
    };
  }
}

export const socketService = new SocketService();
export default socketService;
