import mongoose from "mongoose";
import ProcurementVendor from "./vendor.model.js";
import ProcurementRequest from "./request.model.js";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/procurement/vendors
export async function listVendors(req, res) {
  try {
    const { q = "", categoryId = "", isActive = "", page = "1", limit = "20" } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};

    if (isActive !== "") filter.isActive = String(isActive) === "true";

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      filter.categories = categoryId;
    }

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { name: rx },
        { email: rx },
        { contactPerson: rx },
        { country: rx },
        { phone: rx },
      ];
    }

    const [total, items] = await Promise.all([
      ProcurementVendor.countDocuments(filter),
      ProcurementVendor.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("categories", "name slug")
        .lean(),
    ]);

    return res.json({
      ok: true,
      items,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      total,
      limit: limitNum,
    });
  } catch (e) {
    console.error("listVendors:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// GET /api/procurement/vendors/:id
export async function getVendor(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await ProcurementVendor.findById(id)
      .populate("categories", "name slug")
      .lean();

    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getVendor:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// POST /api/procurement/vendors
export async function createVendor(req, res) {
  try {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    if (!name) {
      return res.status(400).json({ ok: false, message: "name is required" });
    }

    const categories = Array.isArray(body.categories)
      ? body.categories.filter((id) => mongoose.Types.ObjectId.isValid(id))
      : [];

    const doc = await ProcurementVendor.create({
      name,
      website: String(body.website || "").trim(),
      email: String(body.email || "").trim().toLowerCase(),
      phone: String(body.phone || "").trim(),
      contactPerson: String(body.contactPerson || "").trim(),
      country: String(body.country || "UAE").trim(),
      categories,
      notes: String(body.notes || "").trim(),
      isActive: body.isActive !== false,
    });

    const populated = await doc.populate("categories", "name slug");
    return res.status(201).json({ ok: true, item: populated });
  } catch (e) {
    console.error("createVendor:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// PATCH /api/procurement/vendors/:id
export async function updateVendor(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const body = req.body || {};
    const patch = {};

    if (typeof body.name !== "undefined") patch.name = String(body.name || "").trim();
    if (typeof body.website !== "undefined") patch.website = String(body.website || "").trim();
    if (typeof body.email !== "undefined") patch.email = String(body.email || "").trim().toLowerCase();
    if (typeof body.phone !== "undefined") patch.phone = String(body.phone || "").trim();
    if (typeof body.contactPerson !== "undefined") patch.contactPerson = String(body.contactPerson || "").trim();
    if (typeof body.country !== "undefined") patch.country = String(body.country || "").trim();
    if (typeof body.notes !== "undefined") patch.notes = String(body.notes || "").trim();
    if (typeof body.isActive !== "undefined") patch.isActive = Boolean(body.isActive);
    if (Array.isArray(body.categories)) {
      patch.categories = body.categories.filter((cid) => mongoose.Types.ObjectId.isValid(cid));
    }

    const item = await ProcurementVendor.findByIdAndUpdate(id, patch, { new: true })
      .populate("categories", "name slug")
      .lean();

    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateVendor:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// DELETE /api/procurement/vendors/:id
export async function deleteVendor(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const count = await ProcurementRequest.countDocuments({ vendorId: id });
    if (count > 0) {
      return res.status(400).json({
        ok: false,
        message: "Cannot delete: vendor has active requests.",
      });
    }

    const item = await ProcurementVendor.findByIdAndDelete(id).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("deleteVendor:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}
