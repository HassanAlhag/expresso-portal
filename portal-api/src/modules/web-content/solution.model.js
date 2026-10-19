import mongoose from "mongoose";

const SolutionSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    subtitle: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    slug: { type: String, trim: true, required: true, unique: true, index: true },
    icon: { type: String, trim: true, default: "software" },
    heroImageUrl: { type: String, trim: true, default: "" },
    heroImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    blocks: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Classification (approved Oct 2026):
    //   technology = enterprise/third-party technology Expresso supplies,
    //                implements or supports (Technology Solutions)
    //   digital    = software/products built and owned by Expresso
    //                (Digital Solutions, e.g. CAS)
    // Documents created before this field existed are technology solutions.
    kind: {
      type: String,
      enum: ["technology", "digital"],
      default: "technology",
      index: true,
    },
    ownership: { type: String, enum: ["expresso", "partner"], default: "partner" },
    tagline: { type: String, trim: true, default: "" }, // one line for cards and menus
    badge: { type: String, trim: true, default: "" }, // e.g. "Built by Expresso"
    ctaLabel: { type: String, trim: true, default: "" }, // e.g. "Explore CAS"
    demoCtaLabel: { type: String, trim: true, default: "" },
    demoCtaHref: { type: String, trim: true, default: "" },
    // A bespoke page in the website code (e.g. "cas"); empty = generic page from blocks.
    customPage: { type: String, trim: true, default: "" },
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
