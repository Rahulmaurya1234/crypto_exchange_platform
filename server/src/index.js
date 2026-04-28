// src/index.js
import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import { connectDB, disconnectDB } from "./config/database.config.js";
import { connectRedis, disconnectRedis } from "./config/redis.config.js";
import { validateJwtConfig } from "./config/jwt.config.js";
import { initializeSocketIO } from "./config/socket.config.js";
import { initializeWorkers, closeWorkers } from "./workers/index.js";
import { logger } from "./utils/logger.js";

/**
 * Start server with all connections
 */
const startServer = async () => {
  try {
    // Validate critical configurations
    logger.info("Validating configurations...");
    validateJwtConfig();

    // Use Render-provided PORT
    const PORT = parseInt(process.env.PORT, 10);
    if (!PORT) {
      logger.error("❌ PORT environment variable not set. Exiting.");
      process.exit(1);
    }

    // Create HTTP server
    const httpServer = createServer(app);

    // Start HTTP server immediately so Render can detect the port
    const server = httpServer.listen(PORT, () => {
      logger.info("🚀 ========================================");
      logger.info(`🚀 Cryptians P2P Marketplace API Started`);
      logger.info("🚀 ========================================");
      logger.info(`📡 Server listening on port ${PORT}`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Client URL: ${process.env.CLIENT_URL}`);
      logger.info(`📊 Health Check: /health`);
      logger.info(`📚 API Docs: /api/docs`);
      logger.info(`🔌 WebSocket: Enabled`);
      logger.info("🚀 ========================================");
    });

    // Initialize async services AFTER server is listening
    (async () => {
      try {
        logger.info("Connecting to database...");
        await connectDB();

        logger.info("Connecting to Redis...");
        await connectRedis();

        logger.info("Initializing Socket.IO...");
        initializeSocketIO(httpServer);

        logger.info("Initializing BullMQ workers...");
        initializeWorkers();
      } catch (error) {
        logger.error("❌ Error during async initialization:", error);
        process.exit(1);
      }
    })();

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      server.close(async () => {
        logger.info("HTTP server closed");

        try {
          await closeWorkers();
          logger.info("Workers closed");

          await disconnectDB();
          logger.info("Database connection closed");

          await disconnectRedis();
          logger.info("Redis connection closed");

          logger.info("Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          logger.error("Error during graceful shutdown:", error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error("Forcing shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("UNHANDLED_REJECTION");
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
// Trigger restart
// Trigger nodemon restart
// Trigger nodemon restart 2
// Trigger nodemon restart 3
