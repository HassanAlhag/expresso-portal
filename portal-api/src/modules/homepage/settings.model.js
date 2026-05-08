import mongoose from "mongoose";

function imgField() {
  return {
    url:     { type: String, default: "" },
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
  };
}

const siteSettingsSchema = new mongoose.Schema(
  {
    // One singleton document – always upserted with _id: "site"
    _id: { type: String, default: "site" },

    branding: {
      logoUrl:        { type: String, default: "" },
      logoMediaId:    { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
      logoWhiteUrl:   { type: String, default: "" },
      logoWhiteMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
      faviconUrl:     { type: String, default: "" },
      faviconMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
      ogImageUrl:     { type: String, default: "" },
      ogImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    },

    home: {
      heroVideoUrl:    { type: String, default: "" },
      heroBannerUrl:   { type: String, default: "" },
      heroBannerMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    },

    about: {
      heroImageUrl:    { type: String, default: "" },
      heroImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
      teamPhotoUrl:    { type: String, default: "" },
      teamPhotoMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
      missionImageUrl:  { type: String, default: "" },
      missionImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    },

    services: {
      heroImageUrl:    { type: String, default: "" },
      heroImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
      sectionBgUrl:    { type: String, default: "" },
      sectionBgMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    },

    portfolio: {
      heroImageUrl:    { type: String, default: "" },
      heroImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    },

    careers: {
      heroImageUrl:    { type: String, default: "" },
      heroImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
      officeImageUrl:  { type: String, default: "" },
      officeImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    },

    contact: {
      heroImageUrl:    { type: String, default: "" },
      heroImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
      officeImageUrl:  { type: String, default: "" },
      officeImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    },

    // Homepage draggable gallery (up to 8 images)
    gallery: {
      images: [
        {
          url:     { type: String, default: "" },
          mediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
          alt:     { type: String, default: "" },
        },
      ],
    },

    // Scrolling marquee brand strip (up to 10 brands)
    marquee: {
      brands: [
        {
          label:    { type: String, default: "" },
          imageUrl: { type: String, default: "" },
          mediaId:  { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
        },
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model("SiteSettings", siteSettingsSchema);
