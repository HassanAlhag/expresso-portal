import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
} from "./activity.controller.js";

const router = express.Router();

router.get("/", requireAuth, requirePermission("crm.read"), listActivities);
router.get("/:id", requireAuth, requirePermission("crm.read"), getActivity);
router.post("/", requireAuth, requirePermission("crm.write"), createActivity);
router.patch("/:id", requireAuth, requirePermission("crm.write"), updateActivity);
router.delete("/:id", requireAuth, requirePermission("crm.delete"), deleteActivity);

export default router;
