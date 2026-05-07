import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    permissions: {
      type: [String],
      default: [],
    },

    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

RoleSchema.index({ key: 1 }, { unique: true });

const Role = mongoose.models.Role || mongoose.model("Role", RoleSchema);
export default Role;
