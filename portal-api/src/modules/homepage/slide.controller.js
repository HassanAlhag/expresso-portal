import mongoose from "mongoose";
import Slide from "./slide.model.js";

const cleanString = (value, fallback = "") => String(value || fallback).trim();
const objectIdOrNull = (value) =>
  value && mongoose.Types.ObjectId.isValid(value) ? value : null;

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
      eyebrowLeft: cleanString(body.eyebrowLeft, "EXPRESSO DIGITAL"),
      eyebrowRight: cleanString(body.eyebrowRight, "GROWTH SYSTEMS"),
      title: cleanString(body.title),
      subtitle: cleanString(body.subtitle),
      imageUrl: cleanString(body.imageUrl),
      imageMediaId: objectIdOrNull(body.imageMediaId),
      thumbImageUrl: cleanString(body.thumbImageUrl),
      thumbImageMediaId: objectIdOrNull(body.thumbImageMediaId),
      ctaLabel: cleanString(body.ctaLabel),
      ctaUrl: cleanString(body.ctaUrl),
      secondaryCtaLabel: cleanString(body.secondaryCtaLabel),
      secondaryCtaUrl: cleanString(body.secondaryCtaUrl),
      order: Number(body.order) || 0,
      isActive: body.isActive !== false,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
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

    if (typeof body.eyebrowLeft !== "undefined")
      patch.eyebrowLeft = cleanString(body.eyebrowLeft);
    if (typeof body.eyebrowRight !== "undefined")
      patch.eyebrowRight = cleanString(body.eyebrowRight);
    if (typeof body.title !== "undefined") patch.title = cleanString(body.title);
    if (typeof body.subtitle !== "undefined")
      patch.subtitle = cleanString(body.subtitle);
    if (typeof body.imageUrl !== "undefined")
      patch.imageUrl = cleanString(body.imageUrl);
    if (typeof body.thumbImageUrl !== "undefined")
      patch.thumbImageUrl = cleanString(body.thumbImageUrl);
    if (typeof body.ctaLabel !== "undefined")
      patch.ctaLabel = cleanString(body.ctaLabel);
    if (typeof body.ctaUrl !== "undefined") patch.ctaUrl = cleanString(body.ctaUrl);
    if (typeof body.secondaryCtaLabel !== "undefined")
      patch.secondaryCtaLabel = cleanString(body.secondaryCtaLabel);
    if (typeof body.secondaryCtaUrl !== "undefined")
      patch.secondaryCtaUrl = cleanString(body.secondaryCtaUrl);
    if (typeof body.order !== "undefined") patch.order = Number(body.order) || 0;
    if (typeof body.isActive !== "undefined") patch.isActive = Boolean(body.isActive);
    if (typeof body.imageMediaId !== "undefined") {
      patch.imageMediaId = objectIdOrNull(body.imageMediaId);
    }
    if (typeof body.thumbImageMediaId !== "undefined") {
      patch.thumbImageMediaId = objectIdOrNull(body.thumbImageMediaId);
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
