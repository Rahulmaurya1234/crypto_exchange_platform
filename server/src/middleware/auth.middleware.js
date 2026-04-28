import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { ACCOUNT_STATUS } from "../constants/index.js";

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET missing in .env");
}

/**
 * Extract Bearer token from Authorization header
 */
const getTokenFromHeader = (req) => {
    const header = req.headers.authorization || req.headers.Authorization || req.cookies?.accessToken;
    if (!header || typeof header !== "string") return null;
    if (header.startsWith("Bearer ")) {
        return header.substring(7).trim();
    }
    if (req.cookies?.accessToken) {
        return req.cookies.accessToken;
    }
    return null;
};

/**
 * Strict auth: requires a valid access token.
 * Attaches `req.user` and `req.auth` (decoded payload).
 */
export const auth = async (req, res, next) => {
    try {
        const token = getTokenFromHeader(req);

        if (!token) {
            return res.status(401).json({ message: "Authorization token missing" });
        }

        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const user = await User.findById(payload.sub);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
            return res.status(403).json({ message: "Account is not active" });
        }

        req.user = user;
        req.auth = payload;

        return next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Optional auth: if token is valid, attach req.user,
 * otherwise continue without user (no 401).
 */
export const optionalAuth = async (req, _res, next) => {
    try {
        const token = getTokenFromHeader(req);
        if (!token) {
            return next();
        }

        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch {
            // invalid token → treat as unauthenticated
            return next();
        }

        const user = await User.findById(payload.sub);
        if (user && user.accountStatus === ACCOUNT_STATUS.ACTIVE) {
            req.user = user;
            req.auth = payload;
        }

        return next();
    } catch (err) {
        console.error("Optional auth middleware error:", err);
        return next();
    }
};

/**
 * Role-based guard: require specific roles.
 * Usage: router.get("/admin", auth, requireRole("admin"), handler)
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: insufficient role" });
        }

        return next();
    };
};
