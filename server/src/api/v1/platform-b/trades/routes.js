// src/api/v1/platform-b/trades/routes.js

import { Router } from "express";
import * as tradesController from "./controller.js";
import { auth } from "../../../../middleware/auth.middleware.js";
import { authorize } from "../../../../middleware/rbac.middleware.js";
import { ROLES } from "../../../../constants/index.js";

const router = Router();

// Enforce auth + admin role (CONSISTENT with escrow)
router.use(auth);
router.use(authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.get("/deposited", tradesController.getDepositedTradesController);

/**
 * @route   GET /api/v1/platform-b/trades/appealed
 * @desc    Get all appealed trades
 * @access  Admin
 */
router.get("/appealed", tradesController.getAppealedTradesController);

export default router;
