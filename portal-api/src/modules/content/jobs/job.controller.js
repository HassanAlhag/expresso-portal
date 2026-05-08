import mongoose from "mongoose";
import Job from "./job.model.js";
import Media from "../media/media.model.js";
import Production from "../productions/production.model.js";
import Project from "../../projects/project.model.js";
import Enrollment from "../../enrollments/enrollment.model.js";
import {
  getWorkflowTypeFromJobType,
  isValidJobPriority,
  isValidJobStatus,
  isValidJobType,
  isValidPublishStatus,
  isValidWorkflowType,
  normalizeJobStatus,
  normalizeJobType,
  safeJobSort,
} from "./job.constants.js";
import { generateJobsFromEnrollment } from "./job.generator.js";

function safeRx(s) {
  const v = String(s || "").trim();
  if (!v) return null;
  return new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

export async function listJobs(req, res) {
  try {
    const {
      q = "",
      customerId = "",
      projectId = "",
      enrollmentId = "",
      assigneeId = "",
      status = "",
      type = "",
      workflowType = "",
      publishStatus = "",
      platform = "",
      websiteVisible = "",
      page = "1",
      limit = "12",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    const filter = {};

    if (validId(customerId)) filter.customerId = customerId;
    if (validId(projectId)) filter.projectId = projectId;
    if (validId(enrollmentId)) filter.enrollmentId = enrollmentId;
    if (validId(assigneeId)) filter.assignees = assigneeId;

    if (status && isValidJobStatus(status)) {
      filter.status = normalizeJobStatus(status);
    }

    if (type && isValidJobType(type)) {
      filter.type = normalizeJobType(type);
    }

    if (workflowType && isValidWorkflowType(workflowType)) {
      filter.workflowType = String(workflowType).trim().toLowerCase();
    }

    if (publishStatus && isValidPublishStatus(publishStatus)) {
      filter.publishStatus = String(publishStatus).trim().toLowerCase();
    }

    if (platform) {
      filter.platform = String(platform).trim().toLowerCase();
    }

    if (websiteVisible === "true") filter.websiteVisible = true;
    if (websiteVisible === "false") filter.websiteVisible = false;

    const rx = safeRx(q);
    if (rx) {
      filter.$or = [
        { title: rx },
        { notes: rx },
        { storyboard: rx },
        { caption: rx },
        { concept: rx },
        { script: rx },
        { location: rx },
      ];
    }

    const [total, items] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter)
        .populate("customerId", "companyName contactName")
        .populate("projectId", "name status type")
        .populate("enrollmentId", "status serviceTemplateId")
        .populate("assignees", "fullName email role")
        .populate(
          "coverMedia",
          "url thumbnailUrl fileUrl type title mimeType status"
        )
        .populate(
          "draftMediaId",
          "url thumbnailUrl fileUrl type title mimeType status"
        )
        .populate(
          "finalMediaId",
          "url thumbnailUrl fileUrl type title mimeType status"
        )
        .populate(
          "posterMediaId",
          "url thumbnailUrl fileUrl type title mimeType status"
        )
        .sort(safeJobSort(sort))
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
    console.error("listJobs:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function listPublicWebsiteJobs(req, res) {
  try {
    const {
      type = "",
      limit = "50",
      page = "1",
      sort = "-publishedAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    const filter = {
      websiteVisible: true,
      status: "published",
    };

    if (type && isValidJobType(type)) {
      filter.type = normalizeJobType(type);
    }

    const [total, items] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter)
        .populate("customerId", "companyName contactName")
        .populate("posterMediaId", "url fileUrl thumbnailUrl")
        .populate("finalMediaId", "url fileUrl thumbnailUrl")
        .sort({ publishedAt: -1 })
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
    console.error("listPublicWebsiteJobs:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getJob(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Job.findById(id)
      .populate("customerId", "companyName contactName primaryEmail phone")
      .populate("projectId", "name status type budget currency")
      .populate({
        path: "enrollmentId",
        populate: {
          path: "serviceTemplateId",
          select: "name slug summary",
        },
      })
      .populate("assignees", "fullName email role")
      .populate("approvals.createdBy", "fullName email role")
      .populate(
        "coverMedia",
        "url thumbnailUrl fileUrl type title mimeType status"
      )
      .populate(
        "media",
        "url thumbnailUrl fileUrl type title mimeType status tags category"
      )
      .populate(
        "draftMediaId",
        "url fileUrl thumbnailUrl type title mimeType status"
      )
      .populate(
        "finalMediaId",
        "url fileUrl thumbnailUrl type title mimeType status"
      )
      .populate(
        "posterMediaId",
        "url fileUrl thumbnailUrl type title mimeType status"
      )
      .populate("productionId", "title slug status")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getJob:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createJob(req, res) {
  try {
    const {
      customerId = "",
      projectId = "",
      enrollmentId = null,
      title,
      type = "video",
      workflowType = "",
      priority = "normal",
      notes = "",
      status = "brief",
      publishStatus = "not_ready",
      platform = "",
      dueDate = null,
      shootDate = null,
      caption = "",
      concept = "",
      storyboard = "",
      script = "",
      shotList = "",
      location = "",
      websiteVisible = false,
      websiteFeatured = false,
      assignees = [],
    } = req.body || {};

    if (!String(title || "").trim()) {
      return res.status(400).json({ ok: false, message: "Title is required" });
    }

    let resolvedCustomerId = null;
    let resolvedProjectId = null;
    let resolvedEnrollmentId = null;

    if (projectId) {
      if (!validId(projectId)) {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid projectId" });
      }

      const project = await Project.findById(projectId).lean();
      if (!project) {
        return res
          .status(404)
          .json({ ok: false, message: "Project not found" });
      }

      resolvedProjectId = project._id;
      resolvedCustomerId = project.customerId;
    }

    if (enrollmentId) {
      if (!validId(enrollmentId)) {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid enrollmentId" });
      }

      const enrollment = await Enrollment.findById(enrollmentId).lean();
      if (!enrollment) {
        return res
          .status(404)
          .json({ ok: false, message: "Enrollment not found" });
      }

      if (
        resolvedProjectId &&
        enrollment.projectId &&
        String(enrollment.projectId) !== String(resolvedProjectId)
      ) {
        return res.status(400).json({
          ok: false,
          message: "enrollmentId does not belong to the selected project",
        });
      }

      if (
        resolvedCustomerId &&
        String(enrollment.customerId) !== String(resolvedCustomerId)
      ) {
        return res.status(400).json({
          ok: false,
          message: "enrollmentId does not belong to the selected customer",
        });
      }

      resolvedEnrollmentId = enrollment._id;
      resolvedCustomerId = enrollment.customerId;

      if (!resolvedProjectId && enrollment.projectId) {
        resolvedProjectId = enrollment.projectId;
      }
    }

    if (customerId) {
      if (!validId(customerId)) {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid customerId" });
      }

      if (
        resolvedCustomerId &&
        String(customerId) !== String(resolvedCustomerId)
      ) {
        return res.status(400).json({
          ok: false,
          message: "customerId does not match selected project/enrollment",
        });
      }

      resolvedCustomerId = customerId;
    }

    if (!resolvedCustomerId) {
      return res.status(400).json({
        ok: false,
        message: "customerId or enrollmentId or projectId is required",
      });
    }

    const normalizedType = isValidJobType(type)
      ? normalizeJobType(type)
      : "other";

    const resolvedWorkflowType = isValidWorkflowType(workflowType)
      ? String(workflowType).trim().toLowerCase()
      : getWorkflowTypeFromJobType(normalizedType);

    const item = await Job.create({
      customerId: resolvedCustomerId,
      projectId: resolvedProjectId || null,
      enrollmentId: resolvedEnrollmentId || null,

      title: String(title).trim(),
      type: normalizedType,
      workflowType: resolvedWorkflowType,

      priority: isValidJobPriority(priority) ? priority : "normal",
      status: isValidJobStatus(status) ? normalizeJobStatus(status) : "brief",
      publishStatus: isValidPublishStatus(publishStatus)
        ? String(publishStatus).trim().toLowerCase()
        : "not_ready",

      platform: String(platform || "")
        .trim()
        .toLowerCase(),
      dueDate: dueDate ? new Date(dueDate) : null,
      shootDate: shootDate ? new Date(shootDate) : null,

      caption: String(caption || "").trim(),
      concept: String(concept || "").trim(),
      storyboard: String(storyboard || "").trim(),
      script: String(script || "").trim(),
      shotList: String(shotList || "").trim(),
      location: String(location || "").trim(),
      notes: String(notes || "").trim(),

      websiteVisible: !!websiteVisible,
      websiteFeatured: !!websiteFeatured,

      assignees: Array.isArray(assignees)
        ? assignees.filter((x) => validId(x))
        : [],
    });

    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("createJob:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateJob(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const current = await Job.findById(id).lean();
    if (!current) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    const body = req.body || {};
    const patch = {};

    const textFields = [
      "title",
      "storyboard",
      "shotList",
      "notes",
      "caption",
      "concept",
      "script",
      "location",
    ];

    for (const f of textFields) {
      if (typeof body[f] !== "undefined") {
        patch[f] = String(body[f] || "").trim();
      }
    }

    if (typeof body.type !== "undefined") {
      const nextType = normalizeJobType(body.type);
      patch.type = isValidJobType(nextType) ? nextType : current.type;

      if (typeof body.workflowType === "undefined") {
        patch.workflowType = getWorkflowTypeFromJobType(patch.type);
      }
    }

    if (typeof body.workflowType !== "undefined") {
      patch.workflowType = isValidWorkflowType(body.workflowType)
        ? String(body.workflowType).trim().toLowerCase()
        : current.workflowType;
    }

    if (typeof body.priority !== "undefined") {
      patch.priority = isValidJobPriority(body.priority)
        ? body.priority
        : current.priority;
    }

    if (typeof body.status !== "undefined") {
      const nextStatus = normalizeJobStatus(body.status);
      patch.status = isValidJobStatus(nextStatus) ? nextStatus : current.status;

      if (patch.status === "published") patch.publishedAt = new Date();
      if (patch.status === "delivered") patch.deliveredAt = new Date();
    }

    if (typeof body.publishStatus !== "undefined") {
      patch.publishStatus = isValidPublishStatus(body.publishStatus)
        ? String(body.publishStatus).trim().toLowerCase()
        : current.publishStatus;
    }

    if (typeof body.platform !== "undefined") {
      patch.platform = String(body.platform || "")
        .trim()
        .toLowerCase();
    }

    if (typeof body.dueDate !== "undefined") {
      patch.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    if (typeof body.shootDate !== "undefined") {
      patch.shootDate = body.shootDate ? new Date(body.shootDate) : null;
    }

    if (typeof body.websiteVisible !== "undefined") {
      patch.websiteVisible = !!body.websiteVisible;
    }

    if (typeof body.websiteFeatured !== "undefined") {
      patch.websiteFeatured = !!body.websiteFeatured;
    }

    if (typeof body.draftMediaId !== "undefined") {
      patch.draftMediaId = validId(body.draftMediaId)
        ? body.draftMediaId
        : null;
    }

    if (typeof body.finalMediaId !== "undefined") {
      patch.finalMediaId = validId(body.finalMediaId)
        ? body.finalMediaId
        : null;
    }

    if (typeof body.posterMediaId !== "undefined") {
      patch.posterMediaId = validId(body.posterMediaId)
        ? body.posterMediaId
        : null;
    }

    if (typeof body.externalPostUrl !== "undefined") {
      patch.externalPostUrl = String(body.externalPostUrl || "").trim();
    }

    if (typeof body.coverMedia !== "undefined") {
      patch.coverMedia = validId(body.coverMedia) ? body.coverMedia : null;
    }

    if (typeof body.assignees !== "undefined") {
      patch.assignees = Array.isArray(body.assignees)
        ? body.assignees.filter((x) => validId(x))
        : [];
    }

    if (typeof body.deliverables !== "undefined") {
      patch.deliverables = Array.isArray(body.deliverables)
        ? body.deliverables
        : [];
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
          return res.status(404).json({
            ok: false,
            message: "Enrollment not found",
          });
        }

        if (String(enrollment.customerId) !== String(current.customerId)) {
          return res.status(400).json({
            ok: false,
            message: "Enrollment does not belong to this customer",
          });
        }

        patch.enrollmentId = enrollment._id;

        if (!current.projectId && enrollment.projectId) {
          patch.projectId = enrollment.projectId;
        }
      }
    }

    const item = await Job.findByIdAndUpdate(id, patch, { new: true })
      .populate("customerId", "companyName contactName")
      .populate("projectId", "name status type")
      .populate({
        path: "enrollmentId",
        populate: { path: "serviceTemplateId", select: "name slug summary" },
      })
      .populate(
        "coverMedia",
        "url thumbnailUrl fileUrl type title mimeType status"
      )
      .populate(
        "media",
        "url thumbnailUrl fileUrl type title mimeType status tags category"
      )
      .populate(
        "draftMediaId",
        "url fileUrl thumbnailUrl type title mimeType status"
      )
      .populate(
        "finalMediaId",
        "url fileUrl thumbnailUrl type title mimeType status"
      )
      .populate(
        "posterMediaId",
        "url fileUrl thumbnailUrl type title mimeType status"
      )
      .lean();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateJob:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteJob(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Job.findByIdAndDelete(id).lean();
    if (!item) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteJob:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function attachMedia(req, res) {
  try {
    const { id } = req.params;
    const { mediaIds = [] } = req.body || {};

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const ids = Array.isArray(mediaIds)
      ? mediaIds.filter((x) => validId(x))
      : [];

    if (!ids.length) {
      return res.status(400).json({ ok: false, message: "No valid mediaIds" });
    }

    const found = await Media.find({ _id: { $in: ids } })
      .select("_id")
      .lean();
    const foundIds = found.map((x) => x._id);

    const item = await Job.findByIdAndUpdate(
      id,
      { $addToSet: { media: { $each: foundIds } } },
      { new: true }
    )
      .populate("customerId", "companyName contactName")
      .populate("projectId", "name status type")
      .populate({
        path: "enrollmentId",
        populate: { path: "serviceTemplateId", select: "name slug summary" },
      })
      .populate(
        "coverMedia",
        "url thumbnailUrl fileUrl type title mimeType status"
      )
      .populate(
        "media",
        "url thumbnailUrl fileUrl type title mimeType status tags category"
      )
      .populate(
        "draftMediaId",
        "url fileUrl thumbnailUrl type title mimeType status"
      )
      .populate(
        "finalMediaId",
        "url fileUrl thumbnailUrl type title mimeType status"
      )
      .populate(
        "posterMediaId",
        "url fileUrl thumbnailUrl type title mimeType status"
      )
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("attachMedia:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

const APPROVAL_STATUSES = [
  "requested",
  "approved",
  "changes_requested",
  "internal_note",
  "client_note",
  "client_sent",
];

export async function addApproval(req, res) {
  try {
    const { id } = req.params;
    const { status = "internal_note", note = "" } = req.body || {};

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const entry = {
      createdBy: req.user?.id || null,
      at: new Date(),
      createdAt: new Date(),
      note: String(note || ""),
      status: APPROVAL_STATUSES.includes(status) ? status : "internal_note",
    };

    const item = await Job.findByIdAndUpdate(
      id,
      { $push: { approvals: entry } },
      { new: true }
    )
      .populate("customerId", "companyName contactName")
      .populate("projectId", "name status type")
      .populate({
        path: "enrollmentId",
        populate: { path: "serviceTemplateId", select: "name slug summary" },
      })
      .populate("assignees", "fullName email role")
      .populate("approvals.createdBy", "fullName email role")
      .populate(
        "coverMedia",
        "url thumbnailUrl fileUrl type title mimeType status"
      )
      .populate(
        "media",
        "url thumbnailUrl fileUrl type title mimeType status tags category"
      )
      .populate(
        "draftMediaId",
        "url fileUrl thumbnailUrl type title mimeType status"
      )
      .populate(
        "finalMediaId",
        "url fileUrl thumbnailUrl type title mimeType status"
      )
      .populate(
        "posterMediaId",
        "url fileUrl thumbnailUrl type title mimeType status"
      )
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("addApproval:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function publishToWebsite(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const job = await Job.findById(id).populate("media", "status").lean();
    if (!job) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    const body = req.body || {};

    const approvedMediaIds = (job.media || [])
      .filter((m) => m.status === "published" || m.status === "approved")
      .map((m) => String(m._id));

    const title = String(body.title || job.title || "").trim();
    if (!title) {
      return res.status(400).json({ ok: false, message: "Title required" });
    }

    const slug = String(body.slug || job.title || "")
      .trim()
      .toLowerCase()
      .replace(/[^\w]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const excerpt = String(body.excerpt || "").trim();
    const category = String(body.category || "").trim();
    const tags = Array.isArray(body.tags) ? body.tags : [];

    const coverMedia = validId(body.coverMedia)
      ? body.coverMedia
      : validId(job.coverMedia)
      ? job.coverMedia
      : null;

    const gallery = Array.isArray(body.galleryMediaIds)
      ? body.galleryMediaIds.filter((x) => validId(x))
      : approvedMediaIds;

    const uniqueSlug = async (base, excludeId = null) => {
      const q = excludeId ? { slug: base, _id: { $ne: excludeId } } : { slug: base };
      const exists = await Production.findOne(q).select("_id").lean();
      return exists ? `${base}-${Date.now()}` : base;
    };

    let production = null;

    if (job.productionId) {
      const safeSlug = await uniqueSlug(slug, job.productionId);
      production = await Production.findByIdAndUpdate(
        job.productionId,
        {
          title,
          slug: safeSlug,
          excerpt,
          category,
          tags,
          coverMedia,
          gallery,
          status: "published",
          publishedAt: new Date(),
        },
        { new: true }
      ).lean();
    } else {
      const safeSlug = await uniqueSlug(slug);
      production = await Production.create({
        title,
        slug: safeSlug,
        excerpt,
        category,
        tags,
        coverMedia,
        gallery,
        status: "published",
        publishedAt: new Date(),
        description: "",
        seo: { metaTitle: "", metaDesc: "" },
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      {
        $set: {
          productionId: production._id,
          status: "published",
          publishedAt: new Date(),
        },
      },
      { new: true }
    )
      .populate("productionId", "title slug status")
      .lean();

    return res.json({ ok: true, job: updatedJob, production });
  } catch (e) {
    console.error("publishToWebsite:", e);
    const msg = e?.code === 11000
      ? "Slug conflict — another production uses that URL. Try again."
      : e?.message || "Server error";
    return res.status(500).json({ ok: false, message: msg });
  }
}

export async function generateJobsForEnrollment(req, res) {
  try {
    const { enrollmentId } = req.params;

    if (!validId(enrollmentId)) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid enrollmentId" });
    }

    const enrollment = await Enrollment.findById(enrollmentId).lean();
    if (!enrollment) {
      return res
        .status(404)
        .json({ ok: false, message: "Enrollment not found" });
    }

    const existingJobsCount = await Job.countDocuments({
      enrollmentId: enrollment._id,
    });

    if (existingJobsCount > 0) {
      return res.status(409).json({
        ok: false,
        message: "Jobs were already generated for this enrollment.",
      });
    }

    const created = await generateJobsFromEnrollment(enrollment);

    return res.status(201).json({
      ok: true,
      count: created.length,
      items: created,
      message: `${created.length} job(s) generated successfully.`,
    });
  } catch (e) {
    console.error("generateJobsForEnrollment:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
