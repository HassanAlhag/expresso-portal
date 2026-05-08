import { Router } from "express";
import multer from "multer";
import { listMedia, uploadMedia, updateMedia, deleteMedia } from "./media.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024 },
});

router.get("/",     listMedia);
router.post("/",    upload.single("file"), uploadMedia);
router.patch("/:id", updateMedia);
router.delete("/:id", deleteMedia);

export default router;
