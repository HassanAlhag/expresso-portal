import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  listMessages,
  sendMessage,
  markRead,
  getUnreadCount,
  getNotificationCounts,
} from "./message.controller.js";

const router = express.Router();

router.get("/notifications/counts", requireAuth, getNotificationCounts);
router.get("/unread/:customerId", requireAuth, getUnreadCount);
router.get("/", requireAuth, listMessages);
router.post("/", requireAuth, sendMessage);
router.patch("/read/:customerId", requireAuth, markRead);

export default router;
