import mongoose from "mongoose";

const { Schema } = mongoose;
const OID = mongoose.Schema.Types.ObjectId;

const CommentSchema = new Schema(
  {
    body: { type: String, required: true, trim: true },
    authorId: { type: OID, ref: "User", required: true },
    authorRole: { type: String, enum: ["client", "admin"], required: true },
    visibility: { type: String, enum: ["client", "internal"], default: "client" },
    // System-generated activity events (status changes, approvals, assignments)
    event: { type: String, default: null },
    eventMeta: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const TYPES = ["support", "change_request", "internal", "procurement"];

const CATEGORIES = [
  "general",
  "design",
  "development",
  "seo",
  "ads",
  "billing",
  "hosting",
  "content",
  "social_media",
  "analytics",
  "support",
  "procurement",
];

const PRIORITIES = ["low", "medium", "high", "urgent"];

const STATUSES = [
  "open",
  "in_progress",
  "waiting_client",
  "waiting_vendor",
  "in_review",
  "escalated",
  "resolved",
  "closed",
];

const SLA_LEVELS = ["standard", "priority", "critical"];
const APPROVAL_STATUSES = ["pending", "approved", "rejected"];

const TicketSchema = new Schema(
  {
    // Human-readable reference e.g. TKT-0042
    ref: { type: String, unique: true, sparse: true, index: true },

    // Ticket type controls which additional fields are active
    type: { type: String, enum: TYPES, default: "support", index: true },

    // Ownership
    clientId: { type: OID, ref: "User", required: true, index: true },
    customerId: { type: OID, ref: "Customer", default: null, index: true },
    projectId: { type: OID, ref: "Project", default: null, index: true },
    assigneeId: { type: OID, ref: "User", default: null, index: true },
    watcherIds: [{ type: OID, ref: "User" }],

    // Core
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    category: { type: String, enum: CATEGORIES, default: "general", index: true },
    priority: { type: String, enum: PRIORITIES, default: "medium", index: true },
    status: { type: String, enum: STATUSES, default: "open", index: true },
    tags: [{ type: String, trim: true, maxlength: 50 }],

    // Scheduling & estimation
    dueDate: { type: Date, default: null },
    estimatedHours: { type: Number, min: 0, default: null },
    actualHours: { type: Number, min: 0, default: null },

    // SLA tracking
    slaLevel: { type: String, enum: SLA_LEVELS, default: "standard" },
    firstResponseAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },

    // Change Request workflow fields
    approvalStatus: { type: String, enum: APPROVAL_STATUSES, default: null },
    approvedBy: { type: OID, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    estimatedCost: { type: Number, min: 0, default: null },

    // Procurement fields
    vendor: { type: String, trim: true, default: null },
    vendorContact: { type: String, trim: true, default: null },
    budgetAmount: { type: Number, min: 0, default: null },
    currency: { type: String, default: "USD" },
    purchaseOrderRef: { type: String, trim: true, default: null },
    deliveryDate: { type: Date, default: null },

    // Resolution
    resolution: { type: String, trim: true, maxlength: 5000, default: null },

    // Post-close CSAT
    satisfactionRating: { type: Number, min: 1, max: 5, default: null },
    satisfactionComment: { type: String, trim: true, default: null },

    comments: { type: [CommentSchema], default: [] },
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

TicketSchema.pre("save", async function (next) {
  this.lastActivityAt = new Date();

  // Auto-generate ref on first save
  if (this.isNew && !this.ref) {
    try {
      const count = await mongoose.model("Ticket").countDocuments();
      this.ref = `TKT-${String(count + 1).padStart(4, "0")}`;
    } catch {
      this.ref = `TKT-${Date.now()}`;
    }
  }

  // Auto-stamp resolvedAt when moving to resolved/closed
  if (this.isModified("status")) {
    const terminal = ["resolved", "closed"];
    if (terminal.includes(this.status) && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (!terminal.includes(this.status)) {
      this.resolvedAt = null;
    }
  }

  next();
});

export default mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
