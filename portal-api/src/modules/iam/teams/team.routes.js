import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  setTeamStatus,
} from "./team.controller.js";

const router = express.Router();

router.get("/", requireAuth, requirePermission("iam.teams.read"), listTeams);
router.get("/:id", requireAuth, requirePermission("iam.teams.read"), getTeam);

router.post("/", requireAuth, requirePermission("iam.teams.write"), createTeam);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("iam.teams.write"),
  updateTeam
);

router.patch(
  "/:id/status",
  requireAuth,
  requirePermission("iam.teams.write"),
  setTeamStatus
);

export default router;
