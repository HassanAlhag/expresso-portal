import mongoose from "mongoose";
import Application from "./application.model.js";
import Career from "./career.model.js";
import { uploadToS3 } from "../../utils/s3.js";

// POST /careers/cv-upload  (public) — upload a CV file and get back a URL
export async function uploadCV(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: "No file uploaded" });
    }
    const { url: cvUrl } = await uploadToS3(req.file.buffer, "cvs", req.file.originalname, req.file.mimetype);
    return res.json({ ok: true, cvUrl });
  } catch (e) {
    console.error("uploadCV:", e);
    return res.status(500).json({ ok: false, message: "Upload failed" });
  }
}

// POST /careers/:id/apply  (public)
export async function applyForJob(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid career id" });

    const career = await Career.findById(id).lean();
    if (!career || !career.isActive)
      return res.status(404).json({ ok: false, message: "Position not found or closed" });

    const body = req.body || {};
    const fullName = String(body.fullName || "").trim();
    const email    = String(body.email || "").trim().toLowerCase();

    if (!fullName || !email)
      return res.status(400).json({ ok: false, message: "fullName and email are required" });

    const app = await Application.create({
      careerId:    career._id,
      fullName,
      email,
      phone:       String(body.phone || "").trim(),
      coverLetter: String(body.coverLetter || "").trim(),
      cvUrl:       String(body.cvUrl || "").trim(),
      cvMediaId:   body.cvMediaId && mongoose.Types.ObjectId.isValid(body.cvMediaId) ? body.cvMediaId : null,
    });

    return res.status(201).json({ ok: true, item: app });
  } catch (e) {
    console.error("applyForJob:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /careers/:id/applications  (admin)
export async function listApplications(req, res) {
  try {
    const { id } = req.params;
    const { status = "", page = "1", limit = "20" } = req.query;

    const filter = {};
    if (mongoose.Types.ObjectId.isValid(id)) filter.careerId = id;
    if (["new", "reviewing", "interview", "rejected", "hired"].includes(status))
      filter.status = status;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [total, items] = await Promise.all([
      Application.countDocuments(filter),
      Application.find(filter)
        .populate("careerId", "title department")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    return res.json({
      ok: true,
      items,
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (e) {
    console.error("listApplications:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /applications  (admin - all applications across careers)
export async function listAllApplications(req, res) {
  try {
    const { status = "", careerId = "", page = "1", limit = "20" } = req.query;

    const filter = {};
    if (["new", "reviewing", "interview", "rejected", "hired"].includes(status))
      filter.status = status;
    if (mongoose.Types.ObjectId.isValid(careerId))
      filter.careerId = careerId;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [total, items] = await Promise.all([
      Application.countDocuments(filter),
      Application.find(filter)
        .populate("careerId", "title department")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    return res.json({
      ok: true,
      items,
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (e) {
    console.error("listAllApplications:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// PATCH /applications/:id/status  (admin)
export async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const { status, notes } = req.body || {};
    if (!["new", "reviewing", "interview", "rejected", "hired"].includes(status))
      return res.status(400).json({ ok: false, message: "Invalid status" });

    const patch = { status, reviewedBy: req.user?.id || null };
    if (notes !== undefined) patch.notes = String(notes || "").trim();

    const item = await Application.findByIdAndUpdate(id, patch, { new: true })
      .populate("careerId", "title department")
      .lean();

    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateApplicationStatus:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
