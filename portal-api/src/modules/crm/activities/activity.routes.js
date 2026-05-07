import express from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
} from "./activity.controller.js";

const router = express.Router();

const staff = requireRole("super_admin", "admin", "staff");

router.get("/", requireAuth, staff, listActivities);
router.get("/:id", requireAuth, staff, getActivity);
router.post("/", requireAuth, staff, createActivity);
router.patch("/:id", requireAuth, staff, updateActivity);
router.delete("/:id", requireAuth, requireRole("super_admin", "admin"), deleteActivity);

export default router;
