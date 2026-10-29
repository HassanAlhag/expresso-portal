import mongoose from "mongoose";
import { ScopeGroupSchema } from "../services/serviceTemplate.model.js";
import { OperatingEventSchema } from "./operating.schemas.js";

const { Schema } = mongoose;
const DeliveryPeriodSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  enrollmentId: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, index: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true }, // exclusive
  timezone: { type: String, required: true },
  agreementRevisionId: { type: String, required: true },
  scopeSnapshot: { type: [ScopeGroupSchema], default: [] },
  baseEntitlement: { type: [new Schema({ scopeLineId: String, title: String, type: { type: String }, unit: String, quantity: Number }, { _id: false })], default: [] },
  adjustments: { type: [{ _id: false, requestId: String, scopeLineId: String, quantity: Number, reason: String, evidence: String, actorId: { type: Schema.Types.ObjectId, ref: "User" }, at: Date }], default: [] },
  decisions: { type: [OperatingEventSchema], default: [] },
  openedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  openedAt: { type: Date, required: true },
  reconciledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  reconciledAt: { type: Date, default: null },
  partialPeriodDecision: { type: String, default: "" },
  operatingVersion: { type: Number, default: 0 },
}, { timestamps: true });
DeliveryPeriodSchema.index({ enrollmentId: 1, periodStart: 1 }, { unique: true, name: "uniq_enrollment_period_start" });
export default mongoose.models.DeliveryPeriod || mongoose.model("DeliveryPeriod", DeliveryPeriodSchema);
