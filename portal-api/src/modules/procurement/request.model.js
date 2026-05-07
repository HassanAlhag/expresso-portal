import mongoose from "mongoose";

const { Schema } = mongoose;
const OID = mongoose.Schema.Types.ObjectId;

const ProcurementRequestSchema = new Schema(
  {
    ref: { type: String, unique: true, index: true },

    customerId: { type: OID, ref: "Customer", required: true, index: true },
    categoryId: { type: OID, ref: "ProcurementCategory", required: true, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    requirements: { type: String, default: "" },

    budget: { type: Number, default: 0 },
    currency: { type: String, default: "AED" },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    status: {
      type: String,
      enum: ["new", "assessing", "quoted", "approved", "ordered", "delivered", "cancelled"],
      default: "new",
      index: true,
    },

    assignedTo: { type: OID, ref: "User", default: null, index: true },
    vendorId: { type: OID, ref: "ProcurementVendor", default: null },

    quotedAmount: { type: Number, default: null },
    proposedDelivery: { type: Date, default: null },
    notes: { type: String, default: "" },

    timeline: {
      assessedAt: { type: Date, default: null },
      quotedAt: { type: Date, default: null },
      approvedAt: { type: Date, default: null },
      orderedAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
    },

    createdBy: { type: OID, ref: "User", default: null },
    updatedBy: { type: OID, ref: "User", default: null },
  },
  { timestamps: true }
);

ProcurementRequestSchema.index({ customerId: 1, status: 1 });
ProcurementRequestSchema.index({ assignedTo: 1, status: 1 });
ProcurementRequestSchema.index({ createdAt: -1 });

ProcurementRequestSchema.pre("save", async function (next) {
  if (!this.ref) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("ProcurementRequest").countDocuments();
    this.ref = `PR-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

export default mongoose.models.ProcurementRequest ||
  mongoose.model("ProcurementRequest", ProcurementRequestSchema);
