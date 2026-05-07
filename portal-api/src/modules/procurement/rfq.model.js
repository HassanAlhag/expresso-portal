import mongoose from "mongoose";

const { Schema } = mongoose;
const OID = Schema.Types.ObjectId;

const AttachmentSchema = new Schema(
  { name: { type: String, trim: true }, url: { type: String, trim: true } },
  { _id: false }
);

const RFQSchema = new Schema(
  {
    requestId: {
      type: OID,
      ref: "ProcurementRequest",
      default: null,
      index: true,
    },

    rfqNumber: { type: String, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    deadline: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "published", "closed", "awarded"],
      default: "draft",
      index: true,
    },
    subcategoryIds: [{ type: OID, ref: "ProcurementCategory" }],
    attachments: [AttachmentSchema],
    createdBy: { type: OID, ref: "User", default: null },
    publishedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.RFQ || mongoose.model("RFQ", RFQSchema);
