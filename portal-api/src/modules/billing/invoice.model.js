import mongoose from "mongoose";

const InvoiceItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    qty: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    number: { type: String, trim: true, unique: true, sparse: true }, // e.g. INV-2026-0001
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "void"],
      default: "draft",
      index: true,
    },

    currency: { type: String, default: "AED", trim: true },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    issuedAt: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    paidAt: { type: Date, default: null },

    items: { type: [InvoiceItemSchema], default: [] },
    notes: { type: String, trim: true, default: "" },

    // simple attachments (optional)
    uploads: {
      type: [
        {
          id: { type: String, default: "" },
          name: { type: String, default: "" },
          url: { type: String, default: "" },
        },
      ],
      default: [],
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

// Auto-calc totals
InvoiceSchema.pre("save", function (next) {
  const items = Array.isArray(this.items) ? this.items : [];
  const subtotal = items.reduce((sum, it) => {
    const qty = Number(it.qty || 0);
    const unitPrice = Number(it.unitPrice || 0);
    const amount = Number(it.amount || qty * unitPrice);
    it.amount = amount;
    return sum + amount;
  }, 0);

  this.subtotal = subtotal;
  this.total = Number(this.subtotal || 0) + Number(this.tax || 0);
  next();
});

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema);
