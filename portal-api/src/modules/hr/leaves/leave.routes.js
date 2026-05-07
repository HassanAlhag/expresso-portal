import express from "express";

import { requireAuth, requireRole } from "../../../middleware/auth.js";

import {
  listLeaves,
  getLeave,
  createLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveStats,
} from "./leave.controller.js";

const router = express.Router();

router.get(
  "/stats",

  requireAuth,

  requireRole("super_admin", "admin", "staff"),

  getLeaveStats
);

router.get(
  "/",

  requireAuth,

  requireRole("super_admin", "admin", "staff"),

  listLeaves
);

router.get(
  "/:id",

  requireAuth,

  requireRole("super_admin", "admin", "staff"),

  getLeave
);

router.post(
  "/",

  requireAuth,

  requireRole("super_admin", "admin", "staff"),

  createLeave
);

router.patch(
  "/:id",

  requireAuth,

  requireRole("super_admin", "admin", "staff"),

  updateLeave
);

router.delete(
  "/:id",

  requireAuth,

  requireRole("super_admin", "admin"),

  deleteLeave
);

router.post(
  "/:id/approve",

  requireAuth,

  requireRole("super_admin", "admin"),

  approveLeave
);

router.post(
  "/:id/reject",

  requireAuth,

  requireRole("super_admin", "admin"),

  rejectLeave
);

router.post(
  "/:id/cancel",

  requireAuth,

  requireRole("super_admin", "admin", "staff"),

  cancelLeave
);

export default router;
