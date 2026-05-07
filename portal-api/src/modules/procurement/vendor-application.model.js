import mongoose from "mongoose";

const { Schema } = mongoose;
const OID = mongoose.Schema.Types.ObjectId;

const CategorySelectionSchema = new Schema(
  {
    mainCategoryId: { type: OID, ref: "ProcurementCategory", required: true },
    categoryId: { type: OID, ref: "ProcurementCategory", required: true },
    subcategoryId: { type: OID, ref: "ProcurementCategory", required: true },
  },
  { _id: false }
);

const VendorApplicationSchema = new Schema(
  {
    companyName:  { type: String, required: true, trim: true },
    contactName:  { type: String, required: true, trim: true },
    email:        { type: String, required: true, trim: true, lowercase: true, index: true },
    phone:        { type: String, trim: true, default: "" },
    country:      { type: String, trim: true, default: "UAE" },
    website:      { type: String, trim: true, default: "" },

    // Max 3 category paths, each with 3 levels
    categorySelections: {
      type: [CategorySelectionSchema],
      validate: {
        validator: (v) => v.length >= 1 && v.length <= 3,
        message: "Select between 1 and 3 categories.",
      },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    notes: { type: String, default: "" },

    // Set on approval
    approvedBy: { type: OID, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    userId:     { type: OID, ref: "User", default: null },
    vendorId:   { type: OID, ref: "ProcurementVendor", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.VendorApplication ||
  mongoose.model("VendorApplication", VendorApplicationSchema);
