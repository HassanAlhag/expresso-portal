import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
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

const staff = requireRole("super_admin", "admin", "staff");
const admin = requireRole("super_admin", "admin");
const vendor = requireRole("vendor");
const staffOrVendor = requireRole("super_admin", "admin", "staff", "vendor");

// RFQ endpoints
router.get("/", requireAuth, staffOrVendor, listRfqs);
router.post("/", requireAuth, staff, createRfq);
router.get("/:id", requireAuth, staffOrVendor, getRfq);
router.patch("/:id", requireAuth, staff, updateRfq);
router.patch("/:id/publish", requireAuth, admin, publishRfq);
router.patch("/:id/close", requireAuth, admin, closeRfq);

// Per-RFQ quotations
router.get("/:id/quotations", requireAuth, staffOrVendor, listQuotations);
router.post("/:id/quotations", requireAuth, vendor, submitQuotation);
router.get("/:id/matched-vendors", requireAuth, staff, getMatchedVendors);

// Quotation status (staff only)
router.patch("/quotations/:quotationId/status", requireAuth, admin, updateQuotationStatus);

export default router;
