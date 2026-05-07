import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video", "file"], required: true },
    url: { type: String, required: true }, // e.g. /uploads/media/xxx.jpg
    thumbnailUrl: { type: String, default: "" }, // optional
    filename: { type: String, default: "" },

    title: { type: String, default: "", trim: true, maxlength: 160 },
    tags: { type: [String], default: [], index: true },
    category: { type: String, default: "", index: true },

    status: { type: String, enum: ["draft", "approved"], default: "draft" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

MediaSchema.index({
  title: "text",
  tags: "text",
  category: "text",
});

export default mongoose.model("Media", MediaSchema);
