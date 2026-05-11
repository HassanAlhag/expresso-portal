import express from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import {
  listLeads,
  listLeadAssignees,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToDeal,
} from "./lead.controller.js";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  listLeads
);
router.get(
  "/assignees",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  listLeadAssignees
);
router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  getLeadById
);
router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  createLead
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  updateLead
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteLead
);

router.post(
  "/:id/convert",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  convertLeadToDeal
);

export default router;
