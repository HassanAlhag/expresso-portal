import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  listPublicCategories,
  getCategoryTree,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.controller.js";

const router = express.Router();

router.get("/public", listPublicCategories);
router.get("/tree", getCategoryTree);

router.get(
  "/",
  requireAuth,
  requireRole("super_admin", "admin", "staff"),
  listCategories
);

router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "admin"),
  createCategory
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  updateCategory
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  deleteCategory
);

export default router;
