import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";

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
  requirePermission("customers.read"),
  listCustomers
);
router.get(
  "/:id",
  requireAuth,
  requirePermission("customers.read"),
  getCustomerById
);
router.post(
  "/",
  requireAuth,
  requirePermission("customers.write"),
  createCustomer
);
router.patch(
  "/:id",
  requireAuth,
  requirePermission("customers.write"),
  updateCustomer
);
router.delete(
  "/:id",
  requireAuth,
  requirePermission("customers.delete"),
  deleteCustomer
);
router.post(
  "/:id/create-login",
  requireAuth,
  requirePermission("customers.write"),
  createCustomerLogin
);

export default router;
