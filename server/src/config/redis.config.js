// src/config/redis.config.js
import { createClient } from "redis";
import { logger } from "../utils/logger.js";

let redisClient = null;

/**
 * Get Redis connection configuration
 * Works with both REDIS_URL (production) and individual env vars (local)
 */
export const getRedisConfig = () => {
    // Check if REDIS_URL exists (Render/production)
    if (process.env.REDIS_URL) {
        // Production: Parse REDIS_URL
        const url = new URL(process.env.REDIS_URL);
        
        const config = {
            host: url.hostname,
            port: parseInt(url.port) || 6379,
            password: url.password || undefined,
            db: parseInt(url.pathname.slice(1)) || 0,
            url: process.env.REDIS_URL,
        };
        
        logger.info("🔗 Using REDIS_URL for connection", {
            host: config.host,
            port: config.port
        });
        
        return config;
    } else {
        // Local development: Use individual environment variables
        const host = process.env.REDIS_HOST || "localhost";
        const port = parseInt(process.env.REDIS_PORT) || 6379;
        const password = process.env.REDIS_PASSWORD || undefined;
        const db = parseInt(process.env.REDIS_DB) || 0;

        const config = {
            host,
            port,
            password,
            db,
            socket: {
                host,
                port,
            },
            database: db,
        };
        
        logger.info("🔗 Using REDIS_HOST/PORT for connection", {
            host,
            port
        });
        
        return config;
    }
};

/**
 * Initialize Redis connection
 */
export const connectRedis = async () => {
    try {
        const config = getRedisConfig();
        
        // Create client with appropriate config
        if (config.url) {
            redisClient = createClient({ url: config.url });
        } else {
            redisClient = createClient({
                socket: config.socket,
                password: config.password,
                database: config.database,
            });
        }

        redisClient.on("error", (err) => {
            logger.error("❌ Redis Client Error:", { 
                code: err.code, 
                message: err.message 
            });
        });

        redisClient.on("connect", () => {
            logger.info("🔄 Redis Client Connecting...");
        });

        redisClient.on("ready", () => {
            logger.info("✅ Redis Client Ready");
        });

        redisClient.on("reconnecting", () => {
            logger.warn("⚠️ Redis Client Reconnecting...");
        });

        await redisClient.connect();

        logger.info("✅ Redis Connected Successfully");

        return redisClient;
    } catch (error) {
        logger.error("❌ Redis Connection Failed:", error);
        throw error;
    }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = () => {
    if (!redisClient || !redisClient.isOpen) {
        throw new Error("Redis client is not connected");
    }
    return redisClient;
};

/**
 * Export redisClient for direct access
 */
export { redisClient };

/**
 * Close Redis connection gracefully
 */
export const disconnectRedis = async () => {
    try {
        if (redisClient && redisClient.isOpen) {
            await redisClient.quit();
            logger.info("✅ Redis connection closed gracefully");
        }
    } catch (error) {
        logger.error("❌ Error closing Redis connection:", error);
        throw error;
    }
};

/**
 * Redis health check
 */
export const checkRedisHealth = async () => {
    try {
        if (!redisClient || !redisClient.isOpen) {
            return { status: "unhealthy", message: "Redis not connected" };
        }

        await redisClient.ping();
        return { status: "healthy", message: "Redis is responsive" };
    } catch (error) {
        return { status: "unhealthy", message: error.message };
    }
};

export default {
    connectRedis,
    getRedisClient,
    getRedisConfig,
    disconnectRedis,
    checkRedisHealth,
};