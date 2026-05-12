import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";

import { upload } from "./files.upload.js";
import {
  listFiles,
  getFile,
  uploadFiles,
  updateFile,
  deleteFile,
} from "./files.controller.js";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requirePermission("files.read"),
  listFiles
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("files.read"),
  getFile
);

router.post(
  "/",
  requireAuth,
  requirePermission("files.write"),
  upload.array("files", 20),
  uploadFiles
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("files.write"),
  updateFile
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("files.delete"),
  deleteFile
);

export default router;
