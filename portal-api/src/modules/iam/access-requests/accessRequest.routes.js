import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  listAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  inviteFromAccessRequest,
} from "./accessRequest.controller.js";

const router = express.Router();

// Admin review — reuses the invites permission since approving a request
// is inseparable from being able to send an invite.
router.get("/", requireAuth, requirePermission("iam.invites.send"), listAccessRequests);
router.post(
  "/:id/approve",
  requireAuth,
  requirePermission("iam.invites.send"),
  approveAccessRequest
);
router.post(
  "/:id/reject",
  requireAuth,
  requirePermission("iam.invites.send"),
  rejectAccessRequest
);
router.post(
  "/:id/invite",
  requireAuth,
  requirePermission("iam.invites.send"),
  inviteFromAccessRequest
);

export default router;
