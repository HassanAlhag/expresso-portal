import express from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
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
  requireRole("super_admin", "admin", "staff"),
  listAccounts
);

router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getAccount
);

router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  createAccount
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  updateAccount
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteAccount
);

export default router;
