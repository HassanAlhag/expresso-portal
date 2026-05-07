import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  listPublicCareers,
  listCareers,
  createCareer,
  updateCareer,
  deleteCareer,
} from "./career.controller.js";
import {
  uploadCV,
  applyForJob,
  listApplications,
  listAllApplications,
  updateApplicationStatus,
} from "./application.controller.js";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const cvUpload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadsDir),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname || "");
      const base = path.basename(file.originalname || "cv", ext).replace(/\s+/g, "-").slice(0, 48);
      cb(null, `cv-${base}-${Date.now().toString(16)}${ext}`.toLowerCase());
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max for CVs
  fileFilter: (_, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

const router = Router();

// Public
router.get("/public", listPublicCareers);
router.post("/cv-upload", cvUpload.single("cv"), uploadCV);
router.post("/:id/apply", applyForJob);

router.use(requireAuth);

// Career CRUD
router.get("/",       requireRole("super_admin", "admin", "staff"), listCareers);
router.post("/",      requireRole("super_admin", "admin"), createCareer);
router.patch("/:id",  requireRole("super_admin", "admin"), updateCareer);
router.delete("/:id", requireRole("super_admin", "admin"), deleteCareer);

// Applications
router.get("/applications",               requireRole("super_admin", "admin", "staff"), listAllApplications);
router.get("/:id/applications",           requireRole("super_admin", "admin", "staff"), listApplications);
router.patch("/applications/:id/status",  requireRole("super_admin", "admin"), updateApplicationStatus);

export default router;
