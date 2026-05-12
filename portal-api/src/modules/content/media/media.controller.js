import mongoose from "mongoose";
import sharp from "sharp";
import Media from "./media.model.js";
import {
  uploadToS3,
  uploadBufferToS3,
  deleteFromS3,
} from "../../../utils/s3.js";

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

function parseTags(tags) {
  return Array.isArray(tags)
    ? tags
    : String(tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
}

async function uploadOptimizedImageVersions(file) {
  const originalName = file.originalname || "image";

  const thumbnailBuffer = await sharp(file.buffer)
    .rotate()
    .resize({
      width: 480,
      withoutEnlargement: true,
    })
    .webp({ quality: 75 })
    .toBuffer();

  const mediumBuffer = await sharp(file.buffer)
    .rotate()
    .resize({
      width: 900,
      withoutEnlargement: true,
    })
    .webp({ quality: 78 })
    .toBuffer();

  const largeBuffer = await sharp(file.buffer)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const [thumbnail, medium, large] = await Promise.all([
    uploadBufferToS3({
      buffer: thumbnailBuffer,
      folder: "media",
      originalName,
      contentType: "image/webp",
      suffix: "-thumb",
      ext: ".webp",
    }),
    uploadBufferToS3({
      buffer: mediumBuffer,
      folder: "media",
      originalName,
      contentType: "image/webp",
      suffix: "-medium",
      ext: ".webp",
    }),
    uploadBufferToS3({
      buffer: largeBuffer,
      folder: "media",
      originalName,
      contentType: "image/webp",
      suffix: "-large",
      ext: ".webp",
    }),
  ]);

  return {
    url: large.url,
    s3Key: large.key,
    thumbnailUrl: thumbnail.url,
    thumbnailS3Key: thumbnail.key,
    mediumUrl: medium.url,
    mediumS3Key: medium.key,
  };
}

export async function listMedia(req, res) {
  const {
    q = "",
    category = "",
    tag = "",
    status = "",
    type = "",
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
  if (type) filter.type = type;

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
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ ok: false, message: "File is required" });
    }

    const { title = "", tags = "", category = "", status = "draft" } = req.body;

    const type = guessType(file.mimetype);

    let uploaded;

    if (type === "image") {
      uploaded = await uploadOptimizedImageVersions(file);
    } else {
      const result = await uploadToS3(
        file.buffer,
        "media",
        file.originalname,
        file.mimetype
      );

      uploaded = {
        url: result.url,
        s3Key: result.key,
        thumbnailUrl: "",
        thumbnailS3Key: "",
        mediumUrl: "",
        mediumS3Key: "",
      };
    }

    const item = await Media.create({
      type,
      ...uploaded,
      filename: file.originalname,
      title: String(title || "").trim() || file.originalname,
      category: String(category || "").trim(),
      tags: parseTags(tags),
      status: ["draft", "published", "archived"].includes(status)
        ? status
        : "draft",
    });

    res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("Media upload failed:", e);
    res.status(e.statusCode || 500).json({
      ok: false,
      message: e.message || "Failed to upload media",
    });
  }
}

export async function updateMedia(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ ok: false, message: "Invalid id" });
  }

  const body = req.body || {};
  const patch = {};

  if (typeof body.title !== "undefined") patch.title = body.title;
  if (typeof body.category !== "undefined") patch.category = body.category;

  if (typeof body.status !== "undefined") {
    if (!["draft", "published", "archived"].includes(body.status)) {
      return res.status(400).json({ ok: false, message: "Invalid status" });
    }

    patch.status = body.status;
  }

  if (typeof body.tags !== "undefined") {
    patch.tags = parseTags(body.tags);
  }

  const item = await Media.findByIdAndUpdate(id, patch, { new: true }).lean();

  if (!item) {
    return res.status(404).json({ ok: false, message: "Not found" });
  }

  res.json({ ok: true, item });
}

export async function deleteMedia(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ ok: false, message: "Invalid id" });
  }

  const item = await Media.findByIdAndDelete(id).lean();

  if (!item) {
    return res.status(404).json({ ok: false, message: "Not found" });
  }

  await Promise.allSettled([
    deleteFromS3(item.s3Key),
    deleteFromS3(item.thumbnailS3Key),
    deleteFromS3(item.mediumS3Key),
  ]);

  res.json({ ok: true });
}
