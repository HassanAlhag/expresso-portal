import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from "./role.controller.js";

const router = express.Router();

router.get("/", requireAuth, requirePermission("iam.roles.read"), listRoles);
router.get("/:id", requireAuth, requirePermission("iam.roles.read"), getRole);

router.post("/", requireAuth, requirePermission("iam.roles.write"), createRole);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("iam.roles.write"),
  updateRole
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("iam.roles.write"),
  deleteRole
);

export default router;
