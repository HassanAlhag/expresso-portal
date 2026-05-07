import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  listServiceTemplates,
  getServiceTemplate,
  createServiceTemplate,
  updateServiceTemplate,
  deleteServiceTemplate,
} from "./serviceTemplate.controller.js";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requireRole("super_admin", "admin"),
  listServiceTemplates
);

router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  getServiceTemplate
);

router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin"),
  createServiceTemplate
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  updateServiceTemplate
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteServiceTemplate
);

export default router;
