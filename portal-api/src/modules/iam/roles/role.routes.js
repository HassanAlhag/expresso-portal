import express from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from "./role.controller.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("super_admin", "admin"), listRoles);
router.get("/:id", requireAuth, requireRole("super_admin", "admin"), getRole);

router.post("/", requireAuth, requireRole("super_admin", "admin"), createRole);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  updateRole
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteRole
);

export default router;
