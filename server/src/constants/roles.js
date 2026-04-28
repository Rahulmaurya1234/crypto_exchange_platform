// src/constants/roles.js

/**
 * User Roles for Role-Based Access Control (RBAC)
 * Platform A: buyer, seller, instant_seller
 * Platform B: support, support_manager, admin
 */
export const ROLES = {
    // Platform A - Marketplace Users
    BUYER: "buyer",
    SELLER: "seller",
    INSTANT_SELLER: "instant_seller",

    // Platform B - Internal Team
    SUPPORT: "support",
    SUPPORT_MANAGER: "support_manager",
    ADMIN: "admin",
    SUPER_ADMIN: "super_admin",
};

/**
 * Role Hierarchies (higher number = more permissions)
 */
export const ROLE_HIERARCHY = {
    [ROLES.BUYER]: 1,
    [ROLES.SELLER]: 2,
    [ROLES.INSTANT_SELLER]: 3,
    [ROLES.SUPPORT]: 10,
    [ROLES.SUPPORT_MANAGER]: 20,
    [ROLES.ADMIN]: 30,
    [ROLES.SUPER_ADMIN]: 100,
};

/**
 * Role Groups
 */
export const ROLE_GROUPS = {
    PLATFORM_A: [ROLES.BUYER, ROLES.SELLER, ROLES.INSTANT_SELLER],
    PLATFORM_B: [ROLES.SUPPORT, ROLES.SUPPORT_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
    ALL_USERS: [ROLES.BUYER, ROLES.SELLER, ROLES.INSTANT_SELLER],
    STAFF: [ROLES.SUPPORT, ROLES.SUPPORT_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
};

/**
 * Permission Matrix
 */
export const PERMISSIONS = {
    // User Management
    VIEW_USERS: [ROLES.SUPPORT, ROLES.SUPPORT_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
    MANAGE_USERS: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    SUSPEND_USERS: [ROLES.SUPPORT_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN],

    // KYC Management
    SUBMIT_KYC: [ROLES.BUYER, ROLES.SELLER, ROLES.INSTANT_SELLER],
    REVIEW_KYC: [ROLES.SUPPORT, ROLES.SUPPORT_MANAGER, ROLES.ADMIN],
    APPROVE_KYC: [ROLES.SUPPORT_MANAGER, ROLES.ADMIN],

    // Listing Management
    CREATE_LISTING: [ROLES.SELLER, ROLES.INSTANT_SELLER],
    VIEW_LISTINGS: [ROLES.BUYER, ROLES.SELLER, ROLES.INSTANT_SELLER],
    MANAGE_OWN_LISTING: [ROLES.SELLER, ROLES.INSTANT_SELLER],
    MANAGE_ALL_LISTINGS: [ROLES.ADMIN, ROLES.SUPER_ADMIN],

    // Trade Management
    INITIATE_TRADE: [ROLES.BUYER, ROLES.SELLER, ROLES.INSTANT_SELLER],
    VIEW_OWN_TRADES: [ROLES.BUYER, ROLES.SELLER, ROLES.INSTANT_SELLER],
    VIEW_ALL_TRADES: [ROLES.SUPPORT, ROLES.SUPPORT_MANAGER, ROLES.ADMIN],
    CANCEL_TRADE: [ROLES.BUYER, ROLES.SELLER, ROLES.INSTANT_SELLER, ROLES.SUPPORT_MANAGER],

    // Chat
    SEND_MESSAGE: [ROLES.BUYER, ROLES.SELLER, ROLES.INSTANT_SELLER, ROLES.SUPPORT],
    JOIN_CHAT: [ROLES.SUPPORT, ROLES.SUPPORT_MANAGER, ROLES.ADMIN],

    // Dispute Management
    CREATE_DISPUTE: [ROLES.BUYER, ROLES.SELLER, ROLES.INSTANT_SELLER],
    VIEW_DISPUTES: [ROLES.SUPPORT, ROLES.SUPPORT_MANAGER, ROLES.ADMIN],
    RESOLVE_DISPUTE: [ROLES.SUPPORT, ROLES.SUPPORT_MANAGER, ROLES.ADMIN],

    // Escrow Management
    VIEW_ESCROW: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    MANAGE_ESCROW: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    RELEASE_ESCROW: [ROLES.SUPPORT_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN],

    // Admin Operations
    VIEW_ANALYTICS: [ROLES.SUPPORT_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
    MANAGE_SETTINGS: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    VIEW_AUDIT_LOGS: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
};

/**
 * Check if user has permission
 */
export const hasPermission = (userRole, permission) => {
    const allowedRoles = PERMISSIONS[permission];
    return allowedRoles ? allowedRoles.includes(userRole) : false;
};

/**
 * Check if user role is higher than target role
 */
export const isRoleHigher = (userRole, targetRole) => {
    return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
};

export default {
    ROLES,
    ROLE_HIERARCHY,
    ROLE_GROUPS,
    PERMISSIONS,
    hasPermission,
    isRoleHigher,
};
