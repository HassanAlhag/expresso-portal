import { Router } from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { listPublicSlides, listSlides, createSlide, updateSlide, deleteSlide } from "./slide.controller.js";

const router = Router();

router.get("/public", listPublicSlides);

router.use(requireAuth);
router.get("/",       requirePermission("website.read"), listSlides);
router.post("/",      requirePermission("website.write"), createSlide);
router.patch("/:id",  requirePermission("website.write"), updateSlide);
router.delete("/:id", requirePermission("website.write"), deleteSlide);

export default router;
