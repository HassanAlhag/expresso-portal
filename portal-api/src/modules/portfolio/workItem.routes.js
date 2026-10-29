import { Router } from "express";
import {
  listWorkItems,
  getWorkItem,
  createWorkItem,
  updateWorkItem,
  reorderWorkItems,
  deleteWorkItem,
  createWorkItemFromCaseStudy,
} from "./workItem.controller.js";
import { optionalAuth, requireAuth, requirePermission } from "../../middleware/auth.js";

// Public Portfolio (visual work). Case studies stay on /api/portfolio.
const router = Router();

// Public: published items only, unless the caller holds work.read.
router.get("/", optionalAuth, listWorkItems);
router.get("/:slug", optionalAuth, getWorkItem);

// Portal management
router.post("/", requireAuth, requirePermission("work.write"), createWorkItem);
router.post("/from-case-study/:caseStudyId", requireAuth, requirePermission("work.write"), createWorkItemFromCaseStudy);
router.patch("/reorder", requireAuth, requirePermission("work.write"), reorderWorkItems);
router.patch("/:id", requireAuth, requirePermission("work.write"), updateWorkItem);
router.delete("/:id", requireAuth, requirePermission("work.delete"), deleteWorkItem);

export default router;
