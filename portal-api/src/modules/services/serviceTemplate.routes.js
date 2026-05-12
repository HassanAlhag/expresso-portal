import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
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
  requirePermission("services.read"),
  listServiceTemplates
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("services.read"),
  getServiceTemplate
);

router.post(
  "/",
  requireAuth,
  requirePermission("services.write"),
  createServiceTemplate
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("services.write"),
  updateServiceTemplate
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("services.delete"),
  deleteServiceTemplate
);

export default router;
