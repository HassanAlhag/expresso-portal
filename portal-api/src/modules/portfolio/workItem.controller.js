import mongoose from "mongoose";
import WorkItem from "./workItem.model.js";
import Portfolio from "./portfolio.model.js";
import { WORK_STATUSES, WORK_TYPE_KEYS } from "./workItem.constants.js";
import { safeAssetSrc, slugify, workItemFromCaseStudy } from "./workItem.fromCaseStudy.js";
import { userHasPermission } from "../../middleware/auth.js";

// Public Portfolio work items (/api/work). Anonymous visitors and signed-in
// users without work.read only ever see published items; drafts and archived
// items are visible to portfolio managers (work.read) only.

const canManage = (req) => userHasPermission(req.user, "work.read");
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || "")) && /^[a-f\d]{24}$/i.test(String(v));

const CASE_STUDY_FIELDS = "slug title clientName status";
const SORTS = Object.freeze({
  sortOrder: { featured: -1, sortOrder: 1, createdAt: -1 },
  "-createdAt": { createdAt: -1 },
  createdAt: { createdAt: 1 },
  title: { title: 1 },
  "-publishedAt": { publishedAt: -1 },
});

function safeRx(s) {
  const v = String(s || "").trim();
  if (!v) return null;
  return new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

class InputError extends Error {}

function bad(message) {
  return new InputError(message);
}

function text(v, max) {
  const s = String(v ?? "").trim();
  return max ? s.slice(0, max) : s;
}

function list(v) {
  const arr = Array.isArray(v) ? v : String(v || "").split(",");
  return [...new Set(arr.map((x) => String(x ?? "").trim()).filter(Boolean))].slice(0, 30);
}

function mediaId(v) {
  const id = v && typeof v === "object" ? v._id : v;
  return isId(id) ? String(id) : null;
}

function image(v) {
  const src = safeAssetSrc(v?.src);
  return { src, alt: text(v?.alt, 200), media: src ? mediaId(v?.media) : null };
}

function gallery(v) {
  if (!Array.isArray(v)) throw bad("Gallery must be a list of images");
  return v.map(image).filter((g) => g.src).slice(0, 60);
}

function video(v) {
  const src = safeAssetSrc(v?.src);
  return { src, poster: safeAssetSrc(v?.poster), media: src ? mediaId(v?.media) : null };
}

const MAX_VIDEOS = 12;

function videos(v) {
  if (!Array.isArray(v)) throw bad("Videos must be a list");
  const out = v.map((x) => ({ ...video(x), title: text(x?.title, 120) })).filter((x) => x.src);
  if (out.length > MAX_VIDEOS) throw bad(`Up to ${MAX_VIDEOS} videos per item`);
  return out;
}

function year(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1990 || n > 2100) throw bad("Year must be between 1990 and 2100");
  return n;
}

function workType(v) {
  const t = String(v || "").trim();
  if (!WORK_TYPE_KEYS.includes(t)) throw bad("Invalid work type");
  return t;
}

function status(v) {
  const s = String(v || "").trim();
  if (!WORK_STATUSES.includes(s)) throw bad("Invalid status");
  return s;
}

async function caseStudyRef(v) {
  if (v === null || v === undefined || v === "") return null;
  const id = mediaId(v);
  if (!id) throw bad("Linked case study not found");
  const exists = await Portfolio.exists({ _id: id });
  if (!exists) throw bad("Linked case study not found");
  return id;
}

/** Build a patch from the request body; only fields that were sent are touched. */
async function readBody(body = {}, { creating = false } = {}) {
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
  const patch = {};
  if (creating || has("title")) {
    patch.title = text(body.title, 140);
    if (!patch.title) throw bad("Title is required");
  }
  if (has("slug")) {
    patch.slug = slugify(body.slug);
    if (!patch.slug) throw bad("Slug cannot be empty");
  }
  if (has("clientName")) patch.clientName = text(body.clientName, 140);
  if (creating || has("workType")) patch.workType = workType(body.workType);
  if (has("industry")) patch.industry = text(body.industry, 80);
  if (has("year")) patch.year = year(body.year);
  if (has("shortDescription")) patch.shortDescription = text(body.shortDescription, 320);
  if (has("cover")) patch.cover = image(body.cover);
  if (has("gallery")) patch.gallery = gallery(body.gallery);
  if (has("video")) patch.video = video(body.video);
  if (has("videos")) patch.videos = videos(body.videos);
  if (has("services")) patch.services = list(body.services);
  if (has("technologies")) patch.technologies = list(body.technologies);
  if (has("featured")) patch.featured = body.featured === true || body.featured === "true";
  if (has("sortOrder")) {
    const n = Number(body.sortOrder);
    if (!Number.isFinite(n)) throw bad("Display order must be a number");
    patch.sortOrder = Math.round(n);
  }
  if (has("status")) patch.status = status(body.status);
  if (has("caseStudy")) patch.caseStudy = await caseStudyRef(body.caseStudy);
  if (has("seo")) {
    patch.seo = { metaTitle: text(body.seo?.metaTitle, 120), metaDesc: text(body.seo?.metaDesc, 320) };
  }
  return patch;
}

/** Public projection: a linked case study is only exposed while it is published. */
function present(item, manager) {
  if (!item) return item;
  const cs = item.caseStudy && typeof item.caseStudy === "object" ? item.caseStudy : null;
  if (manager) return item;
  const out = { ...item };
  out.caseStudy = cs && cs.status === "published" ? { _id: cs._id, slug: cs.slug, title: cs.title } : null;
  return out;
}

function respondError(res, err, where) {
  if (err instanceof InputError) return res.status(400).json({ ok: false, message: err.message });
  if (err?.code === 11000) return res.status(409).json({ ok: false, message: "Slug already exists" });
  if (err?.name === "ValidationError") return res.status(400).json({ ok: false, message: "Invalid portfolio item" });
  console.error(`${where}:`, err?.message || err);
  return res.status(500).json({ ok: false, message: "Server error" });
}

export async function listWorkItems(req, res) {
  try {
    const manager = canManage(req);
    const { q = "", status: st = "", workType: wt = "", featured = "", page = "1", limit = "24", sort = "sortOrder" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));

    const filter = {};
    if (!manager) filter.status = "published";
    else if (st && WORK_STATUSES.includes(String(st))) filter.status = String(st);
    if (wt && WORK_TYPE_KEYS.includes(String(wt))) filter.workType = String(wt);
    if (featured === "true") filter.featured = true;
    const rx = safeRx(q);
    if (rx) filter.$or = [{ title: rx }, { clientName: rx }, { industry: rx }, { services: rx }, { technologies: rx }];

    const [total, items] = await Promise.all([
      WorkItem.countDocuments(filter),
      WorkItem.find(filter)
        .populate("caseStudy", CASE_STUDY_FIELDS)
        .sort(SORTS[sort] || SORTS.sortOrder)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);
    return res.json({
      ok: true,
      items: items.map((i) => present(i, manager)),
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      total,
    });
  } catch (err) {
    return respondError(res, err, "listWorkItems");
  }
}

export async function getWorkItem(req, res) {
  try {
    const manager = canManage(req);
    const key = String(req.params.slug || "");
    const query = manager && isId(key) ? WorkItem.findById(key) : WorkItem.findOne({ slug: key.toLowerCase() });
    const item = await query.populate("caseStudy", CASE_STUDY_FIELDS).lean();
    // 404 (not 403) so an unpublished slug is not confirmed to exist.
    if (!item || (!manager && item.status !== "published")) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }
    return res.json({ ok: true, item: present(item, manager) });
  } catch (err) {
    return respondError(res, err, "getWorkItem");
  }
}

export async function createWorkItem(req, res) {
  try {
    const body = req.body || {};
    const patch = await readBody({ ...body, slug: body.slug || body.title }, { creating: true });
    if (await WorkItem.exists({ slug: patch.slug })) {
      return res.status(409).json({ ok: false, message: "Slug already exists" });
    }
    const st = patch.status || "draft";
    const item = await WorkItem.create({
      ...patch,
      status: st,
      publishedAt: st === "published" ? new Date() : null,
    });
    return res.status(201).json({ ok: true, item });
  } catch (err) {
    return respondError(res, err, "createWorkItem");
  }
}

export async function updateWorkItem(req, res) {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const current = await WorkItem.findById(id).lean();
    if (!current) return res.status(404).json({ ok: false, message: "Not found" });

    const patch = await readBody(req.body || {});
    if (patch.slug && patch.slug !== current.slug) {
      if (await WorkItem.exists({ slug: patch.slug, _id: { $ne: id } })) {
        return res.status(409).json({ ok: false, message: "Slug already in use" });
      }
    }
    if (patch.status && patch.status !== current.status) {
      patch.publishedAt = patch.status === "published" ? new Date() : null;
    }
    const item = await WorkItem.findByIdAndUpdate(id, patch, { new: true, runValidators: true })
      .populate("caseStudy", CASE_STUDY_FIELDS)
      .lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (err) {
    return respondError(res, err, "updateWorkItem");
  }
}

export async function reorderWorkItems(req, res) {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length > 500 || !ids.every(isId)) {
      return res.status(400).json({ ok: false, message: "ids array required" });
    }
    await Promise.all(ids.map((id, idx) => WorkItem.findByIdAndUpdate(id, { sortOrder: idx }).lean()));
    return res.json({ ok: true });
  } catch (err) {
    return respondError(res, err, "reorderWorkItems");
  }
}

// Permanent delete is for drafts and archived items only: a published item
// must be archived (taken off the website) first.
export async function deleteWorkItem(req, res) {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const current = await WorkItem.findById(id).lean();
    if (!current) return res.status(404).json({ ok: false, message: "Not found" });
    if (current.status === "published") {
      return res.status(409).json({ ok: false, message: "Archive this item before deleting it." });
    }
    // Keep the publication guard in the write itself: another editor may
    // publish after the read above and before this deletion reaches MongoDB.
    const result = await WorkItem.deleteOne({ _id: id, status: { $in: ["draft", "archived"] } });
    if (!result.deletedCount) {
      return res.status(409).json({ ok: false, message: "Item changed. Reload and archive it before deleting." });
    }
    return res.json({ ok: true });
  } catch (err) {
    return respondError(res, err, "deleteWorkItem");
  }
}

// Create a NEW draft work item from an existing case study. The case study is
// only read; it is never modified.
export async function createWorkItemFromCaseStudy(req, res) {
  try {
    const { caseStudyId } = req.params;
    if (!isId(caseStudyId)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const cs = await Portfolio.findById(caseStudyId).populate("coverMedia", "url").lean();
    const canSeeDrafts = userHasPermission(req.user, "portfolio.read");
    if (!cs || (cs.status !== "published" && !canSeeDrafts)) {
      return res.status(404).json({ ok: false, message: "Case study not found" });
    }
    const draft = workItemFromCaseStudy(cs);
    if (!draft.slug) return res.status(400).json({ ok: false, message: "Case study has no usable slug" });
    const existing = await WorkItem.findOne({ slug: draft.slug }).select("_id").lean();
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: "A portfolio item already uses this case study's slug.",
        existingId: String(existing._id),
      });
    }
    const item = await WorkItem.create(draft);
    return res.status(201).json({ ok: true, item });
  } catch (err) {
    return respondError(res, err, "createWorkItemFromCaseStudy");
  }
}
