import express from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
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
  requireRole("super_admin", "admin", "staff"),
  listDeals
);
router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getDeal
);
router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  createDeal
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  updateDeal
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteDeal
);

router.post(
  "/:id/convert-to-customer",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  convertDealToCustomer
);

export default router;
