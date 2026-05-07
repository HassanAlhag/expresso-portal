import mongoose from "mongoose";

const { Schema } = mongoose;
const OID = Schema.Types.ObjectId;

const AttachmentSchema = new Schema(
  { name: { type: String, trim: true }, url: { type: String, trim: true } },
  { _id: false }
);

const QuotationSchema = new Schema(
  {
    rfqId: { type: OID, ref: "RFQ", required: true, index: true },
    vendorId: { type: OID, ref: "ProcurementVendor", required: true, index: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "AED", trim: true },
    deliveryDays: { type: Number, default: null },
    notes: { type: String, default: "" },
    attachments: [AttachmentSchema],
    status: {
      type: String,
      enum: ["submitted", "under_review", "accepted", "rejected"],
      default: "submitted",
      index: true,
    },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

QuotationSchema.index({ rfqId: 1, vendorId: 1 }, { unique: true });

export default mongoose.models.Quotation ||
  mongoose.model("Quotation", QuotationSchema);
