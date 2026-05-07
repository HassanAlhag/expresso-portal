import mongoose from "mongoose";
import ServiceTemplate from "./serviceTemplate.model.js";

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
  return {
    id: String(item?.id || "").trim(),
    title: String(item?.title || "").trim(),
    description: String(item?.description || "").trim(),
    type: String(item?.type || "task").trim(),
    quantity: Number(item?.quantity || 1),
    unit: String(item?.unit || "").trim(),
    dueDays: Number(item?.dueDays || 0),
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
      checklist: Array.isArray(body?.approvals?.checklist)
        ? body.approvals.checklist
            .map((x) => String(x || "").trim())
            .filter(Boolean)
        : [],
    },

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

    const item = await ServiceTemplate.findById(id).lean();

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
    }).lean();

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
