import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      trim: true,
      default: "",
    },

    projectMode: {
      type: String,
      enum: ["pre_contract", "contracted", "custom", "internal"],
      default: "custom",
      index: true,
    },

    source: {
      type: String,
      enum: ["manual", "enrollment", "sales", "internal"],
      default: "manual",
      index: true,
    },

    type: {
      type: String,
      trim: true,
      default: "delivery", // delivery | campaign | branding | website | support | other
      index: true,
    },

    status: {
      type: String,
      trim: true,
      default: "draft", // draft | planned | active | on_hold | in_review | completed | archived | cancelled
      index: true,
    },

    priority: {
      type: String,
      trim: true,
      default: "medium", // low | medium | high | urgent
      index: true,
    },

    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    team: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    targetLaunchDate: { type: Date, default: null },

    currency: {
      type: String,
      trim: true,
      default: "AED",
    },

    budget: {
      type: Number,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    archivedAt: {
      type: Date,
      default: null,
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

ProjectSchema.index({ customerId: 1, status: 1 });
ProjectSchema.index({ customerId: 1, type: 1 });
ProjectSchema.index({ customerId: 1, projectMode: 1 });
ProjectSchema.index({ enrollmentId: 1 });
ProjectSchema.index({ ownerUserId: 1 });
ProjectSchema.index({ team: 1 });
ProjectSchema.index({ name: 1 });

export default mongoose.models.Project ||
  mongoose.model("Project", ProjectSchema);
