import express from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import {
  listStaff,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffStats,
} from "./staff.controller.js";

const router = express.Router();

router.get(
  "/stats",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getStaffStats
);

router.get(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  listStaff
);

router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getStaff
);

router.post("/", requireAuth, requireRole("super_admin", "admin"), createStaff);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  updateStaff
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteStaff
);

export default router;
