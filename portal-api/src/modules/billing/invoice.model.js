import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, default: 0 },
    method: {
      type: String,
      enum: ["bank_transfer", "cash", "card", "cheque", "online", "other"],
      default: "bank_transfer",
    },
    note: { type: String, trim: true, default: "" },
    paidAt: { type: Date, default: () => new Date() },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

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
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      default: null,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },

    number: { type: String, trim: true, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "void"],
      default: "draft",
      index: true,
    },

    currency: { type: String, default: "AED", trim: true },

    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },    // flat discount amount
    taxRate: { type: Number, default: 0 },     // percentage e.g. 5 = 5%
    tax: { type: Number, default: 0 },         // computed tax amount
    total: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },  // sum of payments.amount
    balance: { type: Number, default: 0 },     // total - amountPaid

    issuedAt: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    paidAt: { type: Date, default: null },

    items: { type: [InvoiceItemSchema], default: [] },
    payments: { type: [PaymentSchema], default: [] },
    notes: { type: String, trim: true, default: "" },

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

InvoiceSchema.pre("save", function (next) {
  const items = Array.isArray(this.items) ? this.items : [];
  const subtotal = items.reduce((sum, it) => {
    it.amount = Number(it.qty || 0) * Number(it.unitPrice || 0);
    return sum + it.amount;
  }, 0);
  this.subtotal = subtotal;

  const discount = Math.max(0, Number(this.discount || 0));
  this.discount = discount;
  const taxable = Math.max(0, subtotal - discount);

  // if taxRate is set, compute tax from percentage; otherwise use flat tax value
  const taxRate = Number(this.taxRate || 0);
  this.tax = taxRate > 0 ? taxable * (taxRate / 100) : Number(this.tax || 0);

  this.total = taxable + this.tax;

  const payments = Array.isArray(this.payments) ? this.payments : [];
  this.amountPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  this.balance = Math.max(0, this.total - this.amountPaid);

  next();
});

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema);
