import { Router } from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { getPublicSettings, getSettings, updateSettings } from "./settings.controller.js";

const router = Router();

router.get("/public", getPublicSettings);
router.get("/", requireAuth, requirePermission("website.read"), getSettings);
router.patch("/", requireAuth, requirePermission("website.write"), updateSettings);

export default router;
