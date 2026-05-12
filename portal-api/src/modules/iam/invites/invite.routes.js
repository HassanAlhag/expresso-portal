import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  listInvites,
  createInvite,
  cancelInvite,
  resendInvite,
} from "./invite.controller.js";

const router = express.Router();

router.get("/", requireAuth, requirePermission("iam.invites.send"), listInvites);
router.post(
  "/",
  requireAuth,
  requirePermission("iam.invites.send"),
  createInvite
);
router.post(
  "/:id/cancel",
  requireAuth,
  requirePermission("iam.invites.send"),
  cancelInvite
);
router.post(
  "/:id/resend",
  requireAuth,
  requirePermission("iam.invites.send"),
  resendInvite
);

export default router;
