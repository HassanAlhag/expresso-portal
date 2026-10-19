import mongoose from "mongoose";

const AccessRequestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },

    workEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 190,
    },

    company: { type: String, required: true, trim: true, maxlength: 160 },
    phone: { type: String, trim: true, default: "", maxlength: 40 },
    message: { type: String, trim: true, default: "", maxlength: 1000 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "invited"],
      default: "pending",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },

    inviteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invite",
      default: null,
    },
  },
  { timestamps: true }
);

AccessRequestSchema.index({ workEmail: 1 });
AccessRequestSchema.index({ status: 1 });
AccessRequestSchema.index({ createdAt: -1 });

const AccessRequest =
  mongoose.models.AccessRequest ||
  mongoose.model("AccessRequest", AccessRequestSchema);

export default AccessRequest;
