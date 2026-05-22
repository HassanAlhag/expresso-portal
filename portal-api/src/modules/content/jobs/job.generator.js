import Job from "./job.model.js";
import ServiceTemplate from "../../services/serviceTemplate.model.js";
import {
  getWorkflowTypeFromJobType,
  normalizeJobType,
} from "./job.constants.js";

function safeText(value, fallback = "") {
  return String(value || fallback).trim();
}

function addDays(value, days) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + Number(days || 0));
  return date;
}

function priorityFromPlan(priority, effort) {
  const value = String(priority || effort || "")
    .trim()
    .toLowerCase();
  if (value === "urgent") return "urgent";
  if (value === "high") return "high";
  if (value === "low") return "low";
  return "normal";
}

function stringList(value) {
  if (Array.isArray(value)) {
    return value.map((x) => String(x || "").trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
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
      const startDays = Number(job?.startDays || 0);
      const dueDays = Number(job?.dueDays || 0);
      const dependencies = stringList(job?.dependencies);

      for (let i = 0; i < quantity; i += 1) {
        const sequenceSuffix = quantity > 1 ? ` #${i + 1}` : "";

        jobs.push({
          customerId: enrollment.customerId,
          projectId: null,
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
          priority: priorityFromPlan(job?.priority, job?.effort),
          startDate: addDays(enrollment.startDate, startDays),
          dueDate: dueDays ? addDays(enrollment.startDate, dueDays) : null,
          durationDays: Number(
            job?.durationDays || Math.max(0, dueDays - startDays) || 0
          ),
          timeEstimate: safeText(job?.timeEstimate),
          effort: safeText(job?.effort),
          assigneeName: safeText(job?.assigneeName),
          processOwner: safeText(job?.processOwner),
          dependencies,
          seoBoardStatus: safeText(job?.seoBoardStatus),
          seoTaskType: safeText(job?.seoTaskType),
          seoTarget: safeText(job?.seoTarget),
          funnelStage: safeText(job?.funnelStage),
          contentPhase: safeText(job?.contentPhase),
          seoQuarter: safeText(job?.seoQuarter),
          executionPageUrl: safeText(job?.executionPageUrl),
          analyticsUrl: safeText(job?.analyticsUrl),
          parentGoalId: safeText(job?.parentGoalId),
          parentGoalName: safeText(job?.parentGoalName),
          parentGoalUrl: safeText(job?.parentGoalUrl),

          notes: [
            group?.title ? `Group: ${group.title}` : "",
            job?.description ? job.description : "",
            job?.seoBoardStatus ? `SEO status: ${job.seoBoardStatus}` : "",
            job?.priority ? `Priority: ${job.priority}` : "",
            job?.assigneeName ? `Assignee: ${job.assigneeName}` : "",
            job?.processOwner ? `Process owner: ${job.processOwner}` : "",
            job?.timeEstimate ? `Estimate: ${job.timeEstimate}` : "",
            job?.effort ? `Effort: ${job.effort}` : "",
            job?.seoTaskType ? `SEO task type: ${job.seoTaskType}` : "",
            job?.seoTarget ? `Target: ${job.seoTarget}` : "",
            job?.funnelStage ? `Funnel: ${job.funnelStage}` : "",
            job?.contentPhase ? `Content phase: ${job.contentPhase}` : "",
            job?.seoQuarter ? `Quarter: ${job.seoQuarter}` : "",
            job?.executionPageUrl ? `Execution page: ${job.executionPageUrl}` : "",
            job?.analyticsUrl ? `Analytics: ${job.analyticsUrl}` : "",
            job?.parentGoalName ? `Parent goal: ${job.parentGoalName}` : "",
            job?.parentGoalUrl ? `Parent URL: ${job.parentGoalUrl}` : "",
            dependencies.length ? `Depends on: ${dependencies.join(", ")}` : "",
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
