import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { getPublicSettings, getSettings, updateSettings } from "./settings.controller.js";

const router = Router();

router.get("/public", getPublicSettings);
router.get("/", requireAuth, requireRole("super_admin", "admin", "staff"), getSettings);
router.patch("/", requireAuth, requireRole("super_admin", "admin"), updateSettings);

export default router;
