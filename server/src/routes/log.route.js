import express from "express";
import { auth, requireRole } from "../middleware/auth.middleware.js";
import { USER_ROLES } from "../models/User.model.js";
import { getLogs } from "../controllers/log.controller.js";

const router = express.Router();

// --------------------
// Admin Routes
// --------------------
router.get(
    "/admin/mod-logs",
    auth,
    requireRole(USER_ROLES.ADMIN),
    getLogs
);

export default router;
