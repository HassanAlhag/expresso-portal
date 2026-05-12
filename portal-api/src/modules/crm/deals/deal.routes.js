import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  listDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
} from "./deal.controller.js";
import { convertDealToCustomer } from "./deal.controller.js";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requirePermission("crm.read"),
  listDeals
);
router.get(
  "/:id",
  requireAuth,
  requirePermission("crm.read"),
  getDeal
);
router.post(
  "/",
  requireAuth,
  requirePermission("crm.write"),
  createDeal
);
router.patch(
  "/:id",
  requireAuth,
  requirePermission("crm.write"),
  updateDeal
);
router.delete(
  "/:id",
  requireAuth,
  requirePermission("crm.delete"),
  deleteDeal
);

router.post(
  "/:id/convert-to-customer",
  requireAuth,
  requirePermission("crm.write"),
  convertDealToCustomer
);

export default router;
