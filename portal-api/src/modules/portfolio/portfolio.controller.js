import mongoose from "mongoose";
import Portfolio from "./portfolio.model.js";

function safeRx(s) {
  const v = String(s || "").trim();
  if (!v) return null;
  return new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export async function listPortfolio(req, res) {
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
    Portfolio.countDocuments(filter),
    Portfolio.find(filter)
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

export async function getPortfolioBySlug(req, res) {
  const { slug } = req.params;

  const isId = /^[a-f\d]{24}$/i.test(slug);
  const query = isId
    ? Portfolio.findById(slug)
    : Portfolio.findOne({ slug: String(slug).toLowerCase() });

  const item = await query
    .populate("coverMedia", "url thumbnailUrl type title")
    .populate("gallery", "url thumbnailUrl type title")
    .lean();

  if (!item) return res.status(404).json({ ok: false, message: "Not found" });
  res.json({ ok: true, item });
}

export async function createPortfolio(req, res) {
  const { title, slug } = req.body;
  if (!title || !String(title).trim())
    return res.status(400).json({ ok: false, message: "Title is required" });
  if (!slug || !String(slug).trim())
    return res.status(400).json({ ok: false, message: "Slug is required" });

  const cleanSlug = String(slug).trim().toLowerCase();
  const exists = await Portfolio.findOne({ slug: cleanSlug }).lean();
  if (exists)
    return res.status(409).json({ ok: false, message: "Slug already exists" });

  const body = req.body || {};
  const status = ["draft", "published", "archived"].includes(body.status)
    ? body.status
    : "draft";

  const item = await Portfolio.create({
    title: String(body.title).trim(),
    slug: cleanSlug,
    excerpt: body.excerpt || "",
    description: body.description || "",
    coverMedia: mongoose.Types.ObjectId.isValid(body.coverMedia)
      ? body.coverMedia
      : null,
    gallery: Array.isArray(body.gallery)
      ? body.gallery.filter(mongoose.Types.ObjectId.isValid)
      : [],
    tags: Array.isArray(body.tags)
      ? body.tags
      : String(body.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
    category: body.category || "",
    status,
    publishedAt: status === "published" ? new Date() : null,
    seo: {
      metaTitle: body.seo?.metaTitle || "",
      metaDesc: body.seo?.metaDesc || "",
    },
  });

  res.status(201).json({ ok: true, item });
}

export async function updatePortfolio(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ ok: false, message: "Invalid id" });

  const body = req.body || {};
  const patch = {};

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
    const exists = await Portfolio.findOne({
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

  const item = await Portfolio.findByIdAndUpdate(id, patch, { new: true })
    .populate("coverMedia", "url thumbnailUrl type title")
    .populate("gallery", "url thumbnailUrl type title")
    .lean();

  if (!item) return res.status(404).json({ ok: false, message: "Not found" });

  res.json({ ok: true, item });
}

export async function deletePortfolio(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ ok: false, message: "Invalid id" });

  const item = await Portfolio.findByIdAndDelete(id).lean();
  if (!item) return res.status(404).json({ ok: false, message: "Not found" });

  res.json({ ok: true });
}
