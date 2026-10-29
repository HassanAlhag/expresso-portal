import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { requireInternalUser } from "../../utils/accessControl.js";
import { operatingOptions } from "../operating/operating.controller.js";

import {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createCustomerLogin,
  listCustomerUsers,
  createCustomerUser,
} from "./customers.controller.js";

const router = express.Router();
router.get("/:id/operating/options", requireAuth, requireInternalUser, requirePermission("customers.write"), operatingOptions);

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

router.get(
  "/:id/users",
  requireAuth,
  requirePermission("customers.read"),
  listCustomerUsers
);

router.post(
  "/:id/users",
  requireAuth,
  requirePermission("customers.write"),
  createCustomerUser
);

export default router;
