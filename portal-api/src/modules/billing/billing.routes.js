import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import {
  canSeeAllTenantRecords,
  getUserClientId,
} from "../../utils/accessControl.js";
import Invoice from "./invoice.model.js";

import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  markInvoicePaid,
  voidInvoice,
  recordPayment,
  deletePayment,
  markOverdueInvoices,
} from "./billing.controller.js";

const router = express.Router();

// GET /api/billing/stats
router.get(
  "/stats",
  requireAuth,
  requirePermission("billing.read"),
  async (req, res) => {
    const tenantFilter = {};

    if (!canSeeAllTenantRecords(req)) {
      const clientId = getUserClientId(req);
      if (!clientId) {
        return res.json({
          ok: true,
          byStatus: {},
          totalRevenue: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          totalOverdue: 0,
          totalInvoices: 0,
        });
      }
      tenantFilter.customerId = clientId;
    }

    const [byStatus, totals] = await Promise.all([
      Invoice.aggregate([
        { $match: tenantFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            amount: { $sum: "$total" },
          },
        },
      ]),
      Invoice.aggregate([
        { $match: tenantFilter },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [
                  { $ne: ["$status", "void"] },
                  { $ifNull: ["$total", 0] },
                  0,
                ],
              },
            },
            totalPaid: {
              $sum: {
                $cond: [
                  { $ne: ["$status", "void"] },
                  { $ifNull: ["$amountPaid", 0] },
                  0,
                ],
              },
            },
            totalOutstanding: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["sent", "overdue"]] },
                  { $ifNull: ["$balance", 0] },
                  0,
                ],
              },
            },
            totalOverdue: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "overdue"] },
                  { $ifNull: ["$balance", 0] },
                  0,
                ],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);
    const t = totals[0] || {
      totalRevenue: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      count: 0,
    };
    return res.json({
      ok: true,
      byStatus: Object.fromEntries(
        byStatus.map((x) => [x._id, { count: x.count, amount: x.amount }])
      ),
      totalRevenue: t.totalRevenue,
      totalPaid: t.totalPaid,
      totalOutstanding: t.totalOutstanding,
      totalOverdue: t.totalOverdue,
      totalInvoices: t.count,
    });
  }
);

// Mounted at: /api/billing
router.get("/invoices", requireAuth, requirePermission("billing.read"), listInvoices);
router.get("/invoices/:id", requireAuth, requirePermission("billing.read"), getInvoice);

router.post("/invoices", requireAuth, requirePermission("billing.write"), createInvoice);

// Fixed-path POST routes must come before :id param routes
router.post("/invoices/mark-overdue", requireAuth, requirePermission("billing.write"), markOverdueInvoices);

router.patch("/invoices/:id", requireAuth, requirePermission("billing.write"), updateInvoice);
router.post("/invoices/:id/mark-paid", requireAuth, requirePermission("billing.write"), markInvoicePaid);
router.post("/invoices/:id/void", requireAuth, requirePermission("billing.write"), voidInvoice);

// Payments
router.post("/invoices/:id/payments", requireAuth, requirePermission("billing.write"), recordPayment);
router.delete("/invoices/:id/payments/:payId", requireAuth, requirePermission("billing.write"), deletePayment);

export default router;
