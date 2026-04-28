// src/config/database.config.js
import mongoose from "mongoose";
import fs from "fs";
import { logger } from "../utils/logger.js";

/**
 * Get database configuration based on environment
 * Development: MongoDB
 * Production: AWS DocumentDB
 */
export const getDatabaseConfig = () => {
    const env = process.env.NODE_ENV || "development";

    if (env === "production" && process.env.AWS_DOCUMENTDB_URI) {
        // AWS DocumentDB Configuration
        const config = {
            uri: process.env.AWS_DOCUMENTDB_URI,
            dbName: process.env.DBNAME || "cryptians_prod",
            options: {
                retryWrites: false, // DocumentDB doesn't support retryWrites
                maxPoolSize: 50,
                minPoolSize: 10,
                socketTimeoutMS: 45000,
                serverSelectionTimeoutMS: 5000,
            },
        };

        // SSL/TLS for DocumentDB
        if (process.env.AWS_DOCUMENTDB_CA_CERT) {
            try {
                config.options.ssl = true;
                config.options.sslValidate = true;
                config.options.sslCA = fs.readFileSync(process.env.AWS_DOCUMENTDB_CA_CERT);

                if (process.env.AWS_DOCUMENTDB_REPLICA_SET) {
                    config.options.replicaSet = process.env.AWS_DOCUMENTDB_REPLICA_SET;
                }
            } catch (error) {
                logger.error("Failed to load AWS DocumentDB CA certificate:", error);
                throw new Error("AWS DocumentDB SSL certificate not found");
            }
        }

        return config;
    }

    // MongoDB Configuration (Development/Staging)
    return {
        uri: process.env.MONGO_URI || "mongodb://localhost:27017",
        dbName: process.env.DBNAME || "cryptians_dev",
        options: {
            maxPoolSize: 20,
            minPoolSize: 5,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            autoIndex: env === "development", // Only in development
        },
    };
};

/**
 * Connect to database with retry logic
 */
export const connectDB = async (maxRetries = 5, retryDelay = 5000) => {
    const config = getDatabaseConfig();
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await mongoose.connect(config.uri, {
                dbName: config.dbName,
                ...config.options,
            });

            const dbType = process.env.NODE_ENV === "production" && process.env.AWS_DOCUMENTDB_URI
                ? "AWS DocumentDB"
                : "MongoDB";

            logger.info("✅ Database Connected Successfully", {
                type: dbType,
                database: mongoose.connection.name,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
            });

            // Connection event listeners
            mongoose.connection.on("error", (err) => {
                logger.error("❌ Database connection error:", err);
            });

            mongoose.connection.on("disconnected", () => {
                logger.warn("⚠️ Database disconnected");
            });

            mongoose.connection.on("reconnected", () => {
                logger.info("🔄 Database reconnected");
            });

            return mongoose.connection;
        } catch (error) {
            retries++;
            logger.error(`❌ Database Connection Failed (Attempt ${retries}/${maxRetries}):`, {
                error: error.message,
                stack: error.stack,
            });

            if (retries >= maxRetries) {
                logger.error("❌ Max database connection retries reached. Exiting...");
                process.exit(1);
            }

            logger.info(`⏳ Retrying database connection in ${retryDelay / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
    }
};

/**
 * Graceful database disconnection
 */
export const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        logger.info("✅ Database connection closed gracefully");
    } catch (error) {
        logger.error("❌ Error closing database connection:", error);
        throw error;
    }
};

/**
 * Health check for database
 */
export const checkDBHealth = () => {
    const state = mongoose.connection.readyState;
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };

    return {
        status: state === 1 ? "healthy" : "unhealthy",
        state: states[state],
        host: mongoose.connection.host,
        name: mongoose.connection.name,
    };
};

export default {
    connectDB,
    disconnectDB,
    getDatabaseConfig,
    checkDBHealth,
};
