import mongoose from "mongoose";

const CareerSchema = new mongoose.Schema(
  {
    title:           { type: String, required: true, trim: true },
    department:      { type: String, required: true, trim: true },
    type:            { type: String, default: "Full-Time", trim: true },
    location:        { type: String, default: "Dubai, UAE", trim: true },
    summary:         { type: String, default: "", trim: true },
    responsibilities:{ type: [String], default: [] },
    requirements:    { type: [String], default: [] },
    isActive:        { type: Boolean, default: true, index: true },
    order:           { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Career", CareerSchema);
