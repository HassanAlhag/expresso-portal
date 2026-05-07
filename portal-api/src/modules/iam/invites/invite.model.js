import mongoose from "mongoose";

const InviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    fullName: {
      type: String,
      trim: true,
      default: "",
    },

    role: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    team: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "cancelled", "expired"],
      default: "pending",
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

InviteSchema.index({ email: 1, status: 1 });
InviteSchema.index({ token: 1 }, { unique: true });

const Invite = mongoose.models.Invite || mongoose.model("Invite", InviteSchema);
export default Invite;
