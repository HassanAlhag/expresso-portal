import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { requireInternalUser } from "../../utils/accessControl.js";
import {
  listVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
} from "./vendor.controller.js";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.read"),
  listVendors
);

router.get(
  "/:id",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.read"),
  getVendor
);

router.post(
  "/",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.write"),
  createVendor
);

router.patch(
  "/:id",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.write"),
  updateVendor
);

router.delete(
  "/:id",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.delete"),
  deleteVendor
);

export default router;
