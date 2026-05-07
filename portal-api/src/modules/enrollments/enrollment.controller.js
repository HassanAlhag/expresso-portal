import mongoose from "mongoose";
import Enrollment from "./enrollment.model.js";
import ServiceTemplate from "../services/serviceTemplate.model.js";
import Customer from "../customers/customer.model.js";

function safeId(id) {
  return id && mongoose.Types.ObjectId.isValid(id) ? id : null;
}

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeSort(sort) {
  const raw = String(sort || "-createdAt");
  const allowed = new Set([
    "createdAt",
    "-createdAt",
    "updatedAt",
    "-updatedAt",
    "status",
    "-status",
    "startDate",
    "-startDate",
    "endDate",
    "-endDate",
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

function buildFinalScope(template, overrides = {}) {
  const mode = String(template?.executionMode || "recurring").trim();

  const groups =
    Array.isArray(overrides?.customGroups) && overrides.customGroups.length
      ? overrides.customGroups
          .map(normalizeScopeGroup)
          .filter((group) => group.title)
      : Array.isArray(template?.scopeGroups)
      ? template.scopeGroups
          .map(normalizeScopeGroup)
          .filter((group) => group.title)
      : [];

  return {
    mode,
    groups,
  };
}

async function populateEnrollment(id) {
  return Enrollment.findById(id)
    .populate("customerId", "companyName contactName primaryEmail slug")
    .populate(
      "serviceTemplateId",
      "name slug status executionMode billingCycle price scopeGroups"
    )
    .populate("accountOwnerId", "fullName email")
    .populate("executionLeadId", "fullName email")
    .lean();
}

export async function listEnrollmentsGlobal(req, res) {
  try {
    const {
      q = "",
      status = "",
      customerId = "",
      serviceTemplateId = "",
      page = "1",
      limit = "12",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    const filter = {};
    if (status) filter.status = String(status).trim();

    const cid = safeId(customerId);
    if (customerId && !cid) {
      return res.status(400).json({ ok: false, message: "Invalid customerId" });
    }
    if (cid) filter.customerId = cid;

    const sid = safeId(serviceTemplateId);
    if (serviceTemplateId && !sid) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid serviceTemplateId" });
    }
    if (sid) filter.serviceTemplateId = sid;

    let items = await Enrollment.find(filter)
      .populate("customerId", "companyName contactName primaryEmail slug")
      .populate(
        "serviceTemplateId",
        "name slug status executionMode billingCycle price scopeGroups"
      )
      .populate("accountOwnerId", "fullName email")
      .populate("executionLeadId", "fullName email")
      .sort(safeSort(sort))
      .lean();

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      items = items.filter((item) => {
        return (
          rx.test(item?.customerId?.companyName || "") ||
          rx.test(item?.customerId?.contactName || "") ||
          rx.test(item?.serviceTemplateId?.name || "") ||
          rx.test(item?.status || "") ||
          rx.test(item?.notes || "")
        );
      });
    }

    const total = items.length;
    const start = (pageNum - 1) * limitNum;
    const paged = items.slice(start, start + limitNum);

    return res.json({
      ok: true,
      items: paged,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      total,
      limit: limitNum,
    });
  } catch (e) {
    console.error("listEnrollmentsGlobal:", e);
    return res.status(500).json({
      ok: false,
      message: e.message || "Server error",
    });
  }
}

export async function getEnrollmentGlobal(req, res) {
  try {
    const { id } = req.params;
    const eid = safeId(id);

    if (!eid) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await populateEnrollment(eid);

    if (!item) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getEnrollmentGlobal:", e);
    return res.status(500).json({
      ok: false,
      message: e.message || "Server error",
    });
  }
}

export async function createEnrollmentGlobal(req, res) {
  try {
    const {
      customerId,
      serviceTemplateId,
      status = "active",
      pricing = {},
      overrides = {},
      notes = "",
      startDate = null,
      endDate = null,
      accountOwnerId = null,
      executionLeadId = null,
    } = req.body || {};

    const cid = safeId(customerId);
    if (!cid) {
      return res
        .status(400)
        .json({ ok: false, message: "customerId is required" });
    }

    const customer = await Customer.findById(cid).lean();
    if (!customer) {
      return res.status(404).json({ ok: false, message: "Customer not found" });
    }

    const sid = safeId(serviceTemplateId);
    if (!sid) {
      return res
        .status(400)
        .json({ ok: false, message: "serviceTemplateId is required" });
    }

    const existing = await Enrollment.findOne({
      customerId: cid,
      serviceTemplateId: sid,
    }).lean();

    if (existing) {
      return res.status(409).json({
        ok: false,
        message:
          "This customer is already enrolled in this service. Edit the existing enrollment instead of creating a duplicate.",
      });
    }

    const template = await ServiceTemplate.findById(sid).lean();
    if (!template) {
      return res
        .status(404)
        .json({ ok: false, message: "Service template not found" });
    }

    const normalizedOverrides = {
      notes: String(overrides?.notes || "").trim(),
      customGroups: Array.isArray(overrides?.customGroups)
        ? overrides.customGroups
            .map(normalizeScopeGroup)
            .filter((group) => group.title)
        : [],
    };

    const finalScope = buildFinalScope(template, normalizedOverrides);

    const doc = await Enrollment.create({
      customerId: cid,
      serviceTemplateId: sid,
      status: String(status || "active").trim(),

      pricing: {
        price:
          typeof pricing?.price === "number"
            ? pricing.price
            : pricing?.price
            ? Number(pricing.price)
            : template?.price ?? null,
        billingCycle: String(
          pricing?.billingCycle || template?.billingCycle || ""
        ).trim(),
      },

      overrides: normalizedOverrides,
      finalScope,

      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,

      accountOwnerId: safeId(accountOwnerId) || null,
      executionLeadId: safeId(executionLeadId) || null,

      notes: String(notes || "").trim(),
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    const item = await populateEnrollment(doc._id);

    return res.status(201).json({
      ok: true,
      item,
    });
  } catch (e) {
    console.error("createEnrollmentGlobal ERROR:", e);
    console.error("BODY:", req.body);
    return res.status(500).json({
      ok: false,
      message: e.message || "Server error",
    });
  }
}

export async function updateEnrollmentGlobal(req, res) {
  try {
    const { id } = req.params;
    const eid = safeId(id);

    if (!eid) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const current = await Enrollment.findById(eid).lean();
    if (!current) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    const patch = {
      updatedBy: req.user?.id || null,
    };

    if (typeof req.body?.status !== "undefined") {
      patch.status = String(req.body.status || "").trim();
    }

    if (typeof req.body?.notes !== "undefined") {
      patch.notes = String(req.body.notes || "").trim();
    }

    if (typeof req.body?.startDate !== "undefined") {
      patch.startDate = req.body.startDate
        ? new Date(req.body.startDate)
        : null;
    }

    if (typeof req.body?.endDate !== "undefined") {
      patch.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
    }

    if (typeof req.body?.accountOwnerId !== "undefined") {
      patch.accountOwnerId = safeId(req.body.accountOwnerId) || null;
    }

    if (typeof req.body?.executionLeadId !== "undefined") {
      patch.executionLeadId = safeId(req.body.executionLeadId) || null;
    }

    if (typeof req.body?.pricing !== "undefined") {
      patch.pricing = {
        price:
          req.body.pricing?.price === "" || req.body.pricing?.price === null
            ? null
            : typeof req.body.pricing?.price === "number"
            ? req.body.pricing.price
            : req.body.pricing?.price
            ? Number(req.body.pricing.price)
            : null,
        billingCycle: String(req.body.pricing?.billingCycle || "").trim(),
      };
    }

    let normalizedOverrides = current.overrides || {};

    if (typeof req.body?.overrides !== "undefined") {
      const o = req.body.overrides || {};
      normalizedOverrides = {
        notes: String(o.notes || "").trim(),
        customGroups: Array.isArray(o.customGroups)
          ? o.customGroups
              .map(normalizeScopeGroup)
              .filter((group) => group.title)
          : [],
      };

      patch.overrides = normalizedOverrides;
    }

    const template = await ServiceTemplate.findById(
      current.serviceTemplateId
    ).lean();

    if (template) {
      patch.finalScope = buildFinalScope(template, normalizedOverrides);
    }

    const item = await Enrollment.findByIdAndUpdate(eid, patch, { new: true })
      .populate("customerId", "companyName contactName primaryEmail slug")
      .populate(
        "serviceTemplateId",
        "name slug status executionMode billingCycle price scopeGroups"
      )
      .populate("accountOwnerId", "fullName email")
      .populate("executionLeadId", "fullName email")
      .lean();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateEnrollmentGlobal:", e);
    return res.status(500).json({
      ok: false,
      message: e.message || "Server error",
    });
  }
}

export async function deleteEnrollmentGlobal(req, res) {
  try {
    const { id } = req.params;
    const eid = safeId(id);

    if (!eid) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    await Enrollment.findByIdAndDelete(eid);
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteEnrollmentGlobal:", e);
    return res.status(500).json({
      ok: false,
      message: e.message || "Server error",
    });
  }
}
