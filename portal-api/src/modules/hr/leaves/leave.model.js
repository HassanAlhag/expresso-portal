import mongoose from "mongoose";

export const LEAVE_TYPES = [
  "annual",
  "sick",
  "emergency",
  "unpaid",
  "remote_work",
  "other",
];

export const LEAVE_STATUSES = [
  "submitted",
  "approved",
  "rejected",
  "cancelled",
];

const LeaveSchema = new mongoose.Schema(
  {
    staffName: {
      type: String,
      trim: true,
      required: true,
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

    leaveType: {
      type: String,
      trim: true,
      default: "annual",
      enum: LEAVE_TYPES,
      index: true,
    },

    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    days: {
      type: Number,
      default: 1,
      min: 0,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      trim: true,
      default: "submitted",
      enum: LEAVE_STATUSES,
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

LeaveSchema.index({ status: 1, startDate: 1 });
LeaveSchema.index({ staffName: 1, status: 1 });

export default mongoose.models.HRLeave ||
  mongoose.model("HRLeave", LeaveSchema);
