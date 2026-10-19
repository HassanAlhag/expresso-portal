import crypto from "crypto";
import mongoose from "mongoose";
import ServiceTemplate from "./serviceTemplate.model.js";
import { putPrivate, privateDownloadUrl } from "../../utils/privateStorage.js";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function safeSort(sort) {
  const raw = String(sort || "-createdAt");
  const allowed = new Set([
    "createdAt",
    "-createdAt",
    "updatedAt",
    "-updatedAt",
    "name",
    "-name",
    "status",
    "-status",
  ]);

  if (!allowed.has(raw)) return { createdAt: -1 };

  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}

function normalizeChecklist(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: String(item?.id || "").trim(),
      text: String(item?.text || "").trim(),
      required: item?.required !== false,
    }))
    .filter((item) => item.text);
}

function normalizeScopeGroupJob(item = {}) {
  const startDays = Number(item?.startDays || 0);
  const dueDays = Number(item?.dueDays || 0);
  return {
    id: String(item?.id || "").trim(),
    title: String(item?.title || "").trim(),
    description: String(item?.description || "").trim(),
    type: String(item?.type || "task").trim(),
    quantity: Number(item?.quantity || 1),
    unit: String(item?.unit || "").trim(),
    priority: String(item?.priority || "").trim(),
    startDays,
    dueDays,
    durationDays: Number(item?.durationDays || Math.max(0, dueDays - startDays) || 0),
    timeEstimate: String(item?.timeEstimate || "").trim(),
    effort: String(item?.effort || "").trim(),
    assigneeName: String(item?.assigneeName || "").trim(),
    processOwner: String(item?.processOwner || "").trim(),
    dependencies: Array.isArray(item?.dependencies)
      ? item.dependencies.map((x) => String(x || "").trim()).filter(Boolean)
      : String(item?.dependencies || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
    seoBoardStatus: String(item?.seoBoardStatus || "").trim(),
    seoTaskType: String(item?.seoTaskType || "").trim(),
    seoTarget: String(item?.seoTarget || "").trim(),
    funnelStage: String(item?.funnelStage || "").trim(),
    contentPhase: String(item?.contentPhase || "").trim(),
    seoQuarter: String(item?.seoQuarter || "").trim(),
    executionPageUrl: String(item?.executionPageUrl || "").trim(),
    analyticsUrl: String(item?.analyticsUrl || "").trim(),
    parentGoalId: String(item?.parentGoalId || "").trim(),
    parentGoalName: String(item?.parentGoalName || "").trim(),
    parentGoalUrl: String(item?.parentGoalUrl || "").trim(),
    required: item?.required !== false,
    checklist: normalizeChecklist(item?.checklist || []),
  };
}

function normalizeScopeGroup(item = {}, index = 0) {
  return {
    id: String(item?.id || "").trim(),
    title: String(item?.title || "").trim(),
    description: String(item?.description || "").trim(),
    type: String(item?.type || "deliverable_group").trim(),
    order: Number(item?.order ?? index + 1),
    dueDays: Number(item?.dueDays || 0),
    jobs: Array.isArray(item?.jobs)
      ? item.jobs.map(normalizeScopeGroupJob).filter((job) => job.title)
      : [],
  };
}

function normalizeApprovalSteps(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: String(item?.id || "").trim(),
      title: String(item?.title || item?.name || "").trim(),
      required: item?.required !== false,
      role: String(item?.role || "client").trim(),
      instructions: String(item?.instructions || "").trim(),
    }))
    .filter((item) => item.title);
}

function normalizeFiles(files = {}) {
  return {
    uploads: Array.isArray(files?.uploads) ? files.uploads : [],
    mediaRefs: Array.isArray(files?.mediaRefs) ? files.mediaRefs : [],
  };
}

function normalizePayload(body = {}) {
  return {
    name: String(body.name || "").trim(),
    slug: body.slug ? slugify(body.slug) : "",
    status: String(body.status || "draft").trim(),
    summary: String(body.summary || "").trim(),
    description: String(body.description || "").trim(),
    billingCycle: String(body.billingCycle || "monthly").trim(),
    price:
      body.price === "" ||
      body.price === null ||
      typeof body.price === "undefined"
        ? null
        : Number(body.price),
    executionMode: String(body.executionMode || "recurring").trim(),

    scopeGroups: Array.isArray(body.scopeGroups)
      ? body.scopeGroups.map(normalizeScopeGroup).filter((group) => group.title)
      : [],

    sla: {
      responseTime: Number(body?.sla?.responseTime || 24),
      responseUnit: String(body?.sla?.responseUnit || "hours").trim(),
      revisionRounds: Number(body?.sla?.revisionRounds || 2),
      deliveryDays: Number(body?.sla?.deliveryDays || 7),
      workingDaysOnly: body?.sla?.workingDaysOnly !== false,
      supportWindow: String(
        body?.sla?.supportWindow || "Mon–Fri, 9am–6pm"
      ).trim(),
      notes: String(body?.sla?.notes || "").trim(),
    },

    approvals: {
      required: body?.approvals?.required !== false,
      steps: normalizeApprovalSteps(body?.approvals?.steps || []),
      checklist: normalizeChecklist(body?.approvals?.checklist || []),
    },

    coverImageId: (() => {
      const raw = body.coverImageId?._id || body.coverImageId;
      return mongoose.Types.ObjectId.isValid(String(raw || "")) ? raw : null;
    })(),

    files: normalizeFiles(body.files || {}),
  };
}

export async function listServiceTemplates(req, res) {
  try {
    const {
      q = "",
      status = "",
      page = "1",
      limit = "12",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    const filter = {};
    if (status) filter.status = status;

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [{ name: rx }, { slug: rx }, { summary: rx }];
    }

    const [total, items] = await Promise.all([
      ServiceTemplate.countDocuments(filter),
      ServiceTemplate.find(filter)
        .sort(safeSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("coverImageId", "url thumbnailUrl title type")
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
    console.error("listServiceTemplates:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getServiceTemplate(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await ServiceTemplate.findById(id)
      .populate("coverImageId", "url thumbnailUrl title type")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getServiceTemplate:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createServiceTemplate(req, res) {
  try {
    const normalized = normalizePayload(req.body || {});

    if (!normalized.name) {
      return res.status(400).json({ ok: false, message: "name is required" });
    }

    const finalSlug = normalized.slug || slugify(normalized.name);

    if (!finalSlug) {
      return res.status(400).json({ ok: false, message: "Invalid slug" });
    }

    const exists = await ServiceTemplate.findOne({ slug: finalSlug }).lean();
    if (exists) {
      return res
        .status(409)
        .json({ ok: false, message: "slug already exists" });
    }

    const doc = await ServiceTemplate.create({
      ...normalized,
      slug: finalSlug,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    return res.status(201).json({ ok: true, item: doc });
  } catch (e) {
    console.error("createServiceTemplate:", e);
    return res
      .status(500)
      .json({ ok: false, message: e.message || "Server error" });
  }
}

export async function updateServiceTemplate(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const current = await ServiceTemplate.findById(id).lean();
    if (!current) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    const normalized = normalizePayload(req.body || {});
    const patch = {
      ...normalized,
      updatedBy: req.user?.id || null,
    };

    if (normalized.slug) {
      const dupe = await ServiceTemplate.findOne({
        slug: normalized.slug,
        _id: { $ne: id },
      }).lean();

      if (dupe) {
        return res
          .status(409)
          .json({ ok: false, message: "slug already exists" });
      }
    } else {
      patch.slug = current.slug;
    }

    const item = await ServiceTemplate.findByIdAndUpdate(id, patch, {
      new: true,
    })
      .populate("coverImageId", "url thumbnailUrl title type")
      .lean();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateServiceTemplate:", e);
    return res
      .status(500)
      .json({ ok: false, message: e.message || "Server error" });
  }
}

export async function deleteServiceTemplate(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    await ServiceTemplate.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteServiceTemplate:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/service/:id/files  (multipart "files") — attach documents to a template
export async function uploadServiceTemplateFiles(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ ok: false, message: "No files uploaded" });
    }
    const exists = await ServiceTemplate.exists({ _id: id });
    if (!exists) return res.status(404).json({ ok: false, message: "Service template not found" });

    const stored = await Promise.all(
      files.map((f) => putPrivate(f.buffer, "service-templates", f.originalname, f.mimetype))
    );
    const entries = files.map((f, i) => ({
      id: crypto.randomUUID(),
      name: f.originalname,
      key: stored[i].key,
      size: f.size,
      mimeType: f.mimetype,
      uploadedAt: new Date(),
      uploadedBy: req.user?.id || null,
    }));

    const item = await ServiceTemplate.findByIdAndUpdate(
      id,
      { $push: { "files.uploads": { $each: entries } }, updatedBy: req.user?.id || null },
      { new: true }
    ).lean();

    return res.status(201).json({ ok: true, item, files: item?.files });
  } catch (e) {
    console.error("uploadServiceTemplateFiles:", e);
    return res.status(500).json({ ok: false, message: "Upload failed" });
  }
}

// GET /api/service/:id/files/:fileId/url — short-lived link to an attachment
export async function getServiceTemplateFileUrl(req, res) {
  try {
    const { id, fileId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }
    const doc = await ServiceTemplate.findById(id).select("files").lean();
    const entry = (doc?.files?.uploads || []).find(
      (u) => u && typeof u === "object" && String(u.id) === String(fileId)
    );
    if (!entry) return res.status(404).json({ ok: false, message: "File not found" });
    // Keys are only ever issued under this prefix; anything else is refused so a
    // edited document cannot point at another module's private files.
    if (entry.key && String(entry.key).startsWith("private/service-templates/")) {
      const url = await privateDownloadUrl(entry.key, { filename: entry.name });
      return res.json({ ok: true, url });
    }
    if (entry.url) return res.json({ ok: true, url: entry.url });
    return res.status(404).json({ ok: false, message: "File not found" });
  } catch (e) {
    console.error("getServiceTemplateFileUrl:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
