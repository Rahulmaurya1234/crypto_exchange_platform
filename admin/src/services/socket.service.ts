// src/services/socket.service.ts
import { io, Socket } from "socket.io-client";

export interface AdminNotification {
    _id: string;
    type: string;
    title: string;
    message: string;
    status: "unread" | "read" | "archived";
    relatedModel?: string;
    relatedId?: string;
    targetUserId?: string;
    targetUserName?: string;
    targetUserEmail?: string;
    performedBy?: string;
    performedByName?: string;
    metadata?: any;
    actionUrl?: string;
    createdAt: string;
    readAt?: string;
}

class SocketService {
    private socket: Socket | null = null;
    private notificationCallback: ((notification: AdminNotification) => void) | null = null;

    private getCookie(name: string): string | undefined {
        if (typeof document === "undefined") return undefined;

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

        const accessToken = this.getCookie("accessToken");
        console.log("[admin socket] Connecting socket with token:", accessToken ? "present" : "missing");

        this.socket = io(url, {
            auth: accessToken ? { token: accessToken } : undefined,
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
            console.log("✅ Admin Socket connected:", this.socket?.id);
        });

        this.socket.on("disconnect", (reason) => {
            console.log("❌ Admin Socket disconnected:", reason);
        });

        this.socket.on("connect_error", (err) => {
            console.error("Admin Socket connect_error:", err.message);
        });

        this.socket.on("error", (err) => {
            console.error("Admin Socket error:", err);
        });

        // Listen for admin notifications
        this.socket.on("admin:notification", (data: { notification: AdminNotification }) => {
            console.log("📢 Admin notification received:", data);
            if (this.notificationCallback) {
                this.notificationCallback(data.notification);
            }
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Set callback for receiving notifications
    onNotification(callback: (notification: AdminNotification) => void) {
        this.notificationCallback = callback;
    }

    // Remove notification callback
    offNotification() {
        this.notificationCallback = null;
    }

    isConnected() {
        return this.socket?.connected ?? false;
    }

    getSocket() {
        return this.socket;
    }

    removeAllListeners() {
        this.socket?.removeAllListeners();
    }
}

export const socketService = new SocketService();
export default socketService;
