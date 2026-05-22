import SocialMetrics, { SOCIAL_PLATFORMS } from "./socialMetrics.model.js";
import mongoose from "mongoose";

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

export async function listMetrics(req, res) {
  try {
    const { customerId = "", period = "", platform = "" } = req.query;
    const filter = {};
    if (validId(customerId)) filter.customerId = customerId;
    if (period) filter.period = String(period).trim();
    if (platform && SOCIAL_PLATFORMS.includes(platform)) filter.platform = platform;

    const items = await SocialMetrics.find(filter)
      .populate("customerId", "companyName contactName")
      .sort({ period: -1, platform: 1 })
      .lean();

    return res.json({ ok: true, items });
  } catch (e) {
    console.error("listMetrics:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function upsertMetrics(req, res) {
  try {
    const {
      customerId, platform = "overall", period,
      reach = 0, impressions = 0, engagementRate = 0,
      likes = 0, comments = 0, shares = 0, saves = 0,
      followerCount = 0, newFollowers = 0, postsPublished = 0,
      notes = "",
    } = req.body || {};

    if (!validId(customerId)) {
      return res.status(400).json({ ok: false, message: "Invalid customerId" });
    }
    if (!period) {
      return res.status(400).json({ ok: false, message: "period is required (YYYY-MM)" });
    }

    const item = await SocialMetrics.findOneAndUpdate(
      { customerId, platform, period },
      {
        $set: {
          reach: Number(reach) || 0,
          impressions: Number(impressions) || 0,
          engagementRate: Number(engagementRate) || 0,
          likes: Number(likes) || 0,
          comments: Number(comments) || 0,
          shares: Number(shares) || 0,
          saves: Number(saves) || 0,
          followerCount: Number(followerCount) || 0,
          newFollowers: Number(newFollowers) || 0,
          postsPublished: Number(postsPublished) || 0,
          notes: String(notes || ""),
          updatedBy: req.user?.id || null,
        },
        $setOnInsert: { createdBy: req.user?.id || null },
      },
      { upsert: true, new: true }
    ).lean();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("upsertMetrics:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteMetrics(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    await SocialMetrics.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteMetrics:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
