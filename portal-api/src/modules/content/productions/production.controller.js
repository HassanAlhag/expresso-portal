import mongoose from "mongoose";
import Production from "./production.model.js";

function safeRx(s) {
  const v = String(s || "").trim();
  if (!v) return null;
  return new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export async function listProductions(req, res) {
  const {
    q = "",
    status = "",
    category = "",
    tag = "",
    page = "1",
    limit = "12",
    sort = "-createdAt",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (tag) filter.tags = tag;

  const rx = safeRx(q);
  if (rx)
    filter.$or = [
      { title: rx },
      { excerpt: rx },
      { tags: rx },
      { category: rx },
    ];

  const [total, items] = await Promise.all([
    Production.countDocuments(filter),
    Production.find(filter)
      .populate("coverMedia", "url thumbnailUrl type title")
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
  ]);

  res.json({
    ok: true,
    items,
    page: pageNum,
    pages: Math.max(1, Math.ceil(total / limitNum)),
    total,
  });
}

export async function getProductionBySlug(req, res) {
  const { slug } = req.params;

  const item = await Production.findOne({ slug: String(slug).toLowerCase() })
    .populate("coverMedia", "url thumbnailUrl type title")
    .populate("gallery", "url thumbnailUrl type title")
    .lean();

  if (!item) return res.status(404).json({ ok: false, message: "Not found" });
  res.json({ ok: true, item });
}

export async function createProduction(req, res) {
  const {
    title,
    slug,
    excerpt = "",
    description = "",
    coverMedia = null,
    gallery = [],
    tags = [],
    category = "",
    status = "draft",
    seo = {},
  } = req.body;

  if (!title || !String(title).trim())
    return res.status(400).json({ ok: false, message: "Title is required" });
  if (!slug || !String(slug).trim())
    return res.status(400).json({ ok: false, message: "Slug is required" });

  const cleanSlug = String(slug).trim().toLowerCase();
  const exists = await Production.findOne({ slug: cleanSlug }).lean();
  if (exists)
    return res.status(409).json({ ok: false, message: "Slug already exists" });

  const item = await Production.create({
    title: String(title).trim(),
    slug: cleanSlug,
    excerpt,
    description,
    coverMedia:
      coverMedia && mongoose.Types.ObjectId.isValid(coverMedia)
        ? coverMedia
        : null,
    gallery: Array.isArray(gallery)
      ? gallery.filter(mongoose.Types.ObjectId.isValid)
      : [],
    tags: Array.isArray(tags)
      ? tags
      : String(tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
    category,
    status: ["draft", "published", "archived"].includes(status)
      ? status
      : "draft",
    publishedAt: status === "published" ? new Date() : null,
    seo: {
      metaTitle: seo?.metaTitle || "",
      metaDesc: seo?.metaDesc || "",
    },
  });

  res.status(201).json({ ok: true, item });
}

export async function updateProduction(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ ok: false, message: "Invalid id" });

  const patch = {};
  const body = req.body || {};

  if (typeof body.title !== "undefined") patch.title = body.title;
  if (typeof body.excerpt !== "undefined") patch.excerpt = body.excerpt;
  if (typeof body.description !== "undefined")
    patch.description = body.description;
  if (typeof body.category !== "undefined") patch.category = body.category;

  if (typeof body.slug !== "undefined") {
    const cleanSlug = String(body.slug || "")
      .trim()
      .toLowerCase();
    if (!cleanSlug)
      return res
        .status(400)
        .json({ ok: false, message: "Slug cannot be empty" });
    const exists = await Production.findOne({
      slug: cleanSlug,
      _id: { $ne: id },
    }).lean();
    if (exists)
      return res
        .status(409)
        .json({ ok: false, message: "Slug already in use" });
    patch.slug = cleanSlug;
  }

  if (typeof body.coverMedia !== "undefined") {
    patch.coverMedia = mongoose.Types.ObjectId.isValid(body.coverMedia)
      ? body.coverMedia
      : null;
  }

  if (typeof body.gallery !== "undefined") {
    patch.gallery = Array.isArray(body.gallery)
      ? body.gallery.filter(mongoose.Types.ObjectId.isValid)
      : [];
  }

  if (typeof body.tags !== "undefined") {
    patch.tags = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
  }

  if (typeof body.status !== "undefined") {
    const s = String(body.status || "").trim();
    if (!["draft", "published", "archived"].includes(s))
      return res.status(400).json({ ok: false, message: "Invalid status" });

    patch.status = s;
    patch.publishedAt = s === "published" ? new Date() : null;
  }

  if (typeof body.seo !== "undefined") {
    patch.seo = {
      metaTitle: body.seo?.metaTitle || "",
      metaDesc: body.seo?.metaDesc || "",
    };
  }

  const item = await Production.findByIdAndUpdate(id, patch, { new: true })
    .populate("coverMedia", "url thumbnailUrl type title")
    .populate("gallery", "url thumbnailUrl type title")
    .lean();

  if (!item) return res.status(404).json({ ok: false, message: "Not found" });

  res.json({ ok: true, item });
}

export async function deleteProduction(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ ok: false, message: "Invalid id" });

  const item = await Production.findByIdAndDelete(id).lean();
  if (!item) return res.status(404).json({ ok: false, message: "Not found" });

  res.json({ ok: true });
}
