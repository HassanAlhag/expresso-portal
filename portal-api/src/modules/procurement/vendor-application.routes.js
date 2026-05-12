import express from "express";
import {
  requireAuth,
  requirePermission,
} from "../../middleware/auth.js";
import { requireInternalUser } from "../../utils/accessControl.js";
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
  requireInternalUser,
  requirePermission("procurement.approve"),
  listVendorApplications
);

router.get(
  "/:id",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.approve"),
  getVendorApplication
);

// Admin only — approve / reject
router.patch(
  "/:id/approve",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.approve"),
  approveVendorApplication
);

router.patch(
  "/:id/reject",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.approve"),
  rejectVendorApplication
);

export default router;
