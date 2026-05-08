import mongoose from "mongoose";

export const STAFF_EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "intern",
  "freelance",
];

export const STAFF_STATUSES = [
  "active",
  "on_leave",
  "probation",
  "inactive",
  "terminated",
];

export const STAFF_DEPARTMENTS = [
  "management",
  "creative",
  "development",
  "marketing",
  "sales",
  "finance",
  "operations",
  "hr",
  "procurement",
  "other",
];

const StaffSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    jobTitle: {
      type: String,
      trim: true,
      default: "",
    },

    department: {
      type: String,
      trim: true,
      lowercase: true,
      default: "other",
      enum: STAFF_DEPARTMENTS,
      index: true,
    },

    employmentType: {
      type: String,
      trim: true,
      lowercase: true,
      default: "full_time",
      enum: STAFF_EMPLOYMENT_TYPES,
      index: true,
    },

    status: {
      type: String,
      trim: true,
      lowercase: true,
      default: "active",
      enum: STAFF_STATUSES,
      index: true,
    },

    linkedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    managerStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HRStaff",
      default: null,
      index: true,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },

    joiningDate: {
      type: Date,
      default: null,
    },

    monthlySalary: {
      type: Number,
      default: null,
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "AED",
    },

    country: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    emergencyContactName: {
      type: String,
      trim: true,
      default: "",
    },

    emergencyContactPhone: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    skills: [
      {
        name: { type: String, trim: true, required: true },
        level: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "expert"],
          default: "beginner",
        },
      },
    ],

    learningGoals: [
      {
        title: { type: String, trim: true, required: true },
        description: { type: String, trim: true, default: "" },
        targetDate: { type: Date, default: null },
        status: {
          type: String,
          enum: ["active", "completed", "on_hold"],
          default: "active",
        },
        progress: { type: Number, min: 0, max: 100, default: 0 },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    scorecards: [
      {
        period: { type: String, trim: true, default: "" },
        rating: { type: Number, min: 1, max: 5, required: true },
        notes: { type: String, trim: true, default: "" },
        reviewerName: { type: String, trim: true, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

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

StaffSchema.index({ fullName: 1, email: 1 });
StaffSchema.index({ department: 1, status: 1 });
StaffSchema.index({ employmentType: 1, status: 1 });
StaffSchema.index({ linkedUserId: 1, managerStaffId: 1 });

export default mongoose.models.HRStaff ||
  mongoose.model("HRStaff", StaffSchema);
