import mongoose from "mongoose";

const ChecklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true, default: "" },
    required: { type: Boolean, default: true },
  },
  { _id: false }
);

const FinalScopeJobSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    type: { type: String, trim: true, default: "task" },
    quantity: { type: Number, default: 1 },
    unit: { type: String, trim: true, default: "" },
    priority: { type: String, trim: true, default: "" },
    startDays: { type: Number, default: 0 },
    dueDays: { type: Number, default: 0 },
    durationDays: { type: Number, default: 0 },
    timeEstimate: { type: String, trim: true, default: "" },
    effort: { type: String, trim: true, default: "" },
    assigneeName: { type: String, trim: true, default: "" },
    processOwner: { type: String, trim: true, default: "" },
    dependencies: { type: [String], default: [] },
    seoBoardStatus: { type: String, trim: true, default: "" },
    seoTaskType: { type: String, trim: true, default: "" },
    seoTarget: { type: String, trim: true, default: "" },
    funnelStage: { type: String, trim: true, default: "" },
    contentPhase: { type: String, trim: true, default: "" },
    seoQuarter: { type: String, trim: true, default: "" },
    executionPageUrl: { type: String, trim: true, default: "" },
    analyticsUrl: { type: String, trim: true, default: "" },
    parentGoalId: { type: String, trim: true, default: "" },
    parentGoalName: { type: String, trim: true, default: "" },
    parentGoalUrl: { type: String, trim: true, default: "" },
    required: { type: Boolean, default: true },
    checklist: {
      type: [ChecklistItemSchema],
      default: [],
    },
  },
  { _id: false }
);

const FinalScopeGroupSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    type: {
      type: String,
      trim: true,
      default: "deliverable_group",
    },
    order: { type: Number, default: 0 },
    dueDays: { type: Number, default: 0 },
    jobs: {
      type: [FinalScopeJobSchema],
      default: [],
    },
  },
  { _id: false }
);

const EnrollmentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    serviceTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceTemplate",
      required: true,
      index: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    status: {
      type: String,
      trim: true,
      default: "active",
      index: true,
    },

    pricing: {
      price: { type: Number, default: null },
      billingCycle: { type: String, trim: true, default: "" },
    },

    overrides: {
      notes: { type: String, trim: true, default: "" },
      customGroups: {
        type: [FinalScopeGroupSchema],
        default: [],
      },
    },

    finalScope: {
      mode: {
        type: String,
        trim: true,
        default: "recurring",
      },
      groups: {
        type: [FinalScopeGroupSchema],
        default: [],
      },
    },

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    accountOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    executionLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    notes: { type: String, trim: true, default: "" },

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

EnrollmentSchema.index({ customerId: 1, status: 1 });
EnrollmentSchema.index({ serviceTemplateId: 1, status: 1 });

// ONE enrollment per customer per service template
EnrollmentSchema.index(
  { customerId: 1, serviceTemplateId: 1 },
  { unique: true, name: "uniq_customer_service_template" }
);

export default mongoose.models.Enrollment ||
  mongoose.model("Enrollment", EnrollmentSchema);
