import mongoose from "mongoose";
import Role from "./role.model.js";
import User from "../users/user.model.js";
import { validateCreateRole, validateUpdateRole } from "./role.validators.js";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeSort(sort) {
  const raw = String(sort || "label");
  const allowed = new Set([
    "createdAt",
    "-createdAt",
    "updatedAt",
    "-updatedAt",
    "key",
    "-key",
    "label",
    "-label",
  ]);

  if (!allowed.has(raw)) return { label: 1 };

  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}

// GET /api/roles?q&sort&page&limit
export async function listRoles(req, res) {
  try {
    const {
      q = "",
      sort = "label",
      page = "1",
      limit = "50",
    } = req.query || {};

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

    const filter = {};
    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [{ key: rx }, { label: rx }, { description: rx }];
    }

    const [total, items] = await Promise.all([
      Role.countDocuments(filter),
      Role.find(filter)
        .sort(safeSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    return res.json({
      ok: true,
      items,
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      limit: limitNum,
    });
  } catch (err) {
    console.error("listRoles error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /api/roles/:id
export async function getRole(req, res) {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : {
          key: String(id || "")
            .trim()
            .toLowerCase(),
        };

    const item = await Role.findOne(query).lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Role not found" });
    }

    return res.json({ ok: true, item });
  } catch (err) {
    console.error("getRole error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/roles
export async function createRole(req, res) {
  try {
    const parsed = validateCreateRole(req.body || {});
    if (!parsed.ok) {
      return res.status(400).json({ ok: false, message: parsed.message });
    }

    const { key, label, description, permissions } = parsed.value;

    const exists = await Role.findOne({ key }).lean();
    if (exists) {
      return res
        .status(409)
        .json({ ok: false, message: "Role key already exists" });
    }

    const item = await Role.create({
      key,
      label,
      description,
      permissions,
      isSystem: false,
    });

    return res.status(201).json({ ok: true, item });
  } catch (err) {
    console.error("createRole error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// PATCH /api/roles/:id
export async function updateRole(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid role id" });
    }

    const target = await Role.findById(id).lean();
    if (!target) {
      return res.status(404).json({ ok: false, message: "Role not found" });
    }

    const parsed = validateUpdateRole(req.body || {});
    if (!parsed.ok) {
      return res.status(400).json({ ok: false, message: parsed.message });
    }

    const patch = { ...parsed.value };

    if ("key" in patch && patch.key !== target.key) {
      if (target.isSystem) {
        return res
          .status(403)
          .json({ ok: false, message: "System role key cannot be changed" });
      }

      const exists = await Role.findOne({
        key: patch.key,
        _id: { $ne: id },
      }).lean();

      if (exists) {
        return res
          .status(409)
          .json({ ok: false, message: "Role key already exists" });
      }
    }

    if (target.isSystem && "key" in patch) {
      delete patch.key;
    }

    const item = await Role.findByIdAndUpdate(id, patch, {
      new: true,
    }).lean();

    return res.json({ ok: true, item });
  } catch (err) {
    console.error("updateRole error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// DELETE /api/roles/:id
export async function deleteRole(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid role id" });
    }

    const role = await Role.findById(id).lean();
    if (!role) {
      return res.status(404).json({ ok: false, message: "Role not found" });
    }

    if (role.isSystem) {
      return res
        .status(403)
        .json({ ok: false, message: "System roles cannot be deleted" });
    }

    const inUse = await User.countDocuments({ role: role.key });
    if (inUse > 0) {
      return res.status(409).json({
        ok: false,
        message: `Role is assigned to ${inUse} user(s) and cannot be deleted`,
      });
    }

    await Role.findByIdAndDelete(id);

    return res.json({ ok: true, message: "Role deleted" });
  } catch (err) {
    console.error("deleteRole error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
