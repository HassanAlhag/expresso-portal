import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
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
  requirePermission("crm.read"),
  listLeads
);
router.get(
  "/assignees",
  requireAuth,
  requirePermission("crm.read"),
  listLeadAssignees
);
router.get(
  "/:id",
  requireAuth,
  requirePermission("crm.read"),
  getLeadById
);
router.post(
  "/",
  requireAuth,
  requirePermission("crm.write"),
  createLead
);
router.patch(
  "/:id",
  requireAuth,
  requirePermission("crm.write"),
  updateLead
);
router.delete(
  "/:id",
  requireAuth,
  requirePermission("crm.delete"),
  deleteLead
);

router.post(
  "/:id/convert",
  requireAuth,
  requirePermission("crm.write"),
  convertLeadToDeal
);

export default router;
