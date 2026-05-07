import mongoose from "mongoose";
import ProcurementCategory from "./category.model.js";
import ProcurementRequest from "./request.model.js";

const SORT = { order: 1, createdAt: -1 };

// GET /api/procurement/categories/public — no auth (flat list)
export async function listPublicCategories(req, res) {
  try {
    const items = await ProcurementCategory.find({ isActive: true })
      .sort(SORT)
      .lean();
    return res.json({ ok: true, items });
  } catch (e) {
    console.error("listPublicCategories:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// GET /api/procurement/categories/tree — no auth (nested 3-level tree)
export async function getCategoryTree(req, res) {
  try {
    const all = await ProcurementCategory.find({ isActive: true })
      .sort({ level: 1, order: 1 })
      .lean();

    const byId = {};
    all.forEach((c) => { byId[String(c._id)] = { ...c, children: [] }; });

    const roots = [];
    all.forEach((c) => {
      const node = byId[String(c._id)];
      if (!c.parentId) {
        roots.push(node);
      } else {
        const parent = byId[String(c.parentId)];
        if (parent) parent.children.push(node);
      }
    });

    return res.json({ ok: true, tree: roots });
  } catch (e) {
    console.error("getCategoryTree:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// GET /api/procurement/categories — admin
export async function listCategories(req, res) {
  try {
    const items = await ProcurementCategory.find({}).sort(SORT).lean();
    return res.json({ ok: true, items });
  } catch (e) {
    console.error("listCategories:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// POST /api/procurement/categories — admin
export async function createCategory(req, res) {
  try {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    if (!name) {
      return res.status(400).json({ ok: false, message: "name is required" });
    }

    const doc = await ProcurementCategory.create({
      name,
      slug: String(body.slug || "").trim().toLowerCase() || undefined,
      subtitle: String(body.subtitle || "").trim(),
      description: String(body.description || "").trim(),
      icon: String(body.icon || "").trim(),
      isActive: body.isActive !== false,
      order: body.order != null ? Number(body.order) : 0,
    });

    return res.status(201).json({ ok: true, item: doc });
  } catch (e) {
    console.error("createCategory:", e);
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: "Slug already exists" });
    }
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// PATCH /api/procurement/categories/:id — admin
export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const body = req.body || {};
    const patch = {};

    if (typeof body.name !== "undefined") patch.name = String(body.name || "").trim();
    if (typeof body.slug !== "undefined") patch.slug = String(body.slug || "").trim().toLowerCase();
    if (typeof body.subtitle !== "undefined") patch.subtitle = String(body.subtitle || "").trim();
    if (typeof body.description !== "undefined") patch.description = String(body.description || "").trim();
    if (typeof body.icon !== "undefined") patch.icon = String(body.icon || "").trim();
    if (typeof body.isActive !== "undefined") patch.isActive = Boolean(body.isActive);
    if (typeof body.order !== "undefined") patch.order = Number(body.order);

    const item = await ProcurementCategory.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateCategory:", e);
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: "Slug already exists" });
    }
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// DELETE /api/procurement/categories/:id — admin
export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const count = await ProcurementRequest.countDocuments({ categoryId: id });
    if (count > 0) {
      return res.status(400).json({
        ok: false,
        message: "Cannot delete: category has active requests.",
      });
    }

    const item = await ProcurementCategory.findByIdAndDelete(id).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("deleteCategory:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}
