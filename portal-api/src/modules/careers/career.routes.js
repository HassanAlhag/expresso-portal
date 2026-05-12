import { Router } from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import multer from "multer";
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

const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = (file.originalname || "").split(".").pop().toLowerCase();
    cb(null, allowed.includes(`.${ext}`));
  },
});

const router = Router();

// Public
router.get("/public", listPublicCareers);
router.post("/cv-upload", cvUpload.single("cv"), uploadCV);
router.post("/:id/apply", applyForJob);

router.use(requireAuth);

// Career CRUD
router.get("/",       requirePermission("website.read"), listCareers);
router.post("/",      requirePermission("website.write"), createCareer);
router.patch("/:id",  requirePermission("website.write"), updateCareer);
router.delete("/:id", requirePermission("website.write"), deleteCareer);

// Applications
router.get("/applications",               requirePermission("website.read"), listAllApplications);
router.get("/:id/applications",           requirePermission("website.read"), listApplications);
router.patch("/applications/:id/status",  requirePermission("website.write"), updateApplicationStatus);

export default router;
