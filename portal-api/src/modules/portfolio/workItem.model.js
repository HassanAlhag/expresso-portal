import mongoose from "mongoose";
import { WORK_STATUSES, WORK_TYPE_KEYS } from "./workItem.constants.js";

// Public Portfolio: a lightweight record of visual work (a website, a social
// account, a video...). It is deliberately not a case study: no challenge,
// solution or outcome narrative. When a deeper story exists, `caseStudy`
// points at the existing case-study record (the Portfolio model, served at
// /case-studies), which this record never modifies.

const ImageSchema = new mongoose.Schema(
  {
    src: { type: String, default: "", trim: true },
    alt: { type: String, default: "", trim: true, maxlength: 200 },
    media: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
  },
  { _id: false }
);

const VideoSchema = new mongoose.Schema(
  {
    src: { type: String, default: "", trim: true },
    poster: { type: String, default: "", trim: true },
    title: { type: String, default: "", trim: true, maxlength: 120 },
    media: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
  },
  { _id: false }
);

const WorkItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    clientName: { type: String, default: "", trim: true, maxlength: 140 },
    workType: { type: String, enum: WORK_TYPE_KEYS, required: true, index: true },
    industry: { type: String, default: "", trim: true, maxlength: 80 },
    year: { type: Number, default: null, min: 1990, max: 2100 },
    shortDescription: { type: String, default: "", trim: true, maxlength: 320 },

    cover: {
      src: { type: String, default: "", trim: true },
      alt: { type: String, default: "", trim: true, maxlength: 200 },
      media: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    },
    gallery: { type: [ImageSchema], default: [] },
    // Videos or reels: Media Library videos, or https links to hosted videos.
    // Deliberately not linked to operational Jobs/Productions.
    videos: { type: [VideoSchema], default: [] },
    // Legacy single video (items saved before `videos` existed). Read as the
    // first video until the item is saved again; new saves clear it.
    video: {
      src: { type: String, default: "", trim: true },
      poster: { type: String, default: "", trim: true },
      media: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    },

    services: { type: [String], default: [] },
    technologies: { type: [String], default: [] },

    featured: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    status: { type: String, enum: WORK_STATUSES, default: "draft", index: true },
    publishedAt: { type: Date, default: null },

    caseStudy: { type: mongoose.Schema.Types.ObjectId, ref: "Portfolio", default: null },

    seo: {
      metaTitle: { type: String, default: "", trim: true, maxlength: 120 },
      metaDesc: { type: String, default: "", trim: true, maxlength: 320 },
    },
  },
  { timestamps: true }
);

export default mongoose.model("WorkItem", WorkItemSchema);
