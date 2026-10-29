import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { requireInternalUser } from "../../utils/accessControl.js";
import { operatingOptions, projectOverview, projectAction } from "../operating/operating.controller.js";
import {
  canSeeAllTenantRecords,
  getUserClientId,
} from "../../utils/accessControl.js";
import Project from "./project.model.js";

import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  archiveProject,
} from "./project.controller.js";

const router = express.Router();
router.get("/:id/operating/options", requireAuth, requireInternalUser, requirePermission("projects.write"), operatingOptions);
router.get("/:id/operating", requireAuth, requireInternalUser, requirePermission("projects.read", "jobs.read"), projectOverview);
router.post("/:id/operating/:command", requireAuth, requireInternalUser, requirePermission("projects.write"), projectAction);

// GET /api/projects/stats
router.get(
  "/stats",
  requireAuth,
  requirePermission("projects.read"),
  async (req, res) => {
    const tenantFilter = {};

    if (!canSeeAllTenantRecords(req)) {
      const clientId = getUserClientId(req);
      if (!clientId) {
        return res.json({
          ok: true,
          total: 0,
          byStatus: {},
          byType: {},
          byPriority: {},
        });
      }
      tenantFilter.customerId = clientId;
    }

    const [byStatus, byType, byPriority, total] = await Promise.all([
      Project.aggregate([
        { $match: tenantFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: tenantFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: tenantFilter },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Project.countDocuments(tenantFilter),
    ]);
    return res.json({
      ok: true,
      total,
      byStatus: Object.fromEntries(byStatus.map((x) => [x._id, x.count])),
      byType: Object.fromEntries(byType.map((x) => [x._id, x.count])),
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
