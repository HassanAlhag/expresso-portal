import mongoose from "mongoose";
import Role from "./role.model.js";
import User from "../users/user.model.js";
import { validateCreateRole, validateUpdateRole } from "./role.validators.js";
import {
  DEFAULT_ROLE_PERMISSIONS,
  VALID_PERMISSION_KEYS,
} from "../../../config/permissions.js";
import { externalDeniedIn, isSystemInternalRole } from "../../../utils/roleRegistry.js";
import { logAudit } from "../audit/audit.service.js";

// Roles only a super admin may edit.
const PROTECTED_ROLE_KEYS = new Set(["super_admin", "admin"]);

function defaultIsInternal(key) {
  return key === "super_admin" || isSystemInternalRole(key);
}

function withInternalFlag(role) {
  if (!role) return role;
  return {
    ...role,
    isInternal:
      typeof role.isInternal === "boolean"
        ? role.isInternal
        : role.isSystem || DEFAULT_ROLE_PERMISSIONS[role.key]
          ? defaultIsInternal(role.key)
          : false,
  };
}

/**
 * Permissions in `requested` that the acting user does not hold themselves.
 * A non-super-admin cannot hand out access they do not have (audit S4).
 */
function permissionsBeyondActor(req, requested = []) {
  if (req.user?.role === "super_admin") return [];
  const held = new Set(req.user?.permissions || []);
  return requested.filter((p) => !held.has(p));
}

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
        isInternal: defaultIsInternal(key),
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

// A stored role's permission list is authoritative, including an explicit
// empty list (no access). Defaults are shown only when nothing is stored.
// Mirrors resolveRoleContext in utils/roleRegistry.js.
function normalizeRolePermissions(role) {
  if (!role) return role;
  if (!Array.isArray(role.permissions)) {
    return withInternalFlag({ ...role, permissions: DEFAULT_ROLE_PERMISSIONS[role.key] || [] });
  }
  const valid = role.permissions.filter((permission) => VALID_PERMISSION_KEYS.has(permission));
  return withInternalFlag({ ...role, permissions: valid });
}

/** 400 body when an external role is given permissions external users may never hold. */
function externalDeniedResponse(denied) {
  return {
    ok: false,
    message: "Client and vendor roles cannot hold these permissions",
    denied,
  };
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
            isInternal: defaultIsInternal(key),
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
    const rawKey = String(req.body?.key || "").trim().toLowerCase();
    const systemKey = Boolean(DEFAULT_ROLE_PERMISSIONS[rawKey]);
    const parsed = validateCreateRole(req.body || {}, { systemKey });
    if (!parsed.ok) {
      return res.status(400).json({ ok: false, message: parsed.message });
    }

    const { key, label, description, permissions } = parsed.value;
    // Persisting a default system role keeps its fixed classification.
    const isInternal = systemKey ? defaultIsInternal(key) : parsed.value.isInternal;

    if (PROTECTED_ROLE_KEYS.has(key) && req.user?.role !== "super_admin") {
      return res
        .status(403)
        .json({ ok: false, message: "Only a super admin can edit this role" });
    }

    const beyond = permissionsBeyondActor(req, permissions);
    if (beyond.length > 0) {
      return res.status(403).json({
        ok: false,
        message: "You cannot grant permissions you do not hold",
        missing: beyond,
      });
    }

    if (isInternal === false) {
      const denied = externalDeniedIn(permissions || []);
      if (denied.length > 0) return res.status(400).json(externalDeniedResponse(denied));
    }

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
      isInternal,
      isSystem: systemKey,
    });

    await logAudit(req, {
      action: "role.created",
      meta: { key, isInternal, permissions },
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

    if (PROTECTED_ROLE_KEYS.has(target.key) && req.user?.role !== "super_admin") {
      return res
        .status(403)
        .json({ ok: false, message: "Only a super admin can edit this role" });
    }

    if (
      "isInternal" in patch &&
      (target.isSystem || DEFAULT_ROLE_PERMISSIONS[target.key]) &&
      patch.isInternal !== defaultIsInternal(target.key)
    ) {
      return res.status(403).json({
        ok: false,
        message: "A system role cannot change between internal and external",
      });
    }

    if ("permissions" in patch) {
      const current = new Set(target.permissions || []);
      const added = patch.permissions.filter((p) => !current.has(p));
      const beyond = permissionsBeyondActor(req, added);
      if (beyond.length > 0) {
        return res.status(403).json({
          ok: false,
          message: "You cannot grant permissions you do not hold",
          missing: beyond,
        });
      }
    }

    // External (client/vendor) roles can never be given internal-only
    // permissions. Newly added keys are refused; when a role becomes external,
    // its whole resulting permission list is checked.
    const wasInternal = withInternalFlag(target).isInternal;
    const willBeInternal = "isInternal" in patch ? patch.isInternal : wasInternal;
    if (willBeInternal === false) {
      const resulting = "permissions" in patch ? patch.permissions : target.permissions || [];
      const toCheck =
        wasInternal === false
          ? resulting.filter((p) => !(target.permissions || []).includes(p))
          : resulting;
      const denied = externalDeniedIn(toCheck);
      if (denied.length > 0) return res.status(400).json(externalDeniedResponse(denied));
    }

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

    const before = new Set(target.permissions || []);
    const after = new Set(item?.permissions || []);
    await logAudit(req, {
      action: "role.updated",
      meta: {
        key: target.key,
        added: [...after].filter((p) => !before.has(p)),
        removed: [...before].filter((p) => !after.has(p)),
        isInternal: item?.isInternal,
        fields: Object.keys(patch),
      },
    });

    return res.json({ ok: true, item: withInternalFlag(item) });
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
    await logAudit(req, { action: "role.deleted", meta: { key: role.key } });

    return res.json({ ok: true, message: "Role deleted" });
  } catch (err) {
    console.error("deleteRole error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
