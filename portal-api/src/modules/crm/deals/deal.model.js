import mongoose from "mongoose";
import { DEAL_STAGES, DEAL_PIPELINES } from "./deal.constants.js";

const DealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
      index: true,
    },

    pipeline: {
      type: String,
      trim: true,
      default: "sales",
      enum: DEAL_PIPELINES,
      index: true,
    },

    stage: {
      type: String,
      trim: true,
      default: "discovery",
      enum: DEAL_STAGES,
      index: true,
    },

    status: {
      type: String,
      trim: true,
      default: "open",
      enum: ["open", "won", "lost", "archived"],
      index: true,
    },

    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRMAccount",
      default: null,
      index: true,
    },

    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRMContact",
      default: null,
      index: true,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRMLead",
      default: null,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    value: {
      type: Number,
      default: null,
    },

    currency: {
      type: String,
      trim: true,
      default: "AED",
    },

    probability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    expectedCloseDate: {
      type: Date,
      default: null,
      index: true,
    },

    source: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    wonAt: {
      type: Date,
      default: null,
    },

    lostAt: {
      type: Date,
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

DealSchema.index({ pipeline: 1, stage: 1 });
DealSchema.index({ ownerUserId: 1, stage: 1 });
DealSchema.index({ status: 1, stage: 1 });

export default mongoose.models.CRMDeal || mongoose.model("CRMDeal", DealSchema);
