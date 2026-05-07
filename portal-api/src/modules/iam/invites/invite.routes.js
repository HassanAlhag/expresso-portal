import express from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import {
  listInvites,
  createInvite,
  cancelInvite,
  resendInvite,
} from "./invite.controller.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("super_admin", "admin"), listInvites);
router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin"),
  createInvite
);
router.post(
  "/:id/cancel",
  requireAuth,
  requireRole("super_admin", "admin"),
  cancelInvite
);
router.post(
  "/:id/resend",
  requireAuth,
  requireRole("super_admin", "admin"),
  resendInvite
);

export default router;
