import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import Audit from "./audit.model.js";
import mongoose from "mongoose";

const router = express.Router();

// GET /api/audit?page&limit&q&action&actorEmail
router.get(
  "/audit",
  requireAuth,
  requirePermission("activity.read"),
  async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "30", 10)));
    const { q = "", action = "", actorEmail = "" } = req.query;

    const filter = {};
    if (action) filter.action = { $regex: action, $options: "i" };
    if (actorEmail) filter.actorEmail = { $regex: actorEmail, $options: "i" };
    if (q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ action: rx }, { actorEmail: rx }, { ip: rx }];
    }

    const [total, items] = await Promise.all([
      Audit.countDocuments(filter),
      Audit.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.json({
      ok: true,
      items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  }
);

// GET /api/users/:id/activity?page&limit
router.get(
  "/users/:id/activity",
  requireAuth,
  requirePermission("activity.read"),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid user id" });
    }

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit || "20", 10))
    );

    const [total, items] = await Promise.all([
      Audit.countDocuments({ targetUserId: id }),
      Audit.find({ targetUserId: id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.json({
      ok: true,
      items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  }
);

export default router;
