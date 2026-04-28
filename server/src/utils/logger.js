// src/utils/logger.js
import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logDir = process.env.LOG_DIR || path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define log colors
const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
};

winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf((info) => {
        const { timestamp, level, message, ...meta } = info;
        let metaString = "";

        if (Object.keys(meta).length > 0) {
            // Filter out stack traces for cleaner console output
            const { stack, ...cleanMeta } = meta;
            if (Object.keys(cleanMeta).length > 0) {
                metaString = `\n${JSON.stringify(cleanMeta, null, 2)}`;
            }
            if (stack && level === "error") {
                metaString += `\n${stack}`;
            }
        }

        return `[${timestamp}] ${level}: ${message}${metaString}`;
    })
);

// Define transports
const transports = [];

// Console transport (always enabled)
transports.push(
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env.LOG_LEVEL || "info",
    })
);

// File transport for errors
transports.push(
    new winston.transports.File({
        filename: path.join(logDir, "error.log"),
        level: "error",
        format: logFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5,
    })
);

// File transport for all logs
transports.push(
    new winston.transports.File({
        filename: path.join(logDir, "combined.log"),
        format: logFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 10,
    })
);

// File transport for HTTP requests
transports.push(
    new winston.transports.File({
        filename: path.join(logDir, "http.log"),
        level: "http",
        format: logFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5,
    })
);

// File transport for audit logs (security-sensitive actions)
transports.push(
    new winston.transports.File({
        filename: path.join(logDir, "audit.log"),
        format: logFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 30, // Keep longer for compliance
    })
);

// Create logger instance
export const logger = winston.createLogger({
    levels,
    level: process.env.LOG_LEVEL || "info",
    format: logFormat,
    transports,
    exitOnError: false,
});

// Morgan stream for HTTP logging
export const morganStream = {
    write: (message) => {
        logger.http(message.trim());
    },
};

// Audit logger for security-sensitive actions
export const auditLogger = {
    log: (action, userId, details = {}) => {
        logger.info("AUDIT", {
            action,
            userId,
            timestamp: new Date().toISOString(),
            ...details,
        });
    },
};

/**
 * Log wrapper for service errors
 */
export const logError = (context, error, additionalInfo = {}) => {
    logger.error(`[${context}] ${error.message}`, {
        error: error.message,
        stack: error.stack,
        ...additionalInfo,
    });
};

/**
 * Log wrapper for service info
 */
export const logInfo = (context, message, additionalInfo = {}) => {
    logger.info(`[${context}] ${message}`, additionalInfo);
};

/**
 * Log wrapper for service warnings
 */
export const logWarn = (context, message, additionalInfo = {}) => {
    logger.warn(`[${context}] ${message}`, additionalInfo);
};

/**
 * Log wrapper for service debug
 */
export const logDebug = (context, message, additionalInfo = {}) => {
    logger.debug(`[${context}] ${message}`, additionalInfo);
};

export default logger;
