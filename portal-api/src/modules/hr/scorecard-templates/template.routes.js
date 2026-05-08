import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "./template.controller.js";

const router = express.Router();

router.get("/",     requireAuth, requirePermission("hr.scorecards.read"),  listTemplates);
router.post("/",    requireAuth, requirePermission("hr.scorecards.write"), createTemplate);
router.patch("/:id",requireAuth, requirePermission("hr.scorecards.write"), updateTemplate);
router.delete("/:id",requireAuth, requirePermission("hr.scorecards.write"), deleteTemplate);

export default router;
