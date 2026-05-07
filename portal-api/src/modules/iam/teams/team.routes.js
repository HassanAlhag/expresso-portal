import express from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  setTeamStatus,
} from "./team.controller.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("super_admin", "admin"), listTeams);
router.get("/:id", requireAuth, requireRole("super_admin", "admin"), getTeam);

router.post("/", requireAuth, requireRole("super_admin", "admin"), createTeam);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  updateTeam
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("super_admin", "admin"),
  setTeamStatus
);

export default router;
