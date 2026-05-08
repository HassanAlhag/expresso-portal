import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, maxlength: 120 },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: "client",
      index: true,
    },

    isActive: { type: Boolean, default: true, index: true },

    jobTitle: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    team: { type: String, trim: true, default: "", index: true },

    avatarUrl: { type: String, trim: true, default: "" },
    avatarMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    notes: { type: String, trim: true, default: "" },

    /** Per-user permission grants on top of the role's permission set. */
    extraPermissions: { type: [String], default: [] },

    /** Per-user permission revocations that override the role's permission set. */
    revokedPermissions: { type: [String], default: [] },

    passwordHash: { type: String, required: true, select: false },

    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ team: 1 });
UserSchema.index({ role: 1 });

UserSchema.statics.hashPassword = async function (plain) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(String(plain), salt);
};

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(
    String(candidate || ""),
    String(this.passwordHash || "")
  );
};

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
