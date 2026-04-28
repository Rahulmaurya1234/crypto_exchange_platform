// src/app.js
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { languageMiddleware } from "./locales/index.js";
import { morganStream, logger } from "./utils/logger.js";
import morgan from "morgan";
import { checkDBHealth } from "./config/database.config.js";
import { checkRedisHealth } from "./config/redis.config.js";
// Import error middleware
import {
    errorHandler,
    notFoundHandler,
    errorMiddlewareStack,
} from "./middleware/error.middleware.js";
import registerRoutes from "./routes/index.js";

// Required for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------------------
// Trust Proxy (for rate limiting behind reverse proxy)
// ---------------------
app.set("trust proxy", 1);

// ---------------------
// Security Headers
// ---------------------
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    },
}));

// ---------------------
// CORS - Manual Implementation
// ---------------------
const allowedOrigins = process.env.CLIENT_URL
? process.env.CLIENT_URL.split(",").map(url => url.trim())
: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:5174",
    "https://cryptians-client.vercel.app",
    "https://cryptians-admin.vercel.app"
];

logger.info(`🌐 CLIENT_URL from env: ${process.env.CLIENT_URL}`);
// Log allowed origins for debugging
logger.info(`🌐 Allowed CORS origins: ${JSON.stringify(allowedOrigins)}`);

app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        logger.info(`✅ CORS allowed for: ${origin}`);
    } else {
        res.setHeader("Access-Control-Allow-Origin", "null"); // or don't set
        logger.warn(`❌ CORS blocked for: ${origin}`);
    }

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
    );
    res.setHeader("Access-Control-Max-Age", "86400");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});


// ---------------------
// Logging
// ---------------------
app.use(morgan("combined", { stream: morganStream }));

// ---------------------
// Body Parsing
// ---------------------
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ---------------------
// Cookie Parser
// ---------------------
app.use(cookieParser());

// ---------------------
// Language Detection Middleware
// ---------------------
app.use(languageMiddleware);

// ---------------------
// Static Files
// ---------------------
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));



// Register Platform A routes and Platform B routes
registerRoutes(app);

// ---------------------
// Health Check
// ---------------------
app.get("/health", async (req, res) => {
    const dbHealth = checkDBHealth();
    const redisHealth = await checkRedisHealth();

    const health = {
        status: dbHealth.status === "healthy" && redisHealth.status === "healthy" ? "OK" : "DEGRADED",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: dbHealth,
        redis: redisHealth,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    };

    const statusCode = health.status === "OK" ? 200 : 503;
    res.status(statusCode).json(health);
});

// ---------------------
// API Info
// ---------------------
app.get("/", (req, res) => {
    res.json({
        name: "Cryptians P2P Marketplace API",
        version: "1.0.0",
        status: "running",
        documentation: "/api/docs",
        health: "/health",
    });
});

// ---------------------
// 404 Handler (must be after all routes)
// ---------------------
app.use(notFoundHandler);

// ---------------------
// Error Handler (must be last)
// ---------------------
app.use(errorMiddlewareStack);

// ---------------------
// Graceful Shutdown Handler
// ---------------------
process.on("SIGTERM", () => {
    logger.info("SIGTERM signal received: closing HTTP server");
    process.exit(0);
});

process.on("SIGINT", () => {
    logger.info("SIGINT signal received: closing HTTP server");
    process.exit(0);
});

export default app;