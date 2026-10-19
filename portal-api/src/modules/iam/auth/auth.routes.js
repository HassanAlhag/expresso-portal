import express from "express";
import { requireAuth } from "../../../middleware/auth.js";
import { login, me, changePassword, forgotPassword, resetPassword, googleLogin } from "./auth.controller.js";
import { createAccessRequest } from "../access-requests/accessRequest.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", requireAuth, me);
router.patch("/change-password", requireAuth, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/request-access", createAccessRequest);

export default router;
