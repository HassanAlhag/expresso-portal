import { Router } from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import { requireInternalUser } from "../../../utils/accessControl.js";
import { jobAction, operatingOptions } from "../../operating/operating.controller.js";
import {
  addApproval,
  attachMedia,
  bulkAssignJobs,
  bulkDeleteJobs,
  createJob,
  deleteJob,
  getJob,
  listJobs,
  listPublicWebsiteJobs,
  publishToWebsite,
  updateJob,
  generateJobsForEnrollment,
  updatePostMetrics,
} from "./job.controller.js";

const router = Router();

/**
 * Public website route
 * Must stay ABOVE requireAuth
 */
router.get("/public/website", listPublicWebsiteJobs);

router.use(requireAuth);
router.get("/:id/operating/options", requireInternalUser, requirePermission("jobs.write"), operatingOptions);
router.post("/:id/operating/:command", requireInternalUser, requirePermission("jobs.read"), jobAction);

router.get("/", requirePermission("jobs.read"), listJobs);
router.post("/", requirePermission("jobs.write"), createJob);

router.patch(
  "/bulk/assign",
  requirePermission("jobs.write"),
  bulkAssignJobs
);

router.delete(
  "/bulk",
  requirePermission("jobs.delete"),
  bulkDeleteJobs
);

router.post(
  "/generate/from-enrollment/:enrollmentId",
  requirePermission("jobs.write"),
  generateJobsForEnrollment
);

router.get("/:id", requirePermission("jobs.read"), getJob);
router.patch("/:id", requirePermission("jobs.write"), updateJob);
router.delete("/:id", requirePermission("jobs.delete"), deleteJob);

router.post(
  "/:id/attach-media",
  requirePermission("jobs.write"),
  attachMedia
);

router.post(
  "/:id/approval",
  requirePermission("jobs.write"),
  addApproval
);

router.post(
  "/:id/publish",
  requirePermission("jobs.write"),
  publishToWebsite
);

router.patch(
  "/:id/post-metrics",
  requirePermission("jobs.write"),
  updatePostMetrics
);

export default router;
