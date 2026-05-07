import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    excerpt: { type: String, default: "", trim: true, maxlength: 240 },
    description: { type: String, default: "" },

    coverMedia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    gallery: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Media",
      default: [],
    },

    tags: { type: [String], default: [], index: true },
    category: { type: String, default: "", index: true },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date, default: null },

    seo: {
      metaTitle: { type: String, default: "" },
      metaDesc: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

PortfolioSchema.index({
  title: "text",
  excerpt: "text",
  description: "text",
  tags: "text",
});

export default mongoose.model("Portfolio", PortfolioSchema);
