import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
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

router.get("/stats",           requireAuth, requirePermission("hr.expenses.read"),    getExpenseStats);
router.get("/monthly",         requireAuth, requirePermission("hr.expenses.read"),    getMonthlyExpenses);
router.get("/monthly/:month",  requireAuth, requirePermission("hr.expenses.read"),    getMonthlyExpenseDetails);
router.get("/",                requireAuth, requirePermission("hr.expenses.read"),    listExpenses);
router.get("/:id",             requireAuth, requirePermission("hr.expenses.read"),    getExpense);

router.post("/",               requireAuth, requirePermission("hr.expenses.write"),   createExpense);
router.patch("/:id",           requireAuth, requirePermission("hr.expenses.write"),   updateExpense);
router.delete("/:id",          requireAuth, requirePermission("hr.expenses.delete"),  deleteExpense);

// Approval actions — separate permission so "HR Managers" can approve without full admin access
router.post("/:id/approve",    requireAuth, requirePermission("hr.expenses.approve"), approveExpense);
router.post("/:id/reject",     requireAuth, requirePermission("hr.expenses.approve"), rejectExpense);
router.post("/:id/register",   requireAuth, requirePermission("hr.expenses.approve"), registerExpense);
router.post("/:id/paid",       requireAuth, requirePermission("hr.expenses.approve"), markExpensePaid);

export default router;
