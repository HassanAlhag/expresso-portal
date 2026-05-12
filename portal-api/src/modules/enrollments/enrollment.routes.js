import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
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
  requirePermission("enrollments.read"),
  listEnrollmentsGlobal
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("enrollments.read"),
  getEnrollmentGlobal
);

router.post(
  "/",
  requireAuth,
  requirePermission("enrollments.write"),
  createEnrollmentGlobal
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("enrollments.write"),
  updateEnrollmentGlobal
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("enrollments.delete"),
  deleteEnrollmentGlobal
);

export default router;
