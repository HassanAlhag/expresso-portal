import mongoose from "mongoose";
import { TECHNOLOGY_GROUP_IDS } from "./technologyGroups.js";

const SolutionSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    subtitle: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    slug: { type: String, trim: true, required: true, unique: true, index: true },
    group: { type: String, enum: ["", ...TECHNOLOGY_GROUP_IDS], default: "" },
    icon: { type: String, trim: true, default: "software" },
    heroImageUrl: { type: String, trim: true, default: "" },
    heroImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    blocks: { type: mongoose.Schema.Types.Mixed, default: [] },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

SolutionSchema.index({ isActive: 1, order: 1 });

export default mongoose.models.Solution ||
  mongoose.model("Solution", SolutionSchema);
