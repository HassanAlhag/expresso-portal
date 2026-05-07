import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  listEnrollmentsGlobal,
  getEnrollmentGlobal,
  createEnrollmentGlobal,
  updateEnrollmentGlobal,
  deleteEnrollmentGlobal,
} from "./enrollment.controller.js";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  listEnrollmentsGlobal
);

router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getEnrollmentGlobal
);

router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  createEnrollmentGlobal
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  updateEnrollmentGlobal
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteEnrollmentGlobal
);

export default router;
