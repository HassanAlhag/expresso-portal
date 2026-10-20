import { Router } from "express";
import {
  listPortfolio,
  getPortfolioBySlug,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
} from "./portfolio.controller.js";
import { optionalAuth, requireAuth, requirePermission } from "../../middleware/auth.js";

const router = Router();

// Public — website showcase. Published items only, unless the caller is a
// signed-in portfolio manager (portfolio.read), who also sees drafts.
router.get("/", optionalAuth, listPortfolio);
router.get("/:slug", optionalAuth, getPortfolioBySlug);

// Portal management
router.post("/", requireAuth, requirePermission("portfolio.write"), createPortfolio);
router.patch("/:id", requireAuth, requirePermission("portfolio.write"), updatePortfolio);
router.delete("/:id", requireAuth, requirePermission("portfolio.delete"), deletePortfolio);

export default router;
