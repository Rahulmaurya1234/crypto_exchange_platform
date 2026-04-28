// src/config/bullmq.config.js

/**
 * Get Redis connection configuration for BullMQ
 * Works with both REDIS_URL (production) and individual env vars (local)
 */
const getRedisConnection = () => {
    // Check if REDIS_URL exists (Render/production)
    if (process.env.REDIS_URL) {
        // Production: Parse REDIS_URL
        const url = new URL(process.env.REDIS_URL);
        
        return {
            host: url.hostname,
            port: parseInt(url.port) || 6379,
            password: url.password || undefined,
            db: parseInt(url.pathname.slice(1)) || 0,
        };
    } else {
        // Local development: Use individual environment variables
        return {
            host: process.env.BULLMQ_REDIS_HOST || process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.BULLMQ_REDIS_PORT || process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            db: parseInt(process.env.REDIS_DB) || 0,
        };
    }
};

/**
 * BullMQ Queue Configuration
 */
export const bullmqConfig = {
    connection: getRedisConnection(),

    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
    },

    // Queue-specific configurations
    queues: {
        kycVerification: {
            name: "kyc-verification",
            options: {
                attempts: 5,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
            },
        },

        escrowMonitor: {
            name: "escrow-monitor",
            options: {
                attempts: 10,
                backoff: {
                    type: "exponential",
                    delay: 3000,
                },
            },
        },

        tradeTimeout: {
            name: "trade-timeout",
            options: {
                attempts: 3,
                backoff: {
                    type: "fixed",
                    delay: 10000,
                },
            },
        },

        notification: {
            name: "notification",
            options: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000,
                },
            },
        },

        feeSweep: {
            name: "fee-sweep",
            options: {
                attempts: 5,
                backoff: {
                    type: "exponential",
                    delay: 10000,
                },
            },
        },

        emailQueue: {
            name: "email-queue",
            options: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 2000,
                },
            },
        },

        smsQueue: {
            name: "sms-queue",
            options: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 2000,
                },
            },
        },
    },
};

export default bullmqConfig;