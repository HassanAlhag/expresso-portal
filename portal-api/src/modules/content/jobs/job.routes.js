import { Router } from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  addApproval,
  attachMedia,
  createJob,
  deleteJob,
  getJob,
  listJobs,
  listPublicWebsiteJobs,
  publishToWebsite,
  updateJob,
  generateJobsForEnrollment,
} from "./job.controller.js";

const router = Router();

/**
 * Public website route
 * Must stay ABOVE requireAuth
 */
router.get("/public/website", listPublicWebsiteJobs);

router.use(requireAuth);

router.get("/", requirePermission("jobs.read"), listJobs);
router.post("/", requirePermission("jobs.write"), createJob);

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

export default router;
