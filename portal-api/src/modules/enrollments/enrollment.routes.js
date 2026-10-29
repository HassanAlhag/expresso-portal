import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { requireInternalUser } from "../../utils/accessControl.js";
import { operatingOptions, enrollmentOverview, enrollmentAction, periodAction } from "../operating/operating.controller.js";
import {
  listEnrollmentsGlobal,
  getEnrollmentGlobal,
  createEnrollmentGlobal,
  updateEnrollmentGlobal,
  deleteEnrollmentGlobal,
} from "./enrollment.controller.js";

const router = express.Router();
router.get("/:id/operating/options", requireAuth, requireInternalUser, requirePermission("enrollments.write"), operatingOptions);
router.get("/:id/operating", requireAuth, requireInternalUser, requirePermission("enrollments.read", "jobs.read"), enrollmentOverview);
router.post("/:id/operating/:command", requireAuth, requireInternalUser, requirePermission("enrollments.write"), enrollmentAction);
router.post("/:id/operating/periods/:periodId/:command", requireAuth, requireInternalUser, requirePermission("enrollments.write", "jobs.write"), periodAction);

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
