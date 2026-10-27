import mongoose from "mongoose";
import File from "./file.model.js";
import Project from "../projects/project.model.js";
import Job from "../content/jobs/job.model.js";
import { deleteFromS3 } from "../../utils/s3.js";
import { putPrivate, privateDownloadUrl, deletePrivate } from "../../utils/privateStorage.js";
import { canSeeAllTenantRecords, isInternalUser } from "../../utils/accessControl.js";
import { userHasPermission } from "../../middleware/auth.js";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function safeSort(sort) {
  const raw = String(sort || "-createdAt");
  const allowed = new Set([
    "createdAt",
    "-createdAt",
    "updatedAt",
    "-updatedAt",
    "size",
    "-size",
    "approved",
    "-approved",
    "title",
    "-title",
  ]);

  if (!allowed.has(raw)) return { createdAt: -1 };

  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}

/**
 * Internal users can read any file. External users only files shared with
 * clients ("client" visibility) that belong to their own company. A user with
 * no company never matches (previously an empty clientId matched everything).
 */
function canReadFile(req, item) {
  if (isStaff(req)) return true;
  const cid = String(req.user?.clientId || "");
  const itemCid = String(item?.customerId?._id || item?.customerId || "");
  return item?.visibility === "client" && Boolean(cid) && itemCid === cid;
}

async function linkFor(item) {
  if (item.isPrivate) {
    return privateDownloadUrl(item.filename, { filename: item.originalName });
  }
  return item.url || "";
}

// GET /api/files/:id/download-url  ->  { url } valid for a few minutes
export async function getFileDownloadUrl(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }
    const item = await File.findById(id).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    if (!canReadFile(req, item)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    return res.json({ ok: true, url: await linkFor(item) });
  } catch (e) {
    console.error("getFileDownloadUrl:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /api/files/download-urls?ids=a,b,c  ->  { urls: { id: url } }
// Lets list views (thumbnails, previews) resolve many links in one request.
export async function getFileDownloadUrls(req, res) {
  try {
    const ids = String(req.query.ids || "")
      .split(",")
      .map((x) => x.trim())
      .filter(validId)
      .slice(0, 100);
    if (!ids.length) return res.json({ ok: true, urls: {} });
    const items = await File.find({ _id: { $in: ids } }).lean();
    const urls = {};
    for (const item of items) {
      if (canReadFile(req, item)) urls[String(item._id)] = await linkFor(item);
    }
    return res.json({ ok: true, urls });
  } catch (e) {
    console.error("getFileDownloadUrls:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

function isStaff(req) {
  return canSeeAllTenantRecords(req);
}

function toId(v) {
  return validId(v) ? v : null;
}

// GET /api/files
export async function listFiles(req, res) {
  try {
    const {
      q = "",
      visibility = "",
      approved = "",
      customerId = "",
      projectId = "",
      jobId = "",
      productionId = "",
      category = "",
      tag = "",
      page = "1",
      limit = "12",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    const filter = {};

    if (!isStaff(req)) {
      // External users without a company see nothing (previously they saw
      // every client-visible file across all companies).
      if (!req.user?.clientId) {
        return res.json({ ok: true, items: [], total: 0, page: 1, pages: 1, limit: limitNum });
      }
      filter.visibility = "client";
      filter.customerId = req.user.clientId;
    } else if (visibility) {
      filter.visibility = visibility;
    }

    if (approved !== "") filter.approved = String(approved) === "true";

    if (isStaff(req) && validId(customerId)) filter.customerId = customerId;
    if (validId(projectId)) filter.projectId = projectId;
    if (validId(jobId)) filter.jobId = jobId;
    if (validId(productionId)) filter.productionId = productionId;

    if (category) filter.category = String(category).trim();
    if (tag) filter.tags = tag;

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { originalName: rx },
        { title: rx },
        { notes: rx },
        { filename: rx },
        { category: rx },
        { tags: rx },
      ];
    }

    const [total, items] = await Promise.all([
      File.countDocuments(filter),
      File.find(filter)
        .sort(safeSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("customerId", "companyName contactName")
        .populate("projectId", "name projectMode status")
        .populate("jobId", "title status type")
        .populate("productionId", "title status type")
        .lean(),
    ]);

    return res.json({
      ok: true,
      items,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      total,
      limit: limitNum,
    });
  } catch (e) {
    console.error("listFiles:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /api/files/:id
export async function getFile(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await File.findById(id)
      .populate("customerId", "companyName contactName primaryEmail")
      .populate("projectId", "name projectMode status")
      .populate("jobId", "title status type")
      .populate("productionId", "title status type")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    if (!canReadFile(req, item)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getFile:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/files
export async function uploadFiles(req, res) {
  try {
    const internal = isStaff(req);
    if (!internal && !req.user?.clientId) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const {
      customerId = null,
      projectId = null,
      jobId = null,
      productionId = null,
      visibility = "internal",
      approved = false,
      title = "",
      notes = "",
      category = "",
      tags = "",
    } = req.body || {};

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ ok: false, message: "No files uploaded" });
    }

    const tagsArr = Array.isArray(tags)
      ? tags.map((x) => String(x).trim()).filter(Boolean)
      : String(tags || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

    // An external user may link an upload only to their own company's project
    // or job, and never to a production (productions have no company). The
    // list and detail populate these links, so an unchecked id would reveal
    // another company's record (PUI-5).
    if (!internal) {
      const cid = req.user.clientId;
      const owns = async (Model, id) => !id || Boolean(await Model.findOne({ _id: id, customerId: cid }).select("_id").lean());
      if (toId(productionId) || !(await owns(Project, toId(projectId))) || !(await owns(Job, toId(jobId)))) {
        return res.status(400).json({ ok: false, message: "That project or job isn't one of your company's." });
      }
    }

    const uploaded = await Promise.all(
      files.map((f) => putPrivate(f.buffer, "files", f.originalname, f.mimetype))
    );

    const resolvedCustomerId = internal ? toId(customerId) : toId(req.user.clientId);
    const resolvedVisibility = internal && ["internal", "client"].includes(visibility)
      ? visibility
      : "client";

    const docs = await File.insertMany(
      files.map((f, i) => ({
        customerId: resolvedCustomerId,
        projectId: toId(projectId),
        jobId: toId(jobId),
        productionId: toId(productionId),
        visibility: resolvedVisibility,
        approved: internal && (String(approved) === "true" || approved === true),
        originalName: f.originalname,
        filename: uploaded[i].key,
        url: "",
        isPrivate: true,
        mimeType: f.mimetype,
        size: f.size,
        title: String(title || "").trim() || f.originalname,
        notes: String(notes || "").trim(),
        category: String(category || "").trim(),
        tags: tagsArr,
        createdBy: req.user?.id || null,
        updatedBy: req.user?.id || null,
      })),
      { ordered: true }
    );

    return res.status(201).json({ ok: true, items: docs });
  } catch (e) {
    console.error("uploadFiles:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// PATCH /api/files/:id
export async function updateFile(req, res) {
  try {
    if (!isStaff(req)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const body = req.body || {};
    const patch = { updatedBy: req.user?.id || null };

    if (typeof body.title !== "undefined") {
      patch.title = String(body.title || "").trim();
    }

    if (typeof body.notes !== "undefined") {
      patch.notes = String(body.notes || "").trim();
    }

    if (typeof body.category !== "undefined") {
      patch.category = String(body.category || "").trim();
    }

    if (typeof body.visibility !== "undefined") {
      patch.visibility = ["internal", "client"].includes(body.visibility)
        ? body.visibility
        : "internal";
    }

    if (typeof body.approved !== "undefined") {
      patch.approved = Boolean(body.approved);
    }

    if (typeof body.tags !== "undefined") {
      patch.tags = Array.isArray(body.tags)
        ? body.tags.map((x) => String(x).trim()).filter(Boolean)
        : String(body.tags || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
    }

    if (typeof body.customerId !== "undefined") {
      patch.customerId = toId(body.customerId);
    }

    if (typeof body.projectId !== "undefined") {
      patch.projectId = toId(body.projectId);
    }

    if (typeof body.jobId !== "undefined") {
      patch.jobId = toId(body.jobId);
    }

    if (typeof body.productionId !== "undefined") {
      patch.productionId = toId(body.productionId);
    }

    const item = await File.findByIdAndUpdate(id, patch, { new: true })
      .populate("customerId", "companyName contactName")
      .populate("projectId", "name projectMode status")
      .populate("jobId", "title status type")
      .populate("productionId", "title status type")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateFile:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// DELETE /api/files/:id
export async function deleteFile(req, res) {
  try {
    // Internal users with files.delete only (R4-A). Deletion has no company
    // scoping, so external roles stay refused even if granted files.delete.
    if (!isInternalUser(req) || !userHasPermission(req.user, "files.delete")) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await File.findByIdAndDelete(id).lean();
    if (!item) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    // Remove the stored object too (previously left behind).
    try {
      if (item.isPrivate) await deletePrivate(item.filename);
      else if (item.filename) await deleteFromS3(item.filename);
    } catch (err) {
      console.warn("deleteFile: storage cleanup failed:", err?.message);
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteFile:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
