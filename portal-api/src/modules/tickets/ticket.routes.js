import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  addComment,
  updateStatus,
  approveTicket,
  getTicketStats,
} from "./ticket.controller.js";

const router = express.Router();

// Stats must come before /:id to avoid param capture
router.get("/stats", requireAuth, requirePermission("tickets.read"), getTicketStats);

router.get("/", requireAuth, requirePermission("tickets.read"), listTickets);
router.post("/", requireAuth, requirePermission("tickets.write"), createTicket);

router.get("/:id", requireAuth, requirePermission("tickets.read"), getTicket);
router.patch("/:id", requireAuth, requirePermission("tickets.write"), updateTicket);
router.post("/:id/comments", requireAuth, requirePermission("tickets.write"), addComment);
router.patch("/:id/status", requireAuth, requirePermission("tickets.write"), updateStatus);
router.patch("/:id/approve", requireAuth, requirePermission("tickets.write"), approveTicket);

export default router;
