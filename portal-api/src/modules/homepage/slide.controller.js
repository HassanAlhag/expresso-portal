import mongoose from "mongoose";
import Slide from "./slide.model.js";

export async function listPublicSlides(req, res) {
  try {
    const slides = await Slide.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();
    return res.json({ ok: true, items: slides });
  } catch (e) {
    console.error("listPublicSlides:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function listSlides(req, res) {
  try {
    const slides = await Slide.find().sort({ order: 1, createdAt: -1 }).lean();
    return res.json({ ok: true, items: slides });
  } catch (e) {
    console.error("listSlides:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createSlide(req, res) {
  try {
    const body = req.body || {};
    const slide = await Slide.create({
      title:        String(body.title || "").trim(),
      subtitle:     String(body.subtitle || "").trim(),
      imageUrl:     String(body.imageUrl || "").trim(),
      imageMediaId: body.imageMediaId && mongoose.Types.ObjectId.isValid(body.imageMediaId) ? body.imageMediaId : null,
      ctaLabel:     String(body.ctaLabel || "").trim(),
      ctaUrl:       String(body.ctaUrl || "").trim(),
      order:        Number(body.order) || 0,
      isActive:     body.isActive !== false,
      createdBy:    req.user?.id || null,
      updatedBy:    req.user?.id || null,
    });
    return res.status(201).json({ ok: true, item: slide });
  } catch (e) {
    console.error("createSlide:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateSlide(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const body = req.body || {};
    const patch = { updatedBy: req.user?.id || null };

    if (typeof body.title     !== "undefined") patch.title     = String(body.title || "").trim();
    if (typeof body.subtitle  !== "undefined") patch.subtitle  = String(body.subtitle || "").trim();
    if (typeof body.imageUrl  !== "undefined") patch.imageUrl  = String(body.imageUrl || "").trim();
    if (typeof body.ctaLabel  !== "undefined") patch.ctaLabel  = String(body.ctaLabel || "").trim();
    if (typeof body.ctaUrl    !== "undefined") patch.ctaUrl    = String(body.ctaUrl || "").trim();
    if (typeof body.order     !== "undefined") patch.order     = Number(body.order) || 0;
    if (typeof body.isActive  !== "undefined") patch.isActive  = Boolean(body.isActive);
    if (typeof body.imageMediaId !== "undefined") {
      patch.imageMediaId = body.imageMediaId && mongoose.Types.ObjectId.isValid(body.imageMediaId) ? body.imageMediaId : null;
    }

    const item = await Slide.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateSlide:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteSlide(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await Slide.findByIdAndDelete(id).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteSlide:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
