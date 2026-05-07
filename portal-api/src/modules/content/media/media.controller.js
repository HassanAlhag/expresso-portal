import mongoose from "mongoose";
import Media from "./media.model.js";

function safeRx(s) {
  const v = String(s || "").trim();
  if (!v) return null;
  return new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function guessType(mime = "") {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "file";
}

export async function listMedia(req, res) {
  const {
    q = "",
    category = "",
    tag = "",
    status = "",
    page = "1",
    limit = "24",
    sort = "-createdAt",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));

  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (tag) filter.tags = tag;

  const rx = safeRx(q);
  if (rx) filter.$or = [{ title: rx }, { tags: rx }, { category: rx }];

  const [total, items] = await Promise.all([
    Media.countDocuments(filter),
    Media.find(filter)
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

export async function uploadMedia(req, res) {
  // multer provides req.file
  const file = req.file;
  if (!file)
    return res.status(400).json({ ok: false, message: "File is required" });

  const { title = "", tags = "", category = "", status = "draft" } = req.body;

  const type = guessType(file.mimetype);
  const url = `/uploads/media/${file.filename}`;

  const item = await Media.create({
    type,
    url,
    thumbnailUrl: "", // optional later
    filename: file.originalname,
    title: String(title || "").trim(),
    category: String(category || "").trim(),
    tags: Array.isArray(tags)
      ? tags
      : String(tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
    status: ["draft", "approved"].includes(status) ? status : "draft",
  });

  res.status(201).json({ ok: true, item });
}

export async function updateMedia(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ ok: false, message: "Invalid id" });

  const body = req.body || {};
  const patch = {};

  if (typeof body.title !== "undefined") patch.title = body.title;
  if (typeof body.category !== "undefined") patch.category = body.category;
  if (typeof body.status !== "undefined") {
    if (!["draft", "approved"].includes(body.status))
      return res.status(400).json({ ok: false, message: "Invalid status" });
    patch.status = body.status;
  }
  if (typeof body.tags !== "undefined") {
    patch.tags = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
  }

  const item = await Media.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!item) return res.status(404).json({ ok: false, message: "Not found" });

  res.json({ ok: true, item });
}

export async function deleteMedia(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ ok: false, message: "Invalid id" });

  const item = await Media.findByIdAndDelete(id).lean();
  if (!item) return res.status(404).json({ ok: false, message: "Not found" });

  // NOTE: file delete from disk can be added later (fs.unlink)
  res.json({ ok: true });
}
