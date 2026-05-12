import { Router } from "express";
import {
  listPortfolio,
  getPortfolioBySlug,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
} from "./portfolio.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";

const router = Router();

// Public — website showcase
router.get("/", listPortfolio);
router.get("/:slug", getPortfolioBySlug);

// Portal management
router.post("/", requireAuth, requirePermission("portfolio.write"), createPortfolio);
router.patch("/:id", requireAuth, requirePermission("portfolio.write"), updatePortfolio);
router.delete("/:id", requireAuth, requirePermission("portfolio.delete"), deletePortfolio);

export default router;
