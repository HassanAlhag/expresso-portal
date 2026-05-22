import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import { listMetrics, upsertMetrics, deleteMetrics } from "./socialMetrics.controller.js";

const router = express.Router();

router.get("/",      requireAuth, requirePermission("social.metrics.read"),  listMetrics);
router.post("/",     requireAuth, requirePermission("social.metrics.write"), upsertMetrics);
router.delete("/:id",requireAuth, requirePermission("social.metrics.write"), deleteMetrics);

export default router;
