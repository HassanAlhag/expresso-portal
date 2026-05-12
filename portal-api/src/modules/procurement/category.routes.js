import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { requireInternalUser } from "../../utils/accessControl.js";
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
  requireInternalUser,
  requirePermission("procurement.read"),
  listCategories
);

router.post(
  "/",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.write"),
  createCategory
);

router.patch(
  "/:id",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.write"),
  updateCategory
);

router.delete(
  "/:id",
  requireAuth,
  requireInternalUser,
  requirePermission("procurement.delete"),
  deleteCategory
);

export default router;
