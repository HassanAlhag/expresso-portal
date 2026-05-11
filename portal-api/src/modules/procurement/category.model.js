import mongoose from "mongoose";

const { Schema } = mongoose;
const OID = mongoose.Schema.Types.ObjectId;

const ProcurementCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    code: { type: String, trim: true, default: "" },
    level: { type: Number, default: 1, index: true }, // 1 = main, 2 = category, 3 = subcategory
    parentId: {
      type: OID,
      ref: "ProcurementCategory",
      default: null,
      index: true,
    },
    subtitle: { type: String, trim: true, default: "" },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
    heroImageUrl: { type: String, default: "" },
    heroImageMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
  },
  { timestamps: true }
);

ProcurementCategorySchema.index({ slug: 1 }, { unique: true });
ProcurementCategorySchema.index({ parentId: 1, order: 1 });

ProcurementCategorySchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  next();
});

export default mongoose.models.ProcurementCategory ||
  mongoose.model("ProcurementCategory", ProcurementCategorySchema);
