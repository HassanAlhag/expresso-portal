import mongoose from "mongoose";
import Role from "./role.model.js";
import User from "../users/user.model.js";
import { validateCreateRole, validateUpdateRole } from "./role.validators.js";
import {
  DEFAULT_ROLE_PERMISSIONS,
  VALID_PERMISSION_KEYS,
} from "../../../config/permissions.js";

const SYSTEM_ROLE_META = {
  super_admin: ["Super Admin", "Full system control"],
  admin: ["Admin", "Administrative access except super admin control"],
  operations_manager: ["Admin / Operations Manager", "Daily operations, client work, delivery, and operational reporting"],
  finance: ["Finance", "Invoices, payments, expenses, and finance reports"],
  procurement_manager: ["Procurement Manager", "Procurement approvals, supplier control, quotations, and purchase status"],
  procurement_officer: ["Procurement Officer", "Procurement handling with limited approval authority"],
  project_manager: ["Project Manager", "Project execution, task assignment, deliverables, and client updates"],
  staff: ["Staff", "Operational team access"],
  hr_management: ["HR / Management", "Staff performance, HR workflows, and internal productivity reports"],
  staff_client: ["Staff Client", "External client access for projects, tickets, deliverables, reports, and files"],
  procurement_client: ["Procurement Client", "External client access for procurement requests and approved procurement files"],
  client_admin: ["Client Admin", "Main client-side contact with combined client project and procurement access"],
  client: ["Client", "Client portal access"],
  vendor: ["Vendor", "External vendor access for RFQs and support"],
};

function synthesizeMissingSystemRoles(items, q) {
  const existing = new Set(items.map((item) => item.key));
  const needle = String(q || "").trim().toLowerCase();

  const synthetic = Object.entries(DEFAULT_ROLE_PERMISSIONS)
    .filter(([key]) => !existing.has(key))
    .map(([key, permissions]) => {
      const [label, description] = SYSTEM_ROLE_META[key] || [key, ""];
      return {
        _id: key,
        key,
        label,
        description,
        permissions,
        isSystem: true,
        synthetic: true,
      };
    })
    .filter((item) => {
      if (!needle) return true;
      return [item.key, item.label, item.description]
        .some((value) => String(value || "").toLowerCase().includes(needle));
    });

  return [...items, ...synthetic];
}

function normalizeRolePermissions(role) {
  if (!role) return role;
  const defaults = DEFAULT_ROLE_PERMISSIONS[role.key];
  const valid = Array.isArray(role.permissions)
    ? role.permissions.filter((permission) => VALID_PERMISSION_KEYS.has(permission))
    : [];

  if (defaults && valid.length === 0) {
    return { ...role, permissions: defaults };
  }

  return { ...role, permissions: valid };
}

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

    const [storedTotal, storedItems] = await Promise.all([
      Role.countDocuments(filter),
      Role.find(filter)
        .sort(safeSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);
    const normalizedItems = storedItems.map(normalizeRolePermissions);
    const items = synthesizeMissingSystemRoles(normalizedItems, q);
    const total = filter.$or ? items.length : Math.max(storedTotal, items.length);

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
      const key = String(id || "").trim().toLowerCase();
      if (DEFAULT_ROLE_PERMISSIONS[key]) {
        const [label, description] = SYSTEM_ROLE_META[key] || [key, ""];
        return res.json({
          ok: true,
          item: {
            _id: key,
            key,
            label,
            description,
            permissions: DEFAULT_ROLE_PERMISSIONS[key],
            isSystem: true,
            synthetic: true,
          },
        });
      }
      return res.status(404).json({ ok: false, message: "Role not found" });
    }

    return res.json({ ok: true, item: normalizeRolePermissions(item) });
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
