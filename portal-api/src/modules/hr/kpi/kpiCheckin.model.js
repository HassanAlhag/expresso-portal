import mongoose from "mongoose";

const KPICheckinSchema = new mongoose.Schema(
  {
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: "KPIGoal", required: true, index: true },
    date: { type: Date, required: true },
    value: { type: Number, required: true },
    notes: { type: String, trim: true, default: "" },
    source: { type: String, enum: ["manual", "auto"], default: "manual" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

KPICheckinSchema.index({ goalId: 1, date: -1 });

export default mongoose.models.KPICheckin || mongoose.model("KPICheckin", KPICheckinSchema);
