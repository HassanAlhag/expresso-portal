import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { listPublicSlides, listSlides, createSlide, updateSlide, deleteSlide } from "./slide.controller.js";

const router = Router();

router.get("/public", listPublicSlides);

router.use(requireAuth);
router.get("/",       requireRole("super_admin", "admin", "staff"), listSlides);
router.post("/",      requireRole("super_admin", "admin"), createSlide);
router.patch("/:id",  requireRole("super_admin", "admin"), updateSlide);
router.delete("/:id", requireRole("super_admin", "admin"), deleteSlide);

export default router;
