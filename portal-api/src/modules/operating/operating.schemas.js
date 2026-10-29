import mongoose from "mongoose";
import { ScopeGroupSchema } from "../services/serviceTemplate.model.js";

const { Schema } = mongoose;
const user = () => ({ type: Schema.Types.ObjectId, ref: "User", default: null });
export const ApprovalRouteSchema = new Schema({
  id: { type: String, required: true },
  order: { type: Number, required: true },
  purpose: { type: String, required: true },
  required: { type: Boolean, default: true },
  source: { type: String, enum: ["EXECUTION_LEAD", "ACCOUNT_OWNER", "EXPLICIT_INTERNAL_USER", "CLIENT_EXTERNAL_RECORDED"], required: true },
  approverId: user(),
}, { _id: false });

export const AgreementSchema = new Schema({
  id: { type: String, required: true },
  number: { type: Number, required: true },
  effectiveDate: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  timezone: { type: String, required: true },
  deliveryCadence: { type: String, enum: ["monthly", "once"], required: true },
  serviceTemplateId: { type: Schema.Types.ObjectId, ref: "ServiceTemplate", default: null },
  sourceDealId: { type: Schema.Types.ObjectId, ref: "CRMDeal", default: null },
  scope: {
    mode: { type: String, enum: ["recurring", "phased_project", "one_time"], required: true },
    groups: { type: [ScopeGroupSchema], default: [] },
  },
  price: { type: Number, default: null },
  currency: { type: String, required: true },
  billingCycle: { type: String, default: "" },
  executionLeadId: user(),
  accountOwnerId: user(),
  teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
  approvalRoute: { type: [ApprovalRouteSchema], default: [] },
  reference: { type: String, default: "" },
  fileIds: [{ type: Schema.Types.ObjectId, ref: "File" }],
  clientContact: { type: String, required: true },
  acceptedAt: { type: Date, required: true },
  reason: { type: String, required: true },
  recordedBy: user(),
  recordedAt: { type: Date, required: true },
}, { _id: false });

export const OperatingEventSchema = new Schema({
  id: { type: String, required: true },
  action: { type: String, required: true },
  at: { type: Date, required: true },
  actorId: user(),
  reason: { type: String, default: "" },
  // Command-specific audit facts, never assigned directly from request bodies.
  facts: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

export const PhaseSchema = new Schema({
  id: { type: String, required: true }, name: { type: String, required: true },
  order: { type: Number, required: true }, predecessorId: { type: String, default: "" },
  plannedStart: { type: Date, default: null }, plannedEnd: { type: Date, default: null },
  acceptanceRequirement: { type: String, required: true },
  acceptedAt: { type: Date, default: null }, acceptedBy: user(),
  history: { type: [OperatingEventSchema], default: [] },
}, { _id: false });

export const JobOperatingSchema = new Schema({
  version: { type: Number, default: 0 },
  completionCriterion: { type: String, enum: ["delivered", "published"], default: "delivered" },
  route: { type: [ApprovalRouteSchema], default: [] },
  submission: {
    revision: { type: Number, default: 0 }, submittedAt: { type: Date, default: null },
    submittedBy: user(), outputReference: { type: String, default: "" },
    route: { type: [ApprovalRouteSchema], default: [] },
  },
  decisions: { type: [{
    _id: false, requestId: String, stepId: String, revision: Number,
    actorId: user(), at: Date, decision: { type: String, enum: ["approved", "changes_requested"] },
    note: String, evidence: String, clientContact: String, clientApprovedAt: Date,
  }], default: [] },
  blockers: { type: [{
    _id: false, id: String,
    reason: { type: String, enum: ["CONTENT", "APPROVAL", "ACCESS", "FEEDBACK", "DEPENDENCY", "OTHER"] },
    responsibleParty: { type: String, enum: ["CLIENT", "EXPRESSO", "THIRD_PARTY"] },
    startedAt: Date, endedAt: Date, recordedBy: user(), endedBy: user(),
    note: String, evidence: String, nextAction: String, nextActionOwnerId: user(),
  }], default: [] },
  disposition: { type: String, enum: ["outstanding", "delivered", "waived"], default: "outstanding" },
  events: { type: [OperatingEventSchema], default: [] },
}, { _id: false });
