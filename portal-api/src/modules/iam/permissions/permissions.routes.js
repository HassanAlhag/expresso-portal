import express from "express";
import { requireAuth } from "../../../middleware/auth.js";
import { PERMISSION_CATALOG, ALL_PERMISSION_KEYS, DEFAULT_ROLE_PERMISSIONS } from "../../../config/permissions.js";

const router = express.Router();

/**
 * GET /api/permissions/catalog
 * Returns the full permission catalog organized by domain, plus default sets.
 * Any authenticated user can fetch this (it's not sensitive — it's just metadata).
 */
router.get("/catalog", requireAuth, (_req, res) => {
  return res.json({
    ok: true,
    catalog: PERMISSION_CATALOG,
    allKeys: ALL_PERMISSION_KEYS,
    defaults: DEFAULT_ROLE_PERMISSIONS,
  });
});

export default router;
