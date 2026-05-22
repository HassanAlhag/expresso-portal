import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  listIndicators,
  createIndicator,
  updateIndicator,
  deleteIndicator,
  listGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  syncGoal,
  listCheckins,
  createCheckin,
  deleteCheckin,
  getDashboard,
} from "./kpi.controller.js";

const router = express.Router();

// Dashboard
router.get("/dashboard", requireAuth, requirePermission("hr.kpi.read"), getDashboard);

// Indicators
router.get("/indicators",      requireAuth, requirePermission("hr.kpi.read"),  listIndicators);
router.post("/indicators",     requireAuth, requirePermission("hr.kpi.write"), createIndicator);
router.patch("/indicators/:id",requireAuth, requirePermission("hr.kpi.write"), updateIndicator);
router.delete("/indicators/:id",requireAuth, requirePermission("hr.kpi.write"), deleteIndicator);

// Goals
router.get("/goals",          requireAuth, requirePermission("hr.kpi.read"),  listGoals);
router.get("/goals/:id",      requireAuth, requirePermission("hr.kpi.read"),  getGoal);
router.post("/goals",         requireAuth, requirePermission("hr.kpi.write"), createGoal);
router.patch("/goals/:id",    requireAuth, requirePermission("hr.kpi.write"), updateGoal);
router.delete("/goals/:id",   requireAuth, requirePermission("hr.kpi.write"), deleteGoal);
router.post("/goals/:id/sync",requireAuth, requirePermission("hr.kpi.write"), syncGoal);

// Checkins
router.get("/checkins",       requireAuth, requirePermission("hr.kpi.read"),  listCheckins);
router.post("/checkins",      requireAuth, requirePermission("hr.kpi.write"), createCheckin);
router.delete("/checkins/:id",requireAuth, requirePermission("hr.kpi.write"), deleteCheckin);

export default router;
