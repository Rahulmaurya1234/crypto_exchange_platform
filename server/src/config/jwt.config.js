// src/config/jwt.config.js

/**
 * JWT Configuration
 */
export const jwtConfig = {
    // Access Token
    accessToken: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m",
    },

    // Refresh Token
    refreshToken: {
        secret: process.env.REFRESH_JWT_SECRET,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
    },

    // Cookie Configuration
    cookie: {
        name: process.env.REFRESH_COOKIE_NAME || "refresh_token",
        options: {
            httpOnly: true,
            secure: process.env.REFRESH_COOKIE_SECURE === "true",
            sameSite: process.env.REFRESH_COOKIE_SAME_SITE || "lax",
            path: "/",
            maxAge: parseDurationToMs(process.env.REFRESH_TOKEN_EXPIRES_IN || "30d"),
        },
    },
};

/**
 * Parse duration string to milliseconds
 */
function parseDurationToMs(value) {
    if (!value) return undefined;
    if (typeof value === "number") return value;

    const match = /^(\d+)([smhd])?$/.exec(value.trim());
    if (!match) return undefined;

    const amount = parseInt(match[1], 10);
    const unit = match[2] || "d";

    switch (unit) {
        case "s":
            return amount * 1000;
        case "m":
            return amount * 60 * 1000;
        case "h":
            return amount * 60 * 60 * 1000;
        case "d":
        default:
            return amount * 24 * 60 * 60 * 1000;
    }
}

/**
 * Validate JWT configuration
 */
export const validateJwtConfig = () => {
    if (!jwtConfig.accessToken.secret) {
        throw new Error("JWT_SECRET is required in environment variables");
    }
    if (!jwtConfig.refreshToken.secret) {
        throw new Error("REFRESH_JWT_SECRET is required in environment variables");
    }
    if (jwtConfig.accessToken.secret === jwtConfig.refreshToken.secret) {
        throw new Error("JWT_SECRET and REFRESH_JWT_SECRET must be different");
    }
};

export default jwtConfig;
