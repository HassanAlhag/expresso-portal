import mongoose from "mongoose";
import {
  SERVICE_TEMPLATE_STATUSES,
  SERVICE_BILLING_CYCLES,
  SERVICE_EXECUTION_MODES,
  DELIVERABLE_TYPES,
  SCOPE_GROUP_TYPES,
} from "./serviceTemplate.constants.js";

const ChecklistItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    text: { type: String, trim: true, default: "" },
    required: { type: Boolean, default: true },
  },
  { _id: false }
);

const ScopeGroupJobSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: DELIVERABLE_TYPES,
      default: "task",
    },
    quantity: { type: Number, default: 1 },
    unit: { type: String, trim: true, default: "" },
    dueDays: { type: Number, default: 0 },
    required: { type: Boolean, default: true },
    checklist: {
      type: [ChecklistItemSchema],
      default: [],
    },
  },
  { _id: false }
);

const ScopeGroupSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: SCOPE_GROUP_TYPES,
      default: "deliverable_group",
    },
    order: { type: Number, default: 0 },
    dueDays: { type: Number, default: 0 },
    jobs: {
      type: [ScopeGroupJobSchema],
      default: [],
    },
  },
  { _id: false }
);

const ApprovalStepSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    title: { type: String, trim: true, required: true },
    required: { type: Boolean, default: true },
    role: { type: String, trim: true, default: "client" },
    instructions: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const ServiceTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 160,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: SERVICE_TEMPLATE_STATUSES,
      default: "draft",
      index: true,
    },

    summary: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },

    billingCycle: {
      type: String,
      enum: SERVICE_BILLING_CYCLES,
      default: "monthly",
    },

    price: { type: Number, default: null },

    executionMode: {
      type: String,
      enum: SERVICE_EXECUTION_MODES,
      default: "recurring",
      index: true,
    },

    scopeGroups: {
      type: [ScopeGroupSchema],
      default: [],
    },

    sla: {
      responseTime: { type: Number, default: 24 },
      responseUnit: {
        type: String,
        enum: ["hours", "days"],
        default: "hours",
      },
      revisionRounds: { type: Number, default: 2 },
      deliveryDays: { type: Number, default: 7 },
      workingDaysOnly: { type: Boolean, default: true },
      supportWindow: {
        type: String,
        trim: true,
        default: "Mon–Fri, 9am–6pm",
      },
      notes: { type: String, trim: true, default: "" },
    },

    approvals: {
      required: { type: Boolean, default: true },
      steps: { type: [ApprovalStepSchema], default: [] },
      checklist: { type: [String], default: [] },
    },

    files: {
      uploads: { type: [String], default: [] },
      mediaRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
    },

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

ServiceTemplateSchema.index({ name: 1 });
ServiceTemplateSchema.index({ executionMode: 1, status: 1 });

export default mongoose.models.ServiceTemplate ||
  mongoose.model("ServiceTemplate", ServiceTemplateSchema);
