import mongoose from "mongoose";
import BrandAsset, { BRAND_ASSET_TYPES } from "./brandAsset.model.js";
import { canSeeAllTenantRecords } from "../../utils/accessControl.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function userId(req) {
  return req.user?.id || req.user?._id || null;
}

function userClientId(req) {
  return req.user?.clientId || null;
}

function normalizeAssetPayload(body = {}) {
  return {
    type: String(body.type || "").trim(),
    name: String(body.name || "").trim(),
    value: String(body.value || "").trim(),
    mediaId: validId(body.mediaId) ? body.mediaId : null,
    url: String(body.url || "").trim(),
    isPrimary: Boolean(body.isPrimary),
    notes: String(body.notes || "").trim(),
  };
}

async function clearPrimarySibling(asset) {
  if (!asset?.isPrimary || !asset?.customerId || !asset?.type) return;
  await BrandAsset.updateMany(
    {
      _id: { $ne: asset._id },
      customerId: asset.customerId,
      type: asset.type,
      isPrimary: true,
    },
    { $set: { isPrimary: false } }
  );
}

export async function listBrandAssets(req, res) {
  try {
    const { customerId = "", type = "" } = req.query;
    const filter = {};
    if (canSeeAllTenantRecords(req)) {
      if (customerId && validId(customerId)) filter.customerId = customerId;
    } else {
      const cid = userClientId(req);
      if (!cid) return res.json({ ok: true, items: [] });
      filter.customerId = cid;
    }
    if (type) filter.type = type;
    const items = await BrandAsset.find(filter)
      .populate("mediaId", "url thumbnailUrl filename mimeType")
      .sort({ type: 1, isPrimary: -1, createdAt: -1 });
    return res.json({ ok: true, items });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}

export async function createBrandAsset(req, res) {
  try {
    const uid = userId(req);
    if (!uid) return res.status(401).json({ ok: false, message: "Unauthorized" });

    const requestedCustomerId = req.body?.customerId;
    const customerId = canSeeAllTenantRecords(req)
      ? requestedCustomerId
      : userClientId(req);
    const payload = normalizeAssetPayload(req.body);

    if (!customerId || !validId(customerId)) {
      return res.status(400).json({ ok: false, message: "customerId required" });
    }
    if (!canSeeAllTenantRecords(req) && String(customerId) !== String(userClientId(req))) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    if (!payload.type || !payload.name) {
      return res.status(400).json({ ok: false, message: "type and name required" });
    }
    if (!BRAND_ASSET_TYPES.includes(payload.type)) {
      return res.status(400).json({ ok: false, message: "Invalid asset type" });
    }
    const asset = await BrandAsset.create({
      ...payload,
      customerId,
      createdBy: uid,
    });
    await clearPrimarySibling(asset);
    const populated = await asset.populate("mediaId", "url thumbnailUrl filename mimeType");
    return res.status(201).json({ ok: true, item: populated });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}

export async function updateBrandAsset(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const existing = await BrandAsset.findById(id).lean();
    if (!existing) return res.status(404).json({ ok: false, message: "Not found" });
    if (!canSeeAllTenantRecords(req) && String(existing.customerId) !== String(userClientId(req))) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const allowed = ["type", "name", "value", "mediaId", "url", "isPrimary", "notes"];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    if (updates.name !== undefined) updates.name = String(updates.name || "").trim();
    if (updates.type !== undefined) {
      updates.type = String(updates.type || "").trim();
      if (!BRAND_ASSET_TYPES.includes(updates.type)) {
        return res.status(400).json({ ok: false, message: "Invalid asset type" });
      }
    }
    if (updates.value !== undefined) updates.value = String(updates.value || "").trim();
    if (updates.url !== undefined) updates.url = String(updates.url || "").trim();
    if (updates.notes !== undefined) updates.notes = String(updates.notes || "").trim();
    if (updates.mediaId !== undefined) updates.mediaId = validId(updates.mediaId) ? updates.mediaId : null;
    if (updates.isPrimary !== undefined) updates.isPrimary = Boolean(updates.isPrimary);

    const asset = await BrandAsset.findByIdAndUpdate(id, updates, { new: true })
      .populate("mediaId", "url thumbnailUrl filename mimeType");
    if (!asset) return res.status(404).json({ ok: false, message: "Not found" });
    await clearPrimarySibling(asset);
    return res.json({ ok: true, item: asset });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}

export async function deleteBrandAsset(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const existing = await BrandAsset.findById(id).lean();
    if (!existing) return res.status(404).json({ ok: false, message: "Not found" });
    if (!canSeeAllTenantRecords(req) && String(existing.customerId) !== String(userClientId(req))) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    await BrandAsset.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}
