// src/routes/index.js
// Platform A Routes (User-facing)
import authroutes from "../api/v1/platform-a/auth/index.js";
import kycRoutes from "../api/v1/platform-a/kyc/index.js";
import listingRoutes from "../api/v1/platform-a/listings/index.js";
import { tradeRoutes } from "../api/v1/platform-a/trades/index.js";
import { chatRoutes } from "../api/v1/platform-a/chat/index.js";
import { profileRoutes } from "../api/v1/platform-a/profile/index.js";
import { walletRoutes } from "../api/v1/platform-a/wallet/index.js";
import { reviewRoutes } from "../api/v1/platform-a/reviews/index.js";
import notificationRoutes from "../api/v1/platform-a/notifications/index.js";
// Utility Routes
import uploadRoutes from "./upload.route.js";

// Platform B Routes (Admin-facing)
import { authRoutes as adminAuthRoutes } from "../api/v1/platform-b/auth/index.js";
import { adminRoutes } from "../api/v1/platform-b/admin/index.js";
import { analyticsRoutes } from "../api/v1/platform-b/analytics/index.js";
import { disputeRoutes } from "../api/v1/platform-b/disputes/index.js";
import { escrowRoutes } from "../api/v1/platform-b/escrow/index.js";
import { supportRoutes } from "../api/v1/platform-b/support/index.js";
import { adminApproveListing } from "../api/v1/platform-b/listings/index.js";
import { tradesRoutes as tradeRoutesB } from "../api/v1/platform-b/trades/index.js";


/**
 * Register all API routes
 * @param {Express} app - Express application instance
 */
export const registerRoutes = (app) => {
    // API version prefix
    const API_VERSION = "/api/v1";

    // ==================== PLATFORM A ROUTES (User-facing) ====================
    app.use(`${API_VERSION}/platform-a/auth`, authroutes.auth);
    app.use(`${API_VERSION}/platform-a/users`, authroutes.userRoutes);
    app.use(`${API_VERSION}/platform-a/kyc`, kycRoutes);
    app.use(`${API_VERSION}/platform-a/listings`, listingRoutes);
    app.use(`${API_VERSION}/platform-a/trades`, tradeRoutes);
    app.use(`${API_VERSION}/platform-a/chat`, chatRoutes);
    app.use(`${API_VERSION}/platform-a/profile`, profileRoutes);
    app.use(`${API_VERSION}/platform-a/wallet`, walletRoutes);
    app.use(`${API_VERSION}/platform-a/reviews`, reviewRoutes);
    app.use(`${API_VERSION}/platform-a/notifications`, notificationRoutes);

    // ==================== UTILITY ROUTES ====================
    app.use(`${API_VERSION}/upload`, uploadRoutes);

    // ==================== PLATFORM B ROUTES (Admin-facing) ====================
    app.use(`${API_VERSION}/platform-b/auth`, adminAuthRoutes);
    app.use(`${API_VERSION}/platform-b/admin`, adminRoutes);
    app.use(`${API_VERSION}/platform-b/analytics`, analyticsRoutes);
    app.use(`${API_VERSION}/platfrom-b/listings/admin`, adminApproveListing);
    app.use(`${API_VERSION}/platform-b/disputes`, disputeRoutes);
    app.use(`${API_VERSION}/platform-b/escrow`, escrowRoutes);
    app.use(`${API_VERSION}/platform-b/support`, supportRoutes);
    app.use(`${API_VERSION}/platform-b/trades`, tradeRoutesB);
    // ==================== UTILITY ENDPOINTS ====================

    // Health check endpoint (no prefix)
    app.get("/health", (req, res) => {
        res.json({
            status: "OK",
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            uptime: process.uptime(),
        });
    });

    // API documentation redirect
    app.get("/", (req, res) => {
        res.json({
            message: "Cryptians P2P Marketplace API",
            version: "1.0.0",
            documentation: `${req.protocol}://${req.get("host")}/api/docs`,
            health: `${req.protocol}://${req.get("host")}/health`,
            endpoints: {
                platformA: [
                    `${API_VERSION}/auth`,
                    `${API_VERSION}/users`,
                    `${API_VERSION}/platform-a/kyc`,
                    `${API_VERSION}/platform-a/listings`,
                    `${API_VERSION}/platform-a/trades`,
                    `${API_VERSION}/platform-a/chat`,
                    `${API_VERSION}/platform-a/profile`,
                    `${API_VERSION}/platform-a/wallet`,
                ],
                platformB: [
                    `${API_VERSION}/platform-b/auth`,
                    `${API_VERSION}/platform-b/admin`,
                    `${API_VERSION}/platform-b/analytics`,
                    `${API_VERSION}/platform-b/disputes`,
                    `${API_VERSION}/platform-b/escrow`,
                    `${API_VERSION}/platform-b/support`,
                ],
            },
        });
    });
};

export default registerRoutes;
