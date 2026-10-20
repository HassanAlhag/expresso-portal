import { Router } from "express";
import {
  listProductions,
  getProductionBySlug,
  createProduction,
  updateProduction,
  deleteProduction,
} from "./production.controller.js";
import { optionalAuth, requireAuth, requirePermission } from "../../../middleware/auth.js";

const router = Router();

// Public — website showcase
// Published items only, unless the caller holds productions.read.
router.get("/", optionalAuth, listProductions);
router.get("/:slug", optionalAuth, getProductionBySlug);

// Portal management
router.post("/", requireAuth, requirePermission("productions.write"), createProduction);
router.patch("/:id", requireAuth, requirePermission("productions.write"), updateProduction);
router.delete("/:id", requireAuth, requirePermission("productions.delete"), deleteProduction);
router.patch("/:id/status", requireAuth, requirePermission("productions.write"), (req, res) => {
  req.body = { status: req.body.status };
  return updateProduction(req, res);
});

export default router;
