import mongoose from "mongoose";

export const BRAND_ASSET_TYPES = ["logo", "color", "font", "guideline", "template", "icon"];

const BrandAssetSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: BRAND_ASSET_TYPES,
      required: true,
      index: true,
    },
    name: { type: String, trim: true, required: true, maxlength: 120 },
    value: { type: String, trim: true, default: "" }, // hex for colors, family name for fonts, URL otherwise
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    url: { type: String, trim: true, default: "" },
    isPrimary: { type: Boolean, default: false },
    notes: { type: String, trim: true, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.BrandAsset || mongoose.model("BrandAsset", BrandAssetSchema);
