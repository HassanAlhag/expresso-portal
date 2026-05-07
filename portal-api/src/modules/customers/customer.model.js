import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },

    primaryEmail: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },

    industry: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },

    code: { type: String, trim: true, unique: true, sparse: true },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
    },

    isActive: { type: Boolean, default: true },

    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    logoUrl: { type: String, trim: true, default: "" },
    logoMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    notes: { type: String, trim: true, default: "" },

    department: {
      type: String,
      enum: ["digital_agency", "procurement", "both"],
      default: "digital_agency",
      index: true,
    },

    crmAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRMAccount",
      default: null,
    },

    crmDealId: {
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
  },
  { timestamps: true }
);

CustomerSchema.index({ companyName: 1 });
CustomerSchema.index({ contactName: 1 });
CustomerSchema.index({ slug: 1 }, { unique: true });
CustomerSchema.index({ isActive: 1 });

const Customer =
  mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);

export default Customer;
