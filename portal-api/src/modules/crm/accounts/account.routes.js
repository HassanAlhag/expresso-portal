import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
} from "./account.controller.js";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requirePermission("crm.read"),
  listAccounts
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("crm.read"),
  getAccount
);

router.post(
  "/",
  requireAuth,
  requirePermission("crm.write"),
  createAccount
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("crm.write"),
  updateAccount
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("crm.delete"),
  deleteAccount
);

export default router;
