import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import Project from "./project.model.js";

import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  archiveProject,
} from "./project.controller.js";

const router = express.Router();

// GET /api/projects/stats
router.get(
  "/stats",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  async (_req, res) => {
    const [byStatus, byType, byPriority, total] = await Promise.all([
      Project.aggregate([{ $group: { _id: "$status",   count: { $sum: 1 } } }]),
      Project.aggregate([{ $group: { _id: "$type",     count: { $sum: 1 } } }]),
      Project.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Project.countDocuments(),
    ]);
    return res.json({
      ok: true,
      total,
      byStatus:   Object.fromEntries(byStatus.map((x) => [x._id, x.count])),
      byType:     Object.fromEntries(byType.map((x) => [x._id, x.count])),
      byPriority: Object.fromEntries(byPriority.map((x) => [x._id, x.count])),
    });
  }
);

// Mounted at /api/projects
router.get(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  listProjects
);

router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getProjectById
);

router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin"),
  createProject
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  updateProject
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  archiveProject
);

export default router;
