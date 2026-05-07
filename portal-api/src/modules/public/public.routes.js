import express from "express";
import { submitPlanBuilder } from "./public.controller.js";

const router = express.Router();

router.post("/plan-submissions", submitPlanBuilder);

export default router;
