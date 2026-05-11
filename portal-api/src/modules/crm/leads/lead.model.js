import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, required: true },
    companyName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    service: { type: String, trim: true, default: "", index: true },

    source: {
      type: String,
      trim: true,
      default: "manual", // manual | website | plan_builder | referral | whatsapp | campaign | other
      index: true,
    },

    status: {
      type: String,
      trim: true,
      default: "new",
      enum: ["new", "contacted", "qualified", "unqualified", "converted"],
      index: true,
    },

    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    notes: { type: String, trim: true, default: "" },

    convertedToAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRMAccount",
      default: null,
    },

    convertedToDealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRMDeal",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    convertedDealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRMDeal",
      default: null,
      index: true,
    },

    convertedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

LeadSchema.index({ fullName: 1 });
LeadSchema.index({ companyName: 1 });
LeadSchema.index({ email: 1 });
LeadSchema.index({ status: 1, source: 1 });

export default mongoose.models.CRMLead || mongoose.model("CRMLead", LeadSchema);
