import mongoose from "mongoose";

export const EXPENSE_STATUSES = [
  "submitted",
  "approved",
  "rejected",
  "registered",
  "paid",
];

export const EXPENSE_CATEGORIES = [
  "transportation",
  "meals",
  "office_supplies",
  "software_subscription",
  "client_meeting",
  "travel",
  "accommodation",
  "communication",
  "fuel_parking",
  "printing",
  "equipment",
  "other",
];

const ExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },

    staffName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    staffUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    department: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    category: {
      type: String,
      trim: true,
      default: "other",
      enum: EXPENSE_CATEGORIES,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "AED",
    },

    expenseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    claimMonth: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    receiptUrl: {
      type: String,
      trim: true,
      default: "",
    },

    receiptMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    status: {
      type: String,
      trim: true,
      default: "submitted",
      enum: EXPENSE_STATUSES,
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    registeredMonth: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    registeredAt: {
      type: Date,
      default: null,
    },

    paymentStatus: {
      type: String,
      trim: true,
      default: "unpaid",
      enum: ["unpaid", "paid"],
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
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

ExpenseSchema.index({ status: 1, claimMonth: 1 });
ExpenseSchema.index({ registeredMonth: 1, status: 1 });
ExpenseSchema.index({ category: 1, claimMonth: 1 });

export default mongoose.models.HRExpense ||
  mongoose.model("HRExpense", ExpenseSchema);
