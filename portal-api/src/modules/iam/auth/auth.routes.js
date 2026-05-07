import express from "express";
import { requireAuth } from "../../../middleware/auth.js";
import { login, me, changePassword } from "./auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", requireAuth, me);
router.patch("/change-password", requireAuth, changePassword);

export default router;
