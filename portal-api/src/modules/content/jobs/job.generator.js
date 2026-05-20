import Job from "./job.model.js";
import ServiceTemplate from "../../services/serviceTemplate.model.js";
import {
  getWorkflowTypeFromJobType,
  normalizeJobType,
} from "./job.constants.js";

function safeText(value, fallback = "") {
  return String(value || fallback).trim();
}

function buildJobsFromGroups(enrollment) {
  const groups = Array.isArray(enrollment?.finalScope?.groups)
    ? enrollment.finalScope.groups
    : [];

  const jobs = [];

  groups.forEach((group, groupIndex) => {
    const groupJobs = Array.isArray(group?.jobs) ? group.jobs : [];

    groupJobs.forEach((job, jobIndex) => {
      const quantity = Math.max(1, Number(job?.quantity || 1));
      const normalizedType = normalizeJobType(job?.type);
      const workflowType = getWorkflowTypeFromJobType(normalizedType);

      for (let i = 0; i < quantity; i += 1) {
        const sequenceSuffix = quantity > 1 ? ` #${i + 1}` : "";

        jobs.push({
          customerId: enrollment.customerId,
          projectId: enrollment.projectId || null,
          enrollmentId: enrollment._id,

          title:
            safeText(
              job?.title,
              `${group?.title || "Group"} - Item ${jobIndex + 1}`
            ) + sequenceSuffix,

          type: normalizedType,
          workflowType,
          status: "brief",
          publishStatus: "not_ready",
          priority: "normal",

          notes: [
            group?.title ? `Group: ${group.title}` : "",
            job?.description ? job.description : "",
          ]
            .filter(Boolean)
            .join("\n"),

          deliverables: [
            {
              title: safeText(
                job?.title,
                `${group?.title || "Group"} Deliverable ${jobIndex + 1}`
              ),
              done: false,
            },
          ],

          createdBy: enrollment.createdBy || null,
          updatedBy: enrollment.updatedBy || null,
        });
      }
    });
  });

  return jobs;
}

export async function generateJobsFromEnrollment(enrollmentDoc) {
  const enrollment =
    typeof enrollmentDoc?.toObject === "function"
      ? enrollmentDoc.toObject()
      : enrollmentDoc;

  if (!enrollment?._id) {
    throw new Error("Enrollment is required");
  }

  // Fetch approval config from the service template
  let approvalSteps = [];
  let approvalChecklist = [];
  if (enrollment.serviceTemplateId) {
    const tpl = await ServiceTemplate.findById(enrollment.serviceTemplateId)
      .select("approvals")
      .lean();
    if (tpl?.approvals?.required !== false) {
      approvalSteps = Array.isArray(tpl?.approvals?.steps)
        ? tpl.approvals.steps.map((s) => ({
            id:           String(s.id || ""),
            title:        String(s.title || ""),
            role:         String(s.role || "client"),
            required:     s.required !== false,
            instructions: String(s.instructions || ""),
          }))
        : [];
      approvalChecklist = Array.isArray(tpl?.approvals?.checklist)
        ? tpl.approvals.checklist.map((c) => ({
            id:       String(c.id || ""),
            text:     String(c.text || ""),
            required: c.required !== false,
            done:     false,
          })).filter((c) => c.text)
        : [];
    }
  }

  const jobs = buildJobsFromGroups(enrollment).map((j) => ({
    ...j,
    approvalSteps,
    approvalChecklist,
  }));

  if (!jobs.length) {
    return [];
  }

  const created = await Job.insertMany(jobs);
  return created;
}
