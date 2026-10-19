import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import {
  listMessages,
  sendMessage,
  markRead,
  getUnreadCount,
  getNotificationCounts,
} from "./message.controller.js";

const router = express.Router();

router.get("/notifications/counts", requireAuth, requirePermission("messaging.read"), getNotificationCounts);
router.get("/unread/:customerId", requireAuth, requirePermission("messaging.read"), getUnreadCount);
router.get("/", requireAuth, requirePermission("messaging.read"), listMessages);
router.post("/", requireAuth, requirePermission("messaging.write"), sendMessage);
router.patch("/read/:customerId", requireAuth, requirePermission("messaging.read"), markRead);

export default router;
