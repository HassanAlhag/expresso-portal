import express from "express";
import { optionalAuth, requireAuth, requirePermission } from "../../middleware/auth.js";
import {
  listServices,
  getServiceBySlug,
  createService,
  updateService,
  deleteService,
  reorderServices,
  listSolutions,
  getSolutionBySlug,
  createSolution,
  updateSolution,
  deleteSolution,
  reorderSolutions,
} from "./webContent.controller.js";

const router = express.Router();

// ─── Digital Services (public reads) ─────────────────────────────────────────
// Active records only, unless the caller is a signed-in website editor.
router.get("/services", optionalAuth, listServices);
router.get("/services/:slug", optionalAuth, getServiceBySlug);
router.post("/services", requireAuth, requirePermission("website.write"), createService);
router.patch("/services/reorder", requireAuth, requirePermission("website.write"), reorderServices);
router.patch("/services/:id", requireAuth, requirePermission("website.write"), updateService);
router.delete("/services/:id", requireAuth, requirePermission("website.write"), deleteService);

// ─── Solutions (public reads) ─────────────────────────────────────────────────
router.get("/solutions", optionalAuth, listSolutions);
router.get("/solutions/:slug", optionalAuth, getSolutionBySlug);
router.post("/solutions", requireAuth, requirePermission("website.write"), createSolution);
router.patch("/solutions/reorder", requireAuth, requirePermission("website.write"), reorderSolutions);
router.patch("/solutions/:id", requireAuth, requirePermission("website.write"), updateSolution);
router.delete("/solutions/:id", requireAuth, requirePermission("website.write"), deleteSolution);

export default router;
