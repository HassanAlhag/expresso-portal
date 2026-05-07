import mongoose from "mongoose";

const ACTIVITY_TYPES = ["call", "email", "meeting", "note", "task", "whatsapp", "other"];
const ACTIVITY_STATUSES = ["pending", "done", "cancelled"];
const ENTITY_TYPES = ["lead", "deal", "account", "contact", "customer"];

const ActivitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ACTIVITY_TYPES,
      index: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    body: {
      type: String,
      trim: true,
      default: "",
    },

    outcome: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      default: "done",
      enum: ACTIVITY_STATUSES,
      index: true,
    },

    dueAt: {
      type: Date,
      default: null,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // Polymorphic link: which entity this activity belongs to
    entityType: {
      type: String,
      required: true,
      enum: ENTITY_TYPES,
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

ActivitySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
ActivitySchema.index({ assignedTo: 1, status: 1 });
ActivitySchema.index({ type: 1, status: 1 });

export default mongoose.models.CRMActivity ||
  mongoose.model("CRMActivity", ActivitySchema);
