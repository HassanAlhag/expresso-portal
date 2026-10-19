import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../users/user.model.js";
import { signToken } from "../../../utils/jwt.js";
import { resolveRoleContext } from "../../../utils/roleRegistry.js";
import { sendMail } from "../../../utils/email.js";
import { env } from "../../../config/env.js";

let _googleClient = null;
function getGoogleClient() {
  if (!env.googleClientId) return null;
  if (!_googleClient) _googleClient = new OAuth2Client(env.googleClientId);
  return _googleClient;
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildTokenPayload(user) {
  return { id: user._id.toString(), role: user.role };
}

function buildUserPayload(user, permissions = [], isInternal = false) {
  return {
    _id:               user._id,
    fullName:          user.fullName,
    email:             user.email,
    role:              user.role,
    isActive:          user.isActive,
    clientId:          user.clientId || null,
    lastLoginAt:       user.lastLoginAt,
    avatarUrl:         user.avatarUrl || "",
    avatarMediaId:     user.avatarMediaId || null,
    team:              user.team || "",
    jobTitle:          user.jobTitle || "",
    phone:             user.phone || "",
    permissions,
    isInternal,
    extraPermissions:  user.extraPermissions  || [],
    revokedPermissions: user.revokedPermissions || [],
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
      "+passwordHash fullName email role isActive clientId lastLoginAt avatarUrl avatarMediaId team jobTitle phone notes extraPermissions revokedPermissions createdAt updatedAt"
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

    const { permissions, isInternal } = await resolveRoleContext(
      user.role,
      user.extraPermissions || [],
      user.revokedPermissions || []
    );

    return res.json({
      ok: true,
      token: signToken(buildTokenPayload(user)),
      user: buildUserPayload(user, permissions, isInternal),
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
}

const GOOGLE_NOT_CONFIGURED = {
  ok: false,
  code: "NOT_CONFIGURED",
  message: "Google sign-in is not available right now.",
};

const GOOGLE_VERIFICATION_FAILED = {
  ok: false,
  code: "GOOGLE_VERIFICATION_FAILED",
  message: "Google sign-in failed. Please try again or use your email and password.",
};

// A single neutral response for "no eligible portal account" — covers both
// "no User with this email" and "User exists but is inactive" so the
// endpoint cannot be used to enumerate which emails have portal accounts.
const GOOGLE_NO_PORTAL_ACCESS = {
  ok: false,
  code: "NO_PORTAL_ACCESS",
  message: "Portal access has not been activated for this Google account.",
};

export async function googleLogin(req, res) {
  try {
    const client = getGoogleClient();
    if (!client) {
      return res.status(501).json(GOOGLE_NOT_CONFIGURED);
    }

    const credential = String(req.body?.credential || "").trim();
    if (!credential) {
      return res.status(400).json({ ok: false, message: "Google credential is required" });
    }

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: env.googleClientId,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      // Covers invalid signature, expired token, and wrong audience —
      // google-auth-library rejects all of these inside verifyIdToken.
      // Never log the raw credential itself.
      console.warn("googleLogin: token verification failed:", verifyErr?.message);
      return res.status(401).json(GOOGLE_VERIFICATION_FAILED);
    }

    if (!payload || payload.email_verified !== true) {
      return res.status(401).json(GOOGLE_VERIFICATION_FAILED);
    }

    // Only the server-verified payload email is trusted from this point on
    // — nothing from req.body is used for the identity decision.
    const email = String(payload.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(401).json(GOOGLE_VERIFICATION_FAILED);
    }

    const user = await User.findOne({ email }).select(
      "fullName email role isActive clientId lastLoginAt avatarUrl avatarMediaId team jobTitle phone notes extraPermissions revokedPermissions createdAt updatedAt"
    );

    if (!user || user.isActive === false) {
      return res.status(403).json(GOOGLE_NO_PORTAL_ACCESS);
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const { permissions, isInternal } = await resolveRoleContext(
      user.role,
      user.extraPermissions || [],
      user.revokedPermissions || []
    );

    return res.json({
      ok: true,
      token: signToken(buildTokenPayload(user)),
      user: buildUserPayload(user, permissions, isInternal),
    });
  } catch (err) {
    console.error("googleLogin error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function me(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });

    const user = await User.findById(userId)
      .select("fullName email role isActive lastLoginAt createdAt updatedAt clientId avatarUrl avatarMediaId team jobTitle phone notes extraPermissions revokedPermissions")
      .lean();

    if (!user)          return res.status(401).json({ ok: false, message: "Unauthorized" });
    if (!user.isActive) return res.status(403).json({ ok: false, message: "Account is inactive" });

    // req.user.permissions is already resolved by requireAuth middleware
    return res.json({
      ok: true,
      user: buildUserPayload(user, req.user?.permissions || [], req.user?.isInternal === true),
    });
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

    user.passwordHash = await User.hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    await user.save();

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

const GENERIC_FORGOT_PASSWORD_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";

export async function forgotPassword(req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ ok: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (user && user.isActive) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordTokenHash = hashResetToken(rawToken);
      user.resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${env.frontendUrl}/portal/reset-password?token=${rawToken}`;

      await sendMail({
        to: user.email,
        subject: "Reset your Client Portal password",
        html: `
          <p>Hi ${user.fullName || ""},</p>
          <p>We received a request to reset your Client Portal password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    }

    // Always return the same generic response, whether or not the email
    // matched an account, so this endpoint cannot be used to enumerate users.
    return res.json({ ok: true, message: GENERIC_FORGOT_PASSWORD_MESSAGE });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function resetPassword(req, res) {
  try {
    const token = String(req.body.token || "").trim();
    const newPassword = String(req.body.newPassword || "");

    if (!token || !newPassword) {
      return res.status(400).json({ ok: false, message: "Token and newPassword are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ ok: false, message: "New password must be at least 8 characters" });
    }

    const tokenHash = hashResetToken(token);

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    }).select("+resetPasswordTokenHash +resetPasswordExpiresAt");

    if (!user) {
      return res.status(400).json({ ok: false, message: "This reset link is invalid or has expired" });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
