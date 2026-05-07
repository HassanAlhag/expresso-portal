import mongoose from "mongoose";
import {
  JOB_PRIORITIES,
  JOB_STATUSES,
  JOB_TYPES,
  JOB_WORKFLOW_TYPES,
  JOB_PUBLISH_STATUSES,
} from "./job.constants.js";

const JobSchema = new mongoose.Schema(
  {
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
});

export default mongoose.models.Job || mongoose.model("Job", JobSchema);
