import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
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
  requirePermission("projects.read"),
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
  requirePermission("projects.read"),
  listProjects
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("projects.read"),
  getProjectById
);

router.post(
  "/",
  requireAuth,
  requirePermission("projects.write"),
  createProject
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("projects.write"),
  updateProject
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("projects.delete"),
  archiveProject
);

export default router;
