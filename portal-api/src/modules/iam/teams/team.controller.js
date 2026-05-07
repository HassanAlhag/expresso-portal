import mongoose from "mongoose";
import Team from "./team.model.js";
import User from "../users/user.model.js";
import { validateCreateTeam, validateUpdateTeam } from "./team.validators.js";

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

export async function listTeams(req, res) {
  try {
    const {
      q = "",
      isActive = "",
      sort = "label",
      page = "1",
      limit = "50",
    } = req.query || {};

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

    const filter = {};
    if (isActive !== "") filter.isActive = String(isActive) === "true";

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [{ key: rx }, { label: rx }, { description: rx }];
    }

    const [total, items] = await Promise.all([
      Team.countDocuments(filter),
      Team.find(filter)
        .populate("leadUserId", "fullName email")
        .sort(safeSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    const enriched = await Promise.all(
      items.map(async (team) => {
        const userCount = await User.countDocuments({ team: team.label });
        return { ...team, userCount };
      })
    );

    return res.json({
      ok: true,
      items: enriched,
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      limit: limitNum,
    });
  } catch (err) {
    console.error("listTeams error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getTeam(req, res) {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : {
          key: String(id || "")
            .trim()
            .toLowerCase(),
        };

    const item = await Team.findOne(query)
      .populate("leadUserId", "fullName email")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Team not found" });
    }

    const userCount = await User.countDocuments({ team: item.label });

    return res.json({ ok: true, item: { ...item, userCount } });
  } catch (err) {
    console.error("getTeam error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createTeam(req, res) {
  try {
    const parsed = validateCreateTeam(req.body || {});
    if (!parsed.ok) {
      return res.status(400).json({ ok: false, message: parsed.message });
    }

    const { key, label, description, isActive, leadUserId } = parsed.value;

    const exists = await Team.findOne({ key }).lean();
    if (exists) {
      return res
        .status(409)
        .json({ ok: false, message: "Team key already exists" });
    }

    const item = await Team.create({
      key,
      label,
      description,
      isActive,
      leadUserId:
        leadUserId && mongoose.Types.ObjectId.isValid(leadUserId)
          ? leadUserId
          : null,
    });

    return res.status(201).json({ ok: true, item });
  } catch (err) {
    console.error("createTeam error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateTeam(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid team id" });
    }

    const target = await Team.findById(id).lean();
    if (!target) {
      return res.status(404).json({ ok: false, message: "Team not found" });
    }

    const parsed = validateUpdateTeam(req.body || {});
    if (!parsed.ok) {
      return res.status(400).json({ ok: false, message: parsed.message });
    }

    const patch = { ...parsed.value };

    if ("key" in patch && patch.key !== target.key) {
      const exists = await Team.findOne({
        key: patch.key,
        _id: { $ne: id },
      }).lean();

      if (exists) {
        return res
          .status(409)
          .json({ ok: false, message: "Team key already exists" });
      }
    }

    if ("leadUserId" in patch) {
      patch.leadUserId =
        patch.leadUserId && mongoose.Types.ObjectId.isValid(patch.leadUserId)
          ? patch.leadUserId
          : null;
    }

    const item = await Team.findByIdAndUpdate(id, patch, {
      new: true,
    })
      .populate("leadUserId", "fullName email")
      .lean();

    return res.json({ ok: true, item });
  } catch (err) {
    console.error("updateTeam error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function setTeamStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid team id" });
    }

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ ok: false, message: "isActive must be boolean" });
    }

    const item = await Team.findByIdAndUpdate(id, { isActive }, { new: true })
      .populate("leadUserId", "fullName email")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Team not found" });
    }

    return res.json({ ok: true, item });
  } catch (err) {
    console.error("setTeamStatus error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
