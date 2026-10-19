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

    // SHA-256 hash of the raw invite token. Only the raw token (sent via
    // email) can be used to accept the invite — the hash alone is useless
    // to whoever has DB access, same approach as User.resetPasswordTokenHash.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
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

    // Company/client this invite is pre-associated with, carried over to
    // User.clientId when the invite is accepted. Optional — internal
    // (non-client) roles are not tied to a Customer.
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    // Set when this invite originated from an approved AccessRequest.
    accessRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccessRequest",
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    acceptedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

const Invite = mongoose.models.Invite || mongoose.model("Invite", InviteSchema);
export default Invite;
