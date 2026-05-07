import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema(
  {
    careerId:    { type: mongoose.Schema.Types.ObjectId, ref: "Career", required: true, index: true },
    fullName:    { type: String, required: true, trim: true },
    email:       { type: String, required: true, trim: true, lowercase: true },
    phone:       { type: String, trim: true, default: "" },
    coverLetter: { type: String, trim: true, default: "" },
    cvUrl:       { type: String, trim: true, default: "" },
    cvMediaId:   { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    status: {
      type: String,
      enum: ["new", "reviewing", "interview", "rejected", "hired"],
      default: "new",
      index: true,
    },
    notes:     { type: String, trim: true, default: "" },
    reviewedBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

ApplicationSchema.index({ careerId: 1, status: 1 });

export default mongoose.models.JobApplication || mongoose.model("JobApplication", ApplicationSchema);
