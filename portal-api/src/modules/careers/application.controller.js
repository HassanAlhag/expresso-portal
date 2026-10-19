import mongoose from "mongoose";
import Application from "./application.model.js";
import Career from "./career.model.js";
import { putPrivate, privateDownloadUrl } from "../../utils/privateStorage.js";

// POST /careers/cv-upload  (public) — store a CV privately; returns an opaque key
export async function uploadCV(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: "No file uploaded" });
    }
    const { key } = await putPrivate(req.file.buffer, "cvs", req.file.originalname, req.file.mimetype);
    return res.json({ ok: true, cvKey: key });
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

    // Only keys produced by /cv-upload are accepted.
    const cvKey = /^private\/cvs\/[a-z0-9._-]+$/i.test(String(body.cvKey || "")) ? String(body.cvKey) : "";

    const app = await Application.create({
      careerId:    career._id,
      fullName,
      email,
      phone:       String(body.phone || "").trim(),
      coverLetter: String(body.coverLetter || "").trim(),
      cvKey,
      hasCv:       Boolean(cvKey),
      cvMediaId:   body.cvMediaId && mongoose.Types.ObjectId.isValid(body.cvMediaId) ? body.cvMediaId : null,
    });

    const item = app.toObject();
    delete item.cvKey;
    return res.status(201).json({ ok: true, item });
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

// GET /careers/applications/:id/cv-url  (admin) — short-lived link to the CV
export async function getApplicationCvUrl(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });
    const app = await Application.findById(id).select("+cvKey cvUrl fullName").lean();
    if (!app) return res.status(404).json({ ok: false, message: "Not found" });
    if (app.cvKey) {
      const safeName = String(app.fullName || "candidate").replace(/[^a-z0-9]+/gi, "-");
      const ext = (app.cvKey.match(/\.[a-z0-9]+$/i) || [""])[0];
      const url = await privateDownloadUrl(app.cvKey, { filename: `CV-${safeName}${ext}` });
      return res.json({ ok: true, url });
    }
    return res.json({ ok: true, url: app.cvUrl || "" });
  } catch (e) {
    console.error("getApplicationCvUrl:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
