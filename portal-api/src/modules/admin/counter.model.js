import mongoose from "mongoose";

// Atomic sequence counters for human-readable document numbers
// (remediation P2-3). One document per sequence and year, for example
// { _id: "invoice-2026", seq: 41 }. A missing counter is re-created from the
// highest number already in use, so deleting this collection never causes a
// number to be reused.
const CounterSchema = new mongoose.Schema(
  {
    _id: { type: String },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

export default Counter;
