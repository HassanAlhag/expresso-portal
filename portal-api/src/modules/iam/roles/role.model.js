import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
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

    /**
     * true  = Expresso team role (sees all clients' records)
     * false = external role (client / vendor); limited to own clientId and
     *         never granted internal-only permissions.
     * Unset on older documents: system roles fall back to the code registry,
     * custom roles are treated as external until an admin sets this.
     */
    isInternal: {
      type: Boolean,
    },

    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

const Role = mongoose.models.Role || mongoose.model("Role", RoleSchema);
export default Role;
