// src/middleware/rbac.middleware.js
import { ForbiddenError, UnauthorizedError } from "../utils/ApiError.js";
import { ROLES, PERMISSIONS, hasPermission, isRoleHigher } from "../constants/roles.js";

/**
 * Check if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        const lang = req.lang || "en";

        // Check if user is authenticated
        if (!req.user) {
            return next(UnauthorizedError("AUTH_012", {}, lang));
        }

        // Flatten array in case roles are passed as array
        const roles = allowedRoles.flat();

        // Check if user's role is in allowed roles
        if (!roles.includes(req.user.role)) {
            return next(ForbiddenError("PERM_002", {}, lang));
        }

        next();
    };
};

/**
 * Check if user has required permission
 * @param {string} permission - Permission key from PERMISSIONS constant
 */
export const checkPermission = (permission) => {
    return (req, res, next) => {
        const lang = req.lang || "en";

        if (!req.user) {
            return next(UnauthorizedError("AUTH_012", {}, lang));
        }

        if (!hasPermission(req.user.role, permission)) {
            return next(ForbiddenError("PERM_002", {}, lang));
        }

        next();
    };
};

/**
 * Check if user is admin or support staff (Platform B access)
 */
export const isPlatformB = () => {
    return authorize(ROLES.SUPPORT, ROLES.SUPPORT_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN);
};

/**
 * Check if user is admin only
 */
export const isAdmin = () => {
    return authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = () => {
    return authorize(ROLES.SUPER_ADMIN);
};

/**
 * Check if user can create listings (seller or instant_seller with approved KYC)
 */
export const canCreateListing = () => {
    return (req, res, next) => {
        const lang = req.lang || "en";

        if (!req.user) {
            return next(new UnauthorizedError("AUTH_012", {}, lang));
        }

        // Check if user is seller or instant seller
        if (![ROLES.SELLER, ROLES.INSTANT_SELLER].includes(req.user.role)) {
            return next(new ForbiddenError("PERM_002", { message: "Only sellers can create listings" }, lang));
        }

        // Check if KYC is approved
        if (!req.user.canCreateListing || !req.user.canCreateListing()) {
            return next(new ForbiddenError("KYC_004", {}, lang));
        }

        next();
    };
};

/**
 * Check if user can trade (KYC approved)
 */
export const canTrade = () => {
    return (req, res, next) => {
        const lang = req.lang || "en";

        if (!req.user) {
            return next(new UnauthorizedError("AUTH_012", {}, lang));
        }

        // Check if user can trade (has method from User model)
        if (!req.user.canTrade || !req.user.canTrade()) {
            return next(new ForbiddenError("KYC_001", {}, lang));
        }

        next();
    };
};

/**
 * Check if user is the resource owner or admin
 * @param {string} resourceUserIdField - Field name containing the user ID (e.g., 'userId', 'sellerId')
 */
export const isOwnerOrAdmin = (resourceUserIdField = "userId") => {
    return (req, res, next) => {
        const lang = req.lang || "en";

        if (!req.user) {
            return next(new UnauthorizedError("AUTH_012", {}, lang));
        }

        // Admin can access any resource
        if ([ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role)) {
            return next();
        }

        // Check if user is the owner
        const resourceUserId = req[resourceUserIdField] || req.body[resourceUserIdField] || req.params[resourceUserIdField];

        if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
            return next(new ForbiddenError("PERM_001", {}, lang));
        }

        next();
    };
};

/**
 * Check if user can modify another user (only if requester has higher role)
 */
export const canModifyUser = () => {
    return (req, res, next) => {
        const lang = req.lang || "en";

        if (!req.user) {
            return next(new UnauthorizedError("AUTH_012", {}, lang));
        }

        // Super admin can modify anyone
        if (req.user.role === ROLES.SUPER_ADMIN) {
            return next();
        }

        // Get target user's role from request (must be populated)
        const targetUserRole = req.targetUser?.role;

        if (!targetUserRole) {
            return next(new ForbiddenError("PERM_002", { message: "Cannot determine target user role" }, lang));
        }

        // Check if requester has higher role
        if (!isRoleHigher(req.user.role, targetUserRole)) {
            return next(new ForbiddenError("PERM_002", { message: "Insufficient permissions to modify this user" }, lang));
        }

        next();
    };
};

/**
 * Check if user is instant seller
 */
export const isInstantSeller = () => {
    return (req, res, next) => {
        const lang = req.lang || "en";

        if (!req.user) {
            return next(new UnauthorizedError("AUTH_012", {}, lang));
        }

        if (!req.user.isInstantSeller) {
            return next(new ForbiddenError("PERM_005", {}, lang));
        }

        next();
    };
};

/**
 * Check if user's account is active
 */
export const isActiveAccount = () => {
    return (req, res, next) => {
        const lang = req.lang || "en";

        if (!req.user) {
            return next(new UnauthorizedError("AUTH_012", {}, lang));
        }

        if (!req.user.isActive || !req.user.isActive()) {
            return next(new ForbiddenError("AUTH_006", {}, lang));
        }

        next();
    };
};

export default {
    authorize,
    checkPermission,
    isPlatformB,
    isAdmin,
    isSuperAdmin,
    canCreateListing,
    canTrade,
    isOwnerOrAdmin,
    canModifyUser,
    isInstantSeller,
    isActiveAccount,
};
