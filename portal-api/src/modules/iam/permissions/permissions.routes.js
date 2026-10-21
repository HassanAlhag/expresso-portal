import express from "express";
import { requireAuth } from "../../../middleware/auth.js";
import { PERMISSION_CATALOG, ALL_PERMISSION_KEYS, DEFAULT_ROLE_PERMISSIONS } from "../../../config/permissions.js";
import { EXTERNAL_DENIED_PREFIXES } from "../../../utils/roleRegistry.js";

const router = express.Router();

/**
 * GET /api/permissions/catalog
 * The authoritative permission catalog (the portal has no copy of its own):
 * keys by domain, built-in role defaults, and the prefixes client/vendor
 * roles can never hold.
 * Any authenticated user can fetch this (it's not sensitive — it's just metadata).
 */
router.get("/catalog", requireAuth, (_req, res) => {
  return res.json({
    ok: true,
    catalog: PERMISSION_CATALOG,
    allKeys: ALL_PERMISSION_KEYS,
    defaults: DEFAULT_ROLE_PERMISSIONS,
    externalDeniedPrefixes: EXTERNAL_DENIED_PREFIXES,
  });
});

export default router;
