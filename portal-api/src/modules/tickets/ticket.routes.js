import express from "express";
import { requireAuth } from "../../middleware/auth.js";
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
router.get("/stats", requireAuth, getTicketStats);

router.get("/", requireAuth, listTickets);
router.post("/", requireAuth, createTicket);

router.get("/:id", requireAuth, getTicket);
router.patch("/:id", requireAuth, updateTicket);
router.post("/:id/comments", requireAuth, addComment);
router.patch("/:id/status", requireAuth, updateStatus);
router.patch("/:id/approve", requireAuth, approveTicket);

export default router;
