import { Router } from "express";
import { requireAuth, requirePermission, requireRole } from "../../middleware/auth.js";
import { requireInternalUser } from "../../utils/accessControl.js";
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

const vendor = requireRole("vendor");

// RFQ endpoints
router.get("/", requireAuth, requireInternalUser, requirePermission("procurement.read"), listRfqs);
router.post("/", requireAuth, requireInternalUser, requirePermission("procurement.write"), createRfq);
router.get("/:id", requireAuth, requireInternalUser, requirePermission("procurement.read"), getRfq);
router.patch("/:id", requireAuth, requireInternalUser, requirePermission("procurement.write"), updateRfq);
router.patch("/:id/publish", requireAuth, requireInternalUser, requirePermission("procurement.approve"), publishRfq);
router.patch("/:id/close", requireAuth, requireInternalUser, requirePermission("procurement.approve"), closeRfq);

// Per-RFQ quotations
router.get("/:id/quotations", requireAuth, requireInternalUser, requirePermission("procurement.read"), listQuotations);
router.post("/:id/quotations", requireAuth, vendor, submitQuotation);
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
