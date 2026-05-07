import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
      index: true,
    },

    productionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Production",
      default: null,
      index: true,
    },

    visibility: {
      type: String,
      enum: ["internal", "client"],
      default: "internal",
      index: true,
    },

    approved: {
      type: Boolean,
      default: false,
      index: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    filename: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      default: "",
    },

    size: {
      type: Number,
      default: 0,
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    tags: {
      type: [String],
      default: [],
      index: true,
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

FileSchema.index({ customerId: 1, projectId: 1, createdAt: -1 });
FileSchema.index({ projectId: 1, approved: 1 });
FileSchema.index({ jobId: 1, createdAt: -1 });
FileSchema.index({ productionId: 1, createdAt: -1 });

export default mongoose.models.File || mongoose.model("File", FileSchema);
