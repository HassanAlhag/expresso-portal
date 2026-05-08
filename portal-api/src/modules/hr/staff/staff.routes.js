import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  listStaff,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffStats,
  getDepartmentBenchmark,
  updateSkills,
  addScorecard,
  removeScorecard,
  addLearningGoal,
  updateLearningGoal,
  removeLearningGoal,
} from "./staff.controller.js";

const router = express.Router();

router.get("/stats",  requireAuth, requirePermission("hr.staff.read"),   getStaffStats);
router.get("/",       requireAuth, requirePermission("hr.staff.read"),   listStaff);
router.get("/:id",    requireAuth, requirePermission("hr.staff.read"),   getStaff);

router.post("/",      requireAuth, requirePermission("hr.staff.write"),  createStaff);
router.patch("/:id",  requireAuth, requirePermission("hr.staff.write"),  updateStaff);
router.delete("/:id", requireAuth, requirePermission("hr.staff.delete"), deleteStaff);

// ── Benchmark ─────────────────────────────────────────────────────────────────

router.get("/:id/benchmark", requireAuth, requirePermission("hr.staff.read"), getDepartmentBenchmark);

// ── Skills ────────────────────────────────────────────────────────────────────

router.put("/:id/skills", requireAuth, requirePermission("hr.scorecards.write"), updateSkills);

// ── Scorecards ────────────────────────────────────────────────────────────────

router.post("/:id/scorecards",         requireAuth, requirePermission("hr.scorecards.write"), addScorecard);
router.delete("/:id/scorecards/:scId", requireAuth, requirePermission("hr.scorecards.write"), removeScorecard);

// ── Learning Goals ────────────────────────────────────────────────────────────

router.post("/:id/learning-goals",             requireAuth, requirePermission("hr.staff.write"), addLearningGoal);
router.patch("/:id/learning-goals/:goalId",    requireAuth, requirePermission("hr.staff.write"), updateLearningGoal);
router.delete("/:id/learning-goals/:goalId",   requireAuth, requirePermission("hr.staff.write"), removeLearningGoal);

export default router;
