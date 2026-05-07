import mongoose from "mongoose";

const AuditSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorEmail: { type: String, default: "" },

    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    action: { type: String, required: true, index: true }, // e.g. "user.created"
    meta: { type: Object, default: {} },

    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

AuditSchema.index({ targetUserId: 1, createdAt: -1 });

export default mongoose.models.Audit || mongoose.model("Audit", AuditSchema);
