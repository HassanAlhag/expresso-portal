import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
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
  requireRole("super_admin", "admin", "staff"),
  listVendors
);

router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getVendor
);

router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin"),
  createVendor
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  updateVendor
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteVendor
);

export default router;
