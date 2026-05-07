import multer from "multer";

import path from "path";

import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");

    const base = path

      .basename(file.originalname || "file", ext)

      .replace(/\s+/g, "-")

      .slice(0, 48);

    const stamp = Date.now().toString(16);

    cb(null, `${base}-${stamp}${ext}`.toLowerCase());
  },
});

export const upload = multer({
  storage,

  limits: { fileSize: 250 * 1024 * 1024 },
});
