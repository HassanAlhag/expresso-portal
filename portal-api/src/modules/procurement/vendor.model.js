import mongoose from "mongoose";

const { Schema } = mongoose;
const OID = mongoose.Schema.Types.ObjectId;

const ProcurementVendorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    website: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    contactPerson: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "UAE" },
    categories: [{ type: OID, ref: "ProcurementCategory" }],
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    applicationId: { type: OID, ref: "VendorApplication", default: null },
    userId: { type: OID, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.ProcurementVendor ||
  mongoose.model("ProcurementVendor", ProcurementVendorSchema);
