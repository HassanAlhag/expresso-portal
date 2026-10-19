import { Router } from "express";
import multer from "multer";
import { mediaFileFilter } from "../../../utils/uploadPolicy.js";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import { listMedia, uploadMedia, updateMedia, deleteMedia } from "./media.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024 },
  fileFilter: mediaFileFilter,
});

router.use(requireAuth);

router.get("/",      requirePermission("media.read"),   listMedia);
router.post("/",     requirePermission("media.write"),  upload.single("file"), uploadMedia);
router.patch("/:id", requirePermission("media.write"),  updateMedia);
router.delete("/:id",requirePermission("media.delete"), deleteMedia);

export default router;
