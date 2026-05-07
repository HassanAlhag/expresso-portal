import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
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
  requireRole("super_admin", "admin", "staff"),
  getDashboardStats
);

router.get(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  listRequests
);

router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  createRequest
);

router.post(
  "/:id/create-rfq",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  createRfqFromRequest
);

router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getRequest
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  updateRequest
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteRequest
);

export default router;
