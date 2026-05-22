import mongoose from "mongoose";

export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "linkedin",
  "youtube",
  "twitter",
  "snapchat",
  "overall",
];

const SocialMetricsSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    platform:   { type: String, enum: SOCIAL_PLATFORMS, default: "overall", index: true },
    period:     { type: String, required: true, trim: true, index: true }, // "2026-05"

    // Reach & exposure
    reach:       { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },

    // Engagement
    engagementRate: { type: Number, default: 0 }, // percentage e.g. 3.2
    likes:       { type: Number, default: 0 },
    comments:    { type: Number, default: 0 },
    shares:      { type: Number, default: 0 },
    saves:       { type: Number, default: 0 },

    // Followers
    followerCount: { type: Number, default: 0 },
    newFollowers:  { type: Number, default: 0 },

    // Content output
    postsPublished: { type: Number, default: 0 },

    notes: { type: String, trim: true, default: "" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

SocialMetricsSchema.index({ customerId: 1, platform: 1, period: -1 });

export default mongoose.models.SocialMetrics ||
  mongoose.model("SocialMetrics", SocialMetricsSchema);
