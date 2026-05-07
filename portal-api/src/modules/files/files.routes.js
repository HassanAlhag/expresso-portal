import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";

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
  requireRole("super_admin", "admin", "staff", "client"),
  listFiles
);

router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff", "client"),
  getFile
);

router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  upload.array("files", 20),
  uploadFiles
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  updateFile
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteFile
);

export default router;
