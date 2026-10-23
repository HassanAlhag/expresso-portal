import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { requireInternalUser } from "../../utils/accessControl.js";
import {
  getDashboardStats,
  listRequests,
  getRequest,
  createRequest,
  updateRequest,
  deleteRequest,
} from "./request.controller.js";
import { createRfqFromRequest } from "./rfq.controller.js";

const router = express.Router();

// Stats must come before /:id to avoid param capture
router.get(
  "/stats",
  requireAuth,
  requirePermission("procurement.read"),
  getDashboardStats
);

router.get(
  "/",
  requireAuth,
  requirePermission("procurement.read"),
  listRequests
);

router.post(
  "/",
  requireAuth,
  requirePermission("procurement.write"),
  createRequest
);

// Creating an RFQ is staff-only, like every other RFQ write (PUI-4): the RFQ
// router requires an internal user, and this route reads any request by id.
router.post(
  "/:id/create-rfq",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.write"),
  createRfqFromRequest
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("procurement.read"),
  getRequest
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("procurement.write"),
  updateRequest
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("procurement.delete"),
  deleteRequest
);

export default router;
