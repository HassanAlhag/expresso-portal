import mongoose from "mongoose";

const DigitalServiceSchema = new mongoose.Schema(
  {
    // Card fields (serviceMain.jsx overview)
    title: { type: String, trim: true, required: true },
    tag: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    imageUrl: { type: String, trim: true, default: "" },
    imageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },

    // Routing
    slug: { type: String, trim: true, unique: true, sparse: true, index: true },

    // Hero/banner for the detail page
    heroHeading: { type: String, trim: true, default: "" },
    heroSubheading: { type: String, trim: true, default: "" },
    heroImageUrl: { type: String, trim: true, default: "" },
    heroImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    heroCtaText: { type: String, trim: true, default: "Get Started" },
    heroCtaLink: { type: String, trim: true, default: "/contact-us" },

    // Detail page content blocks
    // Block types: intro | webSolutions | steps | process | faq
    blocks: { type: mongoose.Schema.Types.Mixed, default: [] },

    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

DigitalServiceSchema.index({ isActive: 1, order: 1 });

export default mongoose.models.DigitalService ||
  mongoose.model("DigitalService", DigitalServiceSchema);
