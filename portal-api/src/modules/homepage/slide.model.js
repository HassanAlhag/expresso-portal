import mongoose from "mongoose";

const SlideSchema = new mongoose.Schema(
  {
    eyebrowLeft: {
      type: String,
      trim: true,
      default: "EXPRESSO DIGITAL",
    },

    eyebrowRight: {
      type: String,
      trim: true,
      default: "GROWTH SYSTEMS",
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    subtitle: {
      type: String,
      trim: true,
      default: "",
    },

    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    imageMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    thumbImageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    thumbImageMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    ctaLabel: {
      type: String,
      trim: true,
      default: "Explore Services",
    },

    ctaUrl: {
      type: String,
      trim: true,
      default: "/services",
    },

    secondaryCtaLabel: {
      type: String,
      trim: true,
      default: "Talk to Us",
    },

    secondaryCtaUrl: {
      type: String,
      trim: true,
      default: "/contact-us",
    },

    order: {
      type: Number,
      default: 0,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
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

SlideSchema.index({ isActive: 1, order: 1 });

export default mongoose.models.HeroSlide ||
  mongoose.model("HeroSlide", SlideSchema);
