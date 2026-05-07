import { Router } from "express";
import {
  listProductions,
  getProductionBySlug,
  createProduction,
  updateProduction,
  deleteProduction,
} from "./production.controller.js";
import { requireAuth, requireRole } from "../../../middleware/auth.js";

const router = Router();

// Public — website showcase
router.get("/", listProductions);
router.get("/:slug", getProductionBySlug);

// Admin — require auth + admin/super_admin role
router.post("/", requireAuth, requireRole("admin", "super_admin"), createProduction);
router.patch("/:id", requireAuth, requireRole("admin", "super_admin", "staff"), updateProduction);
router.delete("/:id", requireAuth, requireRole("admin", "super_admin"), deleteProduction);
router.patch("/:id/status", requireAuth, requireRole("admin", "super_admin", "staff"), (req, res) => {
  req.body = { status: req.body.status };
  return updateProduction(req, res);
});

export default router;
