import { Router } from "express";
import {
  listProductions,
  getProductionBySlug,
  createProduction,
  updateProduction,
  deleteProduction,
} from "./production.controller.js";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";

const router = Router();

// Public — website showcase
router.get("/", listProductions);
router.get("/:slug", getProductionBySlug);

// Portal management
router.post("/", requireAuth, requirePermission("productions.write"), createProduction);
router.patch("/:id", requireAuth, requirePermission("productions.write"), updateProduction);
router.delete("/:id", requireAuth, requirePermission("productions.delete"), deleteProduction);
router.patch("/:id/status", requireAuth, requirePermission("productions.write"), (req, res) => {
  req.body = { status: req.body.status };
  return updateProduction(req, res);
});

export default router;
