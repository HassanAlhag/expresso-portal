import express from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  registerExpense,
  markExpensePaid,
  getExpenseStats,
  getMonthlyExpenses,
  getMonthlyExpenseDetails,
} from "./expense.controller.js";

const router = express.Router();

router.get(
  "/stats",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getExpenseStats
);

router.get(
  "/monthly",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getMonthlyExpenses
);

router.get(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  listExpenses
);

router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getExpense
);

router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  createExpense
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  updateExpense
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteExpense
);

router.post(
  "/:id/approve",
  requireAuth,
  requireRole("super_admin", "admin"),
  approveExpense
);

router.post(
  "/:id/reject",
  requireAuth,
  requireRole("super_admin", "admin"),
  rejectExpense
);

router.post(
  "/:id/register",
  requireAuth,
  requireRole("super_admin", "admin"),
  registerExpense
);

router.post(
  "/:id/paid",
  requireAuth,
  requireRole("super_admin", "admin"),
  markExpensePaid
);

router.get(
  "/monthly/:month",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getMonthlyExpenseDetails
);

export default router;
