import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  registerVendorApplication,
  listVendorApplications,
  getVendorApplication,
  approveVendorApplication,
  rejectVendorApplication,
} from "./vendor-application.controller.js";

const router = express.Router();

// Public — vendor self-registration from website
router.post("/", registerVendorApplication);

// Admin / staff — view applications
router.get(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  listVendorApplications
);

router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getVendorApplication
);

// Admin only — approve / reject
router.patch(
  "/:id/approve",
  requireAuth,
  requireRole("super_admin", "admin"),
  approveVendorApplication
);

router.patch(
  "/:id/reject",
  requireAuth,
  requireRole("super_admin", "admin"),
  rejectVendorApplication
);

export default router;
