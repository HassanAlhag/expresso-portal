import { Router } from "express";
import {
  listPortfolio,
  getPortfolioBySlug,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
} from "./portfolio.controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";

const router = Router();

// Public — website showcase
router.get("/", listPortfolio);
router.get("/:slug", getPortfolioBySlug);

// Admin — require auth + admin/super_admin role
router.post("/", requireAuth, requireRole("admin", "super_admin"), createPortfolio);
router.patch("/:id", requireAuth, requireRole("admin", "super_admin", "staff"), updatePortfolio);
router.delete("/:id", requireAuth, requireRole("admin", "super_admin"), deletePortfolio);

export default router;
