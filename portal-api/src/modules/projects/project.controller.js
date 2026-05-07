import mongoose from "mongoose";
import Project from "./project.model.js";
import Enrollment from "../enrollments/enrollment.model.js";

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
    "name",
    "-name",
    "status",
    "-status",
    "type",
    "-type",
    "priority",
    "-priority",
    "team",
    "-team",
    "projectMode",
    "-projectMode",
  ]);

  if (!allowed.has(raw)) return { createdAt: -1 };

  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}

const ALLOWED_MODES = new Set([
  "pre_contract",
  "contracted",
  "custom",
  "internal",
]);

const ALLOWED_SOURCES = new Set(["manual", "enrollment", "sales", "internal"]);

export async function listProjects(req, res) {
  try {
    const {
      q = "",
      customerId = "",
      status = "",
      type = "",
      team = "",
      priority = "",
      enrollmentId = "",
      projectMode = "",
      source = "",
      page = "1",
      limit = "12",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    const filter = {};

    if (validId(customerId)) filter.customerId = customerId;
    if (validId(enrollmentId)) filter.enrollmentId = enrollmentId;

    if (status) filter.status = String(status).trim();
    if (type) filter.type = String(type).trim();
    if (team) filter.team = String(team).trim();
    if (priority) filter.priority = String(priority).trim();

    if (projectMode && ALLOWED_MODES.has(String(projectMode).trim())) {
      filter.projectMode = String(projectMode).trim();
    }

    if (source && ALLOWED_SOURCES.has(String(source).trim())) {
      filter.source = String(source).trim();
    }

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { name: rx },
        { code: rx },
        { notes: rx },
        { description: rx },
        { team: rx },
        { tags: rx },
      ];
    }

    const [total, items] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter)
        .sort(safeSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("customerId", "companyName contactName primaryEmail")
        .populate("ownerUserId", "fullName email")
        .populate("enrollmentId", "status serviceTemplateId")
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
    console.error("listProjects:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getProjectById(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Project.findById(id)
      .populate("customerId", "companyName contactName primaryEmail phone")
      .populate("ownerUserId", "fullName email")
      .populate("enrollmentId", "status serviceTemplateId pricing finalScope")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    const enrollmentsCount = await Enrollment.countDocuments({
      $or: [{ projectId: id }, { linkedProjectId: id }],
    });

    return res.json({
      ok: true,
      item: {
        ...item,
        enrollmentsCount,
      },
    });
  } catch (e) {
    console.error("getProjectById:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createProject(req, res) {
  try {
    const {
      customerId = null,
      enrollmentId = null,
      name,
      code = "",
      projectMode = "custom",
      source = "manual",
      type = "delivery",
      status = "draft",
      priority = "medium",
      ownerUserId = null,
      team = "",
      startDate = null,
      endDate = null,
      targetLaunchDate = null,
      currency = "AED",
      budget = null,
      description = "",
      notes = "",
      tags = [],
    } = req.body || {};

    if (!String(name || "").trim()) {
      return res.status(400).json({ ok: false, message: "name is required" });
    }

    const cleanMode = ALLOWED_MODES.has(String(projectMode).trim())
      ? String(projectMode).trim()
      : "custom";

    const cleanSource = ALLOWED_SOURCES.has(String(source).trim())
      ? String(source).trim()
      : "manual";

    let resolvedCustomerId = validId(customerId) ? customerId : null;
    let resolvedEnrollmentId = validId(enrollmentId) ? enrollmentId : null;

    if (
      cleanMode !== "internal" &&
      !resolvedCustomerId &&
      !resolvedEnrollmentId
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "customerId or enrollmentId is required unless projectMode is internal",
      });
    }

    if (resolvedEnrollmentId) {
      const enrollment = await Enrollment.findById(resolvedEnrollmentId).lean();
      if (!enrollment) {
        return res
          .status(404)
          .json({ ok: false, message: "Enrollment not found" });
      }

      if (
        resolvedCustomerId &&
        String(enrollment.customerId) !== String(resolvedCustomerId)
      ) {
        return res.status(400).json({
          ok: false,
          message: "Selected enrollment does not belong to selected customer",
        });
      }

      resolvedCustomerId = enrollment.customerId;
    }

    if (cleanMode === "internal") {
      resolvedCustomerId = null;
      resolvedEnrollmentId = null;
    }

    const doc = await Project.create({
      customerId: resolvedCustomerId,
      enrollmentId: resolvedEnrollmentId,
      name: String(name).trim(),
      code: String(code || "").trim(),
      projectMode: cleanMode,
      source: cleanSource,
      type: String(type || "delivery").trim(),
      status: String(status || "draft").trim(),
      priority: String(priority || "medium").trim(),
      ownerUserId: validId(ownerUserId) ? ownerUserId : null,
      team: String(team || "").trim(),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      targetLaunchDate: targetLaunchDate ? new Date(targetLaunchDate) : null,
      currency: String(currency || "AED").trim(),
      budget:
        typeof budget === "number" ? budget : budget ? Number(budget) : null,
      description: String(description || "").trim(),
      notes: String(notes || "").trim(),
      tags: Array.isArray(tags)
        ? tags.map((x) => String(x).trim()).filter(Boolean)
        : String(tags || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    const item = await Project.findById(doc._id)
      .populate("customerId", "companyName contactName primaryEmail")
      .populate("ownerUserId", "fullName email")
      .populate("enrollmentId", "status serviceTemplateId")
      .lean();

    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("createProject:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateProject(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const current = await Project.findById(id).lean();
    if (!current) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    const body = req.body || {};
    const patch = { updatedBy: req.user?.id || null };

    if (typeof body.name !== "undefined") {
      patch.name = String(body.name || "").trim();
    }

    if (typeof body.code !== "undefined") {
      patch.code = String(body.code || "").trim();
    }

    if (typeof body.type !== "undefined") {
      patch.type = String(body.type || "").trim();
    }

    if (typeof body.priority !== "undefined") {
      patch.priority = String(body.priority || "").trim();
    }

    if (typeof body.team !== "undefined") {
      patch.team = String(body.team || "").trim();
    }

    if (typeof body.currency !== "undefined") {
      patch.currency = String(body.currency || "").trim();
    }

    if (typeof body.description !== "undefined") {
      patch.description = String(body.description || "").trim();
    }

    if (typeof body.notes !== "undefined") {
      patch.notes = String(body.notes || "").trim();
    }

    if (
      typeof body.projectMode !== "undefined" &&
      ALLOWED_MODES.has(String(body.projectMode).trim())
    ) {
      patch.projectMode = String(body.projectMode).trim();
    }

    if (
      typeof body.source !== "undefined" &&
      ALLOWED_SOURCES.has(String(body.source).trim())
    ) {
      patch.source = String(body.source).trim();
    }

    if (typeof body.status !== "undefined") {
      patch.status = String(body.status || "").trim();
      if (patch.status === "archived") {
        patch.archivedAt = new Date();
      } else {
        patch.archivedAt = null;
      }
    }

    if (typeof body.ownerUserId !== "undefined") {
      patch.ownerUserId = validId(body.ownerUserId) ? body.ownerUserId : null;
    }

    if (typeof body.startDate !== "undefined") {
      patch.startDate = body.startDate ? new Date(body.startDate) : null;
    }

    if (typeof body.endDate !== "undefined") {
      patch.endDate = body.endDate ? new Date(body.endDate) : null;
    }

    if (typeof body.targetLaunchDate !== "undefined") {
      patch.targetLaunchDate = body.targetLaunchDate
        ? new Date(body.targetLaunchDate)
        : null;
    }

    if (typeof body.budget !== "undefined") {
      patch.budget =
        body.budget === null || body.budget === "" ? null : Number(body.budget);
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
      patch.customerId = validId(body.customerId) ? body.customerId : null;
    }

    if (typeof body.enrollmentId !== "undefined") {
      if (!body.enrollmentId) {
        patch.enrollmentId = null;
      } else {
        if (!validId(body.enrollmentId)) {
          return res
            .status(400)
            .json({ ok: false, message: "Invalid enrollmentId" });
        }

        const enrollment = await Enrollment.findById(body.enrollmentId).lean();
        if (!enrollment) {
          return res
            .status(404)
            .json({ ok: false, message: "Enrollment not found" });
        }

        const effectiveCustomerId = patch.customerId || current.customerId;

        if (
          effectiveCustomerId &&
          String(enrollment.customerId) !== String(effectiveCustomerId)
        ) {
          return res.status(400).json({
            ok: false,
            message: "Selected enrollment does not belong to selected customer",
          });
        }

        patch.enrollmentId = enrollment._id;

        if (!effectiveCustomerId) {
          patch.customerId = enrollment.customerId;
        }
      }
    }

    if (patch.projectMode === "internal") {
      patch.customerId = null;
      patch.enrollmentId = null;
      patch.source = "internal";
    }

    const item = await Project.findByIdAndUpdate(id, patch, { new: true })
      .populate("customerId", "companyName contactName primaryEmail")
      .populate("ownerUserId", "fullName email")
      .populate("enrollmentId", "status serviceTemplateId")
      .lean();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateProject:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function archiveProject(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Project.findByIdAndUpdate(
      id,
      {
        status: "archived",
        archivedAt: new Date(),
        updatedBy: req.user?.id || null,
      },
      { new: true }
    )
      .populate("customerId", "companyName contactName primaryEmail")
      .populate("ownerUserId", "fullName email")
      .populate("enrollmentId", "status serviceTemplateId")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("archiveProject:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
