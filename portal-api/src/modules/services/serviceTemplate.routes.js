import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import {
  listServiceTemplates,
  getServiceTemplate,
  createServiceTemplate,
  updateServiceTemplate,
  deleteServiceTemplate,
  uploadServiceTemplateFiles,
  getServiceTemplateFileUrl,
} from "./serviceTemplate.controller.js";
import { upload } from "../files/files.upload.js";

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

router.post(
  "/:id/files",
  requireAuth,
  requirePermission("services.write"),
  upload.array("files", 20),
  uploadServiceTemplateFiles
);

router.get(
  "/:id/files/:fileId/url",
  requireAuth,
  requirePermission("services.read"),
  getServiceTemplateFileUrl
);

export default router;
