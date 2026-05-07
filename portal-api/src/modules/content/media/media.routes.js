import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  listMedia,
  uploadMedia,
  updateMedia,
  deleteMedia,
} from "./media.controller.js";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads", "media");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safe = `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
    cb(null, safe);
  },
});

const upload = multer({ storage });

// list
router.get("/", listMedia);

// upload
router.post("/", upload.single("file"), uploadMedia);

// update/delete
router.patch("/:id", updateMedia);
router.delete("/:id", deleteMedia);

export default router;
