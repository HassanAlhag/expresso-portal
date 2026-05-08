import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  listLeaves,
  getLeave,
  createLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveStats,
} from "./leave.controller.js";

const router = express.Router();

router.get("/stats",  requireAuth, requirePermission("hr.leaves.read"),    getLeaveStats);
router.get("/",       requireAuth, requirePermission("hr.leaves.read"),    listLeaves);
router.get("/:id",    requireAuth, requirePermission("hr.leaves.read"),    getLeave);

router.post("/",      requireAuth, requirePermission("hr.leaves.write"),   createLeave);
router.patch("/:id",  requireAuth, requirePermission("hr.leaves.write"),   updateLeave);
router.delete("/:id", requireAuth, requirePermission("hr.leaves.delete"),  deleteLeave);

// Approval actions — separate permission for fine-grained control
router.post("/:id/approve", requireAuth, requirePermission("hr.leaves.approve"), approveLeave);
router.post("/:id/reject",  requireAuth, requirePermission("hr.leaves.approve"), rejectLeave);
router.post("/:id/cancel",  requireAuth, requirePermission("hr.leaves.write"),   cancelLeave);

export default router;
