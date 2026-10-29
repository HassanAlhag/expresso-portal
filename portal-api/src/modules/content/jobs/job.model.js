import mongoose from "mongoose";
import { JobOperatingSchema } from "../../operating/operating.schemas.js";
import {
  JOB_PRIORITIES,
  JOB_STATUSES,
  JOB_TYPES,
  JOB_WORKFLOW_TYPES,
  JOB_PUBLISH_STATUSES,
} from "./job.constants.js";

const JobSchema = new mongoose.Schema(
  {
    operatingModelVersion: { type: Number, default: 0 },
    operating: { type: JobOperatingSchema, default: undefined },
    originDeliveryPeriodId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPeriod", default: null, index: true },
    workDeliveryPeriodId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPeriod", default: null, index: true },
    agreementRevisionId: { type: String, default: "" },
    scopeLineId: { type: String, default: "" },
    scopeUnitOrdinal: { type: Number, default: null },
    managedObligationKey: { type: String, default: undefined },
    phaseId: { type: String, default: "" },
    originalCommittedDueDate: { type: Date, default: null },
    scheduledPublicationDate: { type: Date, default: null, index: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },

    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      default: null,
      index: true,
    },

    productionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Production",
      default: null,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },

    type: {
      type: String,
      enum: JOB_TYPES,
      default: "video",
      index: true,
    },

    workflowType: {
      type: String,
      enum: JOB_WORKFLOW_TYPES,
      default: "design",
      index: true,
    },

    status: {
      type: String,
      enum: JOB_STATUSES,
      default: "brief",
      index: true,
    },

    publishStatus: {
      type: String,
      enum: JOB_PUBLISH_STATUSES,
      default: "not_ready",
      index: true,
    },

    priority: {
      type: String,
      enum: JOB_PRIORITIES,
      default: "normal",
      index: true,
    },

    platform: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    dueDate: {
      type: Date,
      default: null,
      index: true,
    },

    startDate: {
      type: Date,
      default: null,
      index: true,
    },

    durationDays: {
      type: Number,
      default: 0,
    },

    timeEstimate: {
      type: String,
      default: "",
      trim: true,
    },

    effort: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    assigneeName: {
      type: String,
      default: "",
      trim: true,
    },

    processOwner: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    dependencies: {
      type: [String],
      default: [],
    },

    seoBoardStatus: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    seoTaskType: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    seoTarget: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    funnelStage: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    contentPhase: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    seoQuarter: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    executionPageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    analyticsUrl: {
      type: String,
      default: "",
      trim: true,
    },

    parentGoalId: {
      type: String,
      default: "",
      trim: true,
    },

    parentGoalName: {
      type: String,
      default: "",
      trim: true,
    },

    parentGoalUrl: {
      type: String,
      default: "",
      trim: true,
    },

    shootDate: {
      type: Date,
      default: null,
    },

    websiteVisible: {
      type: Boolean,
      default: false,
      index: true,
    },

    websiteFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    coverMedia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    draftMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    finalMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    posterMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    media: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Media",
      default: [],
    },

    externalPostUrl: {
      type: String,
      default: "",
      trim: true,
    },

    caption: { type: String, default: "" },
    concept: { type: String, default: "" },
    storyboard: { type: String, default: "" },
    script: { type: String, default: "" },
    shotList: { type: String, default: "" },
    location: { type: String, default: "" },
    notes: { type: String, default: "" },

    assignees: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    deliverables: {
      type: [
        {
          title: { type: String, default: "" },
          done: { type: Boolean, default: false },
        },
      ],
      default: [],
    },

    approvalSteps: {
      type: [
        {
          id:           { type: String, default: "" },
          title:        { type: String, default: "" },
          role:         { type: String, default: "client" },
          required:     { type: Boolean, default: true },
          instructions: { type: String, default: "" },
        },
      ],
      default: [],
    },

    approvalChecklist: {
      type: [
        {
          id:       { type: String, default: "" },
          text:     { type: String, default: "" },
          required: { type: Boolean, default: true },
          done:     { type: Boolean, default: false },
        },
      ],
      default: [],
    },

    approvals: {
      type: [
        {
          createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          at: { type: Date, default: Date.now },
          createdAt: { type: Date, default: Date.now },
          note: { type: String, default: "" },
          status: {
            type: String,
            enum: [
              "requested",
              "approved",
              "changes_requested",
              "internal_note",
              "client_note",
              "client_sent",
            ],
            default: "internal_note",
          },
        },
      ],
      default: [],
    },

    postMetrics: {
      likes:          { type: Number, default: 0 },
      comments:       { type: Number, default: 0 },
      shares:         { type: Number, default: 0 },
      saves:          { type: Number, default: 0 },
      reach:          { type: Number, default: 0 },
      impressions:    { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
      lastUpdated:    { type: Date,   default: null },
    },

    publishedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

JobSchema.index({
  title: "text",
  storyboard: "text",
  notes: "text",
  caption: "text",
  concept: "text",
  script: "text",
  seoTaskType: "text",
  seoTarget: "text",
  parentGoalName: "text",
});

JobSchema.index({ managedObligationKey: 1 }, { unique: true, partialFilterExpression: { managedObligationKey: { $type: "string" } }, name: "uniq_managed_obligation" });
export default mongoose.models.Job || mongoose.model("Job", JobSchema);
