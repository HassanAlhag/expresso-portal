import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
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
  requirePermission("billing.read"),
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
  requirePermission("billing.read"),
  listInvoices
);

router.get(
  "/invoices/:id",
  requireAuth,
  requirePermission("billing.read"),
  getInvoice
);

// staff/admin create/update
router.post(
  "/invoices",
  requireAuth,
  requirePermission("billing.write"),
  createInvoice
);

router.patch(
  "/invoices/:id",
  requireAuth,
  requirePermission("billing.write"),
  updateInvoice
);

router.post(
  "/invoices/:id/mark-paid",
  requireAuth,
  requirePermission("billing.write"),
  markInvoicePaid
);

router.post(
  "/invoices/:id/void",
  requireAuth,
  requirePermission("billing.write"),
  voidInvoice
);

export default router;
