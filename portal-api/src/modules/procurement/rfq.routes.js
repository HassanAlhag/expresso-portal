import { Router } from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { requireInternalUser } from "../../utils/accessControl.js";
import { requireApprovedVendor, requireStaffOrApprovedVendor } from "./vendorAccess.js";
import {
  createRfq,
  listRfqs,
  getRfq,
  updateRfq,
  publishRfq,
  closeRfq,
  listQuotations,
  submitQuotation,
  updateQuotationStatus,
  getMatchedVendors,
} from "./rfq.controller.js";

const router = Router();

// RFQ endpoints
// Reads: internal staff, or approved vendors (who see only published RFQs in
// their approved categories and only their own quotations — see controller).
router.get("/", requireAuth, requirePermission("procurement.read"), requireStaffOrApprovedVendor, listRfqs);
router.post("/", requireAuth, requireInternalUser, requirePermission("procurement.write"), createRfq);
router.get("/:id", requireAuth, requirePermission("procurement.read"), requireStaffOrApprovedVendor, getRfq);
router.patch("/:id", requireAuth, requireInternalUser, requirePermission("procurement.write"), updateRfq);
router.patch("/:id/publish", requireAuth, requireInternalUser, requirePermission("procurement.approve"), publishRfq);
router.patch("/:id/close", requireAuth, requireInternalUser, requirePermission("procurement.approve"), closeRfq);

// Per-RFQ quotations
router.get("/:id/quotations", requireAuth, requirePermission("procurement.read"), requireStaffOrApprovedVendor, listQuotations);
router.post("/:id/quotations", requireAuth, requireApprovedVendor, submitQuotation);
router.get("/:id/matched-vendors", requireAuth, requireInternalUser, requirePermission("procurement.read"), getMatchedVendors);

// Quotation status (staff only)
router.patch(
  "/quotations/:quotationId/status",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.approve"),
  updateQuotationStatus
);

export default router;
