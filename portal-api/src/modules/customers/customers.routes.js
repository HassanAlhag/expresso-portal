import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";

import {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createCustomerLogin,
} from "./customers.controller.js";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requireRole("super_admin", "admin"),
  listCustomers
);
router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  getCustomerById
);
router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin"),
  createCustomer
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  updateCustomer
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteCustomer
);
router.post(
  "/:id/create-login",
  requireAuth,
  requireRole("super_admin", "admin"),
  createCustomerLogin
);

export default router;
