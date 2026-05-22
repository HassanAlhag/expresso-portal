import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import {
  listBrandAssets,
  createBrandAsset,
  updateBrandAsset,
  deleteBrandAsset,
} from "./brandAsset.controller.js";

const router = express.Router();

router.get("/",      requireAuth, requirePermission("brand_kit.read"),   listBrandAssets);
router.post("/",     requireAuth, requirePermission("brand_kit.write"),  createBrandAsset);
router.patch("/:id", requireAuth, requirePermission("brand_kit.write"),  updateBrandAsset);
router.delete("/:id",requireAuth, requirePermission("brand_kit.write"),  deleteBrandAsset);

export default router;
