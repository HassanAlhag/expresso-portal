import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import Invoice from "./invoice.model.js";

import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  markInvoicePaid,
  voidInvoice,
} from "./billing.controller.js";

const router = express.Router();

// GET /api/billing/stats
router.get(
  "/stats",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  async (_req, res) => {
    const [byStatus, totals] = await Promise.all([
      Invoice.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$total" } } }]),
      Invoice.aggregate([{ $group: { _id: null, totalRevenue: { $sum: "$total" }, totalPaid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$total", 0] } }, totalOutstanding: { $sum: { $cond: [{ $in: ["$status", ["sent", "overdue"]] }, "$total", 0] } }, count: { $sum: 1 } } }]),
    ]);
    const t = totals[0] || { totalRevenue: 0, totalPaid: 0, totalOutstanding: 0, count: 0 };
    return res.json({
      ok: true,
      byStatus: Object.fromEntries(byStatus.map((x) => [x._id, { count: x.count, amount: x.amount }])),
      totalRevenue: t.totalRevenue,
      totalPaid: t.totalPaid,
      totalOutstanding: t.totalOutstanding,
      totalInvoices: t.count,
    });
  }
);

// Mounted at: /api/billing
router.get(
  "/invoices",
  requireAuth,
  requireRole("super_admin", "admin", "staff", "client"),
  listInvoices
);

router.get(
  "/invoices/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff", "client"),
  getInvoice
);

// staff/admin create/update
router.post(
  "/invoices",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  createInvoice
);

router.patch(
  "/invoices/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  updateInvoice
);

router.post(
  "/invoices/:id/mark-paid",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  markInvoicePaid
);

router.post(
  "/invoices/:id/void",
  requireAuth,
  requireRole("super_admin", "admin"),
  voidInvoice
);

export default router;
