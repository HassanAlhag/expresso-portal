import User from "../users/user.model.js";
import { signToken } from "../../../utils/jwt.js";

function buildTokenPayload(user) {
  return { id: user._id.toString(), role: user.role };
}

function buildUserPayload(user) {
  return {
    _id:          user._id,
    fullName:     user.fullName,
    email:        user.email,
    role:         user.role,
    isActive:     user.isActive,
    clientId:     user.clientId || null,
    lastLoginAt:  user.lastLoginAt,
    avatarUrl:    user.avatarUrl || "",
    avatarMediaId: user.avatarMediaId || null,
    team:         user.team || "",
    jobTitle:     user.jobTitle || "",
    phone:        user.phone || "",
    notes:        user.notes || "",
  };
}

export async function login(req, res) {
  try {
    const email    = String(req.body.email    || "").trim().toLowerCase();
    const password = String(req.body.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select(
      "+passwordHash fullName email role isActive clientId lastLoginAt avatarUrl avatarMediaId team jobTitle phone notes createdAt updatedAt"
    );

    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid email or password" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ ok: false, message: "Account is inactive" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ ok: false, message: "Invalid email or password" });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    return res.json({ ok: true, token: signToken(buildTokenPayload(user)), user: buildUserPayload(user) });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
}

export async function me(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });

    const user = await User.findById(userId)
      .select("fullName email role isActive lastLoginAt createdAt updatedAt clientId avatarUrl avatarMediaId team jobTitle phone notes")
      .lean();

    if (!user)              return res.status(401).json({ ok: false, message: "Unauthorized" });
    if (!user.isActive)     return res.status(403).json({ ok: false, message: "Account is inactive" });

    return res.json({ ok: true, user });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function changePassword(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ ok: false, message: "currentPassword and newPassword are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ ok: false, message: "New password must be at least 8 characters" });
    }

    const user = await User.findById(userId).select("+passwordHash");
    if (!user) return res.status(401).json({ ok: false, message: "Unauthorized" });

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(400).json({ ok: false, message: "Current password is incorrect" });
    }

    user.passwordHash = newPassword;
    await user.save();

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
