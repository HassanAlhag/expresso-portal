import { Router } from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
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

router.get("/", requireRole("super_admin", "admin", "staff"), listJobs);
router.post("/", requireRole("super_admin", "admin", "staff"), createJob);

router.post(
  "/generate/from-enrollment/:enrollmentId",
  requireRole("super_admin", "admin"),
  generateJobsForEnrollment
);

router.get("/:id", requireRole("super_admin", "admin", "staff"), getJob);
router.patch("/:id", requireRole("super_admin", "admin", "staff"), updateJob);
router.delete("/:id", requireRole("super_admin", "admin"), deleteJob);

router.post(
  "/:id/attach-media",
  requireRole("super_admin", "admin", "staff"),
  attachMedia
);

router.post(
  "/:id/approval",
  requireRole("super_admin", "admin", "staff"),
  addApproval
);

router.post(
  "/:id/publish",
  requireRole("super_admin", "admin"),
  publishToWebsite
);

export default router;
