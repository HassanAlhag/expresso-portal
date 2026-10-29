// R5-B2 — offline reference-integrity reporting.
//
// Evaluates an explicitly supplied, sanitized snapshot (synthetic fixture or
// a separately authorised capture) against the repository's relationship
// definitions. Pure and read-only: no database, storage, network, process or
// environment access; the input is never mutated; nothing is written.
//
// What a report can show, from the supplied evidence only:
//   relationship defined · reference present · target exists · ownership consistent
// What it never shows: that production data is healthy, or that anything is
// safe to modify or delete. No repair instruction or command is produced.
//
// The relationship catalog below is lifecycle metadata over the models
// recorded in docs/architecture/source-inventory.json. `catalogDrift()`
// compares every catalog field with the inventory, and every inventory
// reference field must be covered or excluded with a reason, so a model
// change forces a deliberate review of this file.

import {
  LifecycleError, EXIT, isPlainObject, isSha256, isUtcTimestamp, findSecrets, digestOf, GIT_COMMIT_RE,
} from "./common.js";

export const SNAPSHOT_SCHEMA_VERSION = "expresso.lifecycle.reference-snapshot/1";
export const REPORT_VERSION = "expresso.lifecycle.reference-report/1";
export const CATALOG_SCHEMA_VERSION = "expresso.lifecycle.reference-catalog/1";

export const STATES = Object.freeze([
  "VALID", "NULL_ALLOWED", "MISSING_REQUIRED_REFERENCE", "MISSING_TARGET", "MALFORMED_REFERENCE",
  "OWNERSHIP_MISMATCH", "RECIPROCAL_MISMATCH", "UNKNOWN_TARGET_TYPE", "UNSUPPORTED_SHAPE", "INCOMPLETE_EVIDENCE",
  "NOT_COMPARABLE",
]);
export const SEVERITIES = Object.freeze(["CRITICAL", "IMPORTANT", "INFORMATIONAL"]);
const SEV_RANK = { CRITICAL: 3, IMPORTANT: 2, INFORMATIONAL: 1 };
const atLeast = (a, b) => (SEV_RANK[a] >= SEV_RANK[b] ? a : b);

// Cleanup scopes a finding can block. A block never implies the opposite
// (an unblocked record is not "safe"); it only says what must be resolved first.
export const CLEANUP_SCOPES = Object.freeze([
  "production-retirement", "asset-cleanup", "financial-data-cleanup", "customer-data-cleanup", "delivery-data-cleanup",
  "procurement-cleanup", "vendor-onboarding-cleanup", "hr-cleanup", "crm-cleanup", "user-cleanup", "support-cleanup",
]);

/* ------------------------------------------------------------------ catalog */
// kind "ref"        — a reference field must resolve to a target record.
// kind "ownership"  — a resolved target must belong to the same customer.
// kind "reciprocal" — a resolved target must point back (or agree) as defined.
// kind "polymorphic"— the target collection is chosen by a type field.
// kind "agreement"  — canonical and legacy fields, when both set, must agree.
// kind "conditional"— a reference is required only in a stated condition.
// `historical: true` marks actor fields whose target may legitimately be
// deleted: a missing target is INFORMATIONAL review, never a corruption claim.
// `retirementEvidence: true` reports existing links too (Production).
const C = "customers";
const R = (id, group, source, path, target, o = {}) => ({ id, kind: "ref", group, source, path, target, required: false, severity: "IMPORTANT", blocks: [], ...o });
const OWN = (id, group, source, path, target, o = {}) => ({ id, kind: "ownership", group, source, path, target, sourceOwner: "customerId", targetOwner: "customerId", severity: "CRITICAL", blocks: [], ...o });

const EXPLICIT = [
  // Operating Model Phase 1: existing offline catalog, no capture or cleanup.
  R("job.origin-period", "jobs", "jobs", "originDeliveryPeriodId", "deliveryperiods", { blocks: ["delivery-data-cleanup"] }),
  R("job.work-period", "jobs", "jobs", "workDeliveryPeriodId", "deliveryperiods", { blocks: ["delivery-data-cleanup"] }),
  R("customer.account-manager", "users", C, "accountManagerId", "users", { note: "Agency responsibility; distinct from the external client login." }),
  R("enrollment.team", "jobs", "enrollments", "teamId", "teams"),
  R("enrollment.source-deal", "crm", "enrollments", "sourceDealId", "crmdeals"),
  R("enrollment.adopted-job", "jobs", "enrollments", "adoptionMappings[].jobId", "jobs"),
  R("delivery-period.customer", "jobs", "deliveryperiods", "customerId", C, { required: true, severity: "CRITICAL", blocks: ["customer-data-cleanup", "delivery-data-cleanup"] }),
  R("delivery-period.enrollment", "jobs", "deliveryperiods", "enrollmentId", "enrollments", { required: true, blocks: ["delivery-data-cleanup"] }),
  R("delivery-period.adjustment-actor", "jobs", "deliveryperiods", "adjustments[].actorId", "users", { historical: true }),
  R("delivery-period.opened-by", "jobs", "deliveryperiods", "openedBy", "users", { required: true, historical: true }),
  R("delivery-period.reconciled-by", "jobs", "deliveryperiods", "reconciledBy", "users", { historical: true }),
  R("project.team", "jobs", "projects", "teamId", "teams"),
  R("project.adopted-job", "jobs", "projects", "adoptionMappings[].jobId", "jobs"),

  // Optional public work → case study link; the linked story may be unpublished.
  R("work.case-study", "portfolio", "workitems", "caseStudy", "portfolios", { blocks: ["asset-cleanup"], note: "Optional link validated by the Work Items API; publication is filtered separately." }),

  // JOBS
  R("job.customer", "jobs", "jobs", "customerId", C, { required: true, severity: "CRITICAL", blocks: ["customer-data-cleanup", "delivery-data-cleanup"] }),
  R("job.project", "jobs", "jobs", "projectId", "projects", { blocks: ["delivery-data-cleanup"] }),
  R("job.enrollment", "jobs", "jobs", "enrollmentId", "enrollments", { blocks: ["delivery-data-cleanup"] }),
  R("job.assignees", "jobs", "jobs", "assignees[]", "users", { blocks: ["user-cleanup"], note: "Live assignment, not a historical stamp." }),
  R("job.cover-media", "jobs", "jobs", "coverMedia", "media", { blocks: ["asset-cleanup"] }),
  R("job.draft-media", "jobs", "jobs", "draftMediaId", "media", { blocks: ["asset-cleanup"] }),
  R("job.final-media", "jobs", "jobs", "finalMediaId", "media", { blocks: ["asset-cleanup"] }),
  R("job.poster-media", "jobs", "jobs", "posterMediaId", "media", { blocks: ["asset-cleanup"] }),
  R("job.media", "jobs", "jobs", "media[]", "media", { blocks: ["asset-cleanup"] }),
  R("job.approval-actor", "jobs", "jobs", "approvals[].createdBy", "users", { historical: true }),
  OWN("job.project-customer", "jobs", "jobs", "projectId", "projects", { blocks: ["customer-data-cleanup"], note: "Enforced on write by the Jobs API (customerId must match the project)." }),
  OWN("job.enrollment-customer", "jobs", "jobs", "enrollmentId", "enrollments", { blocks: ["customer-data-cleanup"], note: "Enforced on write by the Jobs API (customerId must match the enrollment)." }),

  // FILES
  R("file.customer", "files", "files", "customerId", C, { severity: "CRITICAL", blocks: ["customer-data-cleanup", "asset-cleanup"] }),
  R("file.project", "files", "files", "projectId", "projects", { blocks: ["delivery-data-cleanup", "asset-cleanup"] }),
  R("file.job", "files", "files", "jobId", "jobs", { blocks: ["delivery-data-cleanup", "asset-cleanup"] }),
  OWN("file.project-customer", "files", "files", "projectId", "projects", { blocks: ["customer-data-cleanup", "asset-cleanup"], note: "External uploads must name the uploader's own project (Files API)." }),
  OWN("file.job-customer", "files", "files", "jobId", "jobs", { blocks: ["customer-data-cleanup", "asset-cleanup"], note: "External uploads must name the uploader's own job (Files API)." }),

  // LEGACY PRODUCTION (reporting only; every link is retirement evidence)
  R("job.production", "production", "jobs", "productionId", "productions", { retirementEvidence: true, blocks: ["production-retirement"] }),
  R("file.production", "production", "files", "productionId", "productions", { retirementEvidence: true, blocks: ["production-retirement", "asset-cleanup"] }),
  R("production.cover-media", "production", "productions", "coverMedia", "media", { retirementEvidence: true, blocks: ["production-retirement", "asset-cleanup"] }),
  R("production.gallery", "production", "productions", "gallery[]", "media", { retirementEvidence: true, blocks: ["production-retirement", "asset-cleanup"] }),

  // INVOICES (financial history is reported, never repaired)
  R("invoice.customer", "financial", "invoices", "customerId", C, { required: true, severity: "CRITICAL", blocks: ["financial-data-cleanup", "customer-data-cleanup"] }),
  R("invoice.project", "financial", "invoices", "projectId", "projects", { blocks: ["financial-data-cleanup"] }),
  R("invoice.enrollment", "financial", "invoices", "enrollmentId", "enrollments", { blocks: ["financial-data-cleanup"] }),
  R("invoice.payment-actor", "financial", "invoices", "payments[].recordedBy", "users", { historical: true }),
  OWN("invoice.project-customer", "financial", "invoices", "projectId", "projects", { blocks: ["financial-data-cleanup"], note: "Schema co-locates the invoice customer and project; the Billing API does not validate the pair on write." }),
  OWN("invoice.enrollment-customer", "financial", "invoices", "enrollmentId", "enrollments", { blocks: ["financial-data-cleanup"], note: "Schema co-locates the invoice customer and enrollment; the Billing API does not validate the pair on write." }),

  // PROCUREMENT
  R("rfq.request", "procurement", "rfqs", "requestId", "procurementrequests", { blocks: ["procurement-cleanup"], note: "Null is a legitimate standalone RFQ; a non-null link must resolve." }),
  R("rfq.subcategories", "procurement", "rfqs", "subcategoryIds[]", "procurementcategories", { blocks: ["procurement-cleanup"] }),
  R("quotation.rfq", "procurement", "quotations", "rfqId", "rfqs", { required: true, severity: "CRITICAL", blocks: ["procurement-cleanup"] }),
  R("quotation.vendor", "procurement", "quotations", "vendorId", "procurementvendors", { required: true, severity: "CRITICAL", blocks: ["procurement-cleanup"] }),
  R("procurement-request.customer", "procurement", "procurementrequests", "customerId", C, { required: true, severity: "CRITICAL", blocks: ["procurement-cleanup", "customer-data-cleanup"] }),
  R("procurement-request.category", "procurement", "procurementrequests", "categoryId", "procurementcategories", { required: true, blocks: ["procurement-cleanup"] }),

  // VENDOR ONBOARDING (intermediate states are not orphans: links are optional)
  R("vendor-application.vendor", "vendor-onboarding", "vendorapplications", "vendorId", "procurementvendors", { blocks: ["vendor-onboarding-cleanup"] }),
  R("vendor-application.user", "vendor-onboarding", "vendorapplications", "userId", "users", { blocks: ["vendor-onboarding-cleanup"] }),
  R("vendor.application", "vendor-onboarding", "procurementvendors", "applicationId", "vendorapplications", { blocks: ["vendor-onboarding-cleanup"] }),
  R("vendor.user", "vendor-onboarding", "procurementvendors", "userId", "users", { blocks: ["vendor-onboarding-cleanup", "user-cleanup"], note: "Null until the vendor's invitation is accepted." }),
  R("invite.vendor", "vendor-onboarding", "invites", "vendorId", "procurementvendors", { blocks: ["vendor-onboarding-cleanup"] }),
  R("invite.customer", "vendor-onboarding", "invites", "clientId", C, { blocks: ["customer-data-cleanup"] }),
  { id: "vendor-application.vendor-back-link", kind: "reciprocal", group: "vendor-onboarding", source: "vendorapplications", path: "vendorId", target: "procurementvendors", back: "applicationId", severity: "IMPORTANT", blocks: ["vendor-onboarding-cleanup"], note: "Approval sets application.vendorId and vendor.applicationId together." },
  { id: "vendor.application-back-link", kind: "reciprocal", group: "vendor-onboarding", source: "procurementvendors", path: "applicationId", target: "vendorapplications", back: "vendorId", severity: "IMPORTANT", blocks: ["vendor-onboarding-cleanup"] },
  { id: "vendor.application-user-agreement", kind: "reciprocal", group: "vendor-onboarding", source: "procurementvendors", path: "applicationId", target: "vendorapplications", agree: ["userId", "userId"], severity: "IMPORTANT", blocks: ["vendor-onboarding-cleanup"], note: "Compared only when both sides are set." },

  // HR
  R("kpi-goal.indicator", "hr", "kpigoals", "indicatorId", "kpiindicators", { required: true, blocks: ["hr-cleanup"] }),
  R("kpi-goal.staff", "hr", "kpigoals", "staffId", "hrstaffs", { blocks: ["hr-cleanup"] }),
  R("kpi-checkin.goal", "hr", "kpicheckins", "goalId", "kpigoals", { required: true, blocks: ["hr-cleanup"] }),
  R("hr-staff.user", "hr", "hrstaffs", "linkedUserId", "users", { blocks: ["hr-cleanup", "user-cleanup"] }),

  // CRM
  {
    id: "crm-activity.entity", kind: "polymorphic", group: "crm", source: "crmactivities", path: "entityId", typeField: "entityType", required: true,
    targets: { lead: "crmleads", deal: "crmdeals", account: "crmaccounts", contact: "crmcontacts", customer: C }, severity: "IMPORTANT", blocks: ["crm-cleanup"],
  },
  R("crm-lead.converted-deal", "crm", "crmleads", "convertedDealId", "crmdeals", { blocks: ["crm-cleanup"], note: "Canonical conversion link (R4-C)." }),
  R("crm-lead.converted-deal-legacy", "crm", "crmleads", "convertedToDealId", "crmdeals", { blocks: ["crm-cleanup"], note: "Retained legacy conversion link; still read as a fallback." }),
  R("crm-lead.converted-account", "crm", "crmleads", "convertedToAccountId", "crmaccounts", { blocks: ["crm-cleanup"] }),
  R("crm-deal.lead", "crm", "crmdeals", "leadId", "crmleads", { blocks: ["crm-cleanup"] }),
  R("crm-deal.account", "crm", "crmdeals", "accountId", "crmaccounts", { blocks: ["crm-cleanup"] }),
  R("crm-deal.contact", "crm", "crmdeals", "contactId", "crmcontacts", { blocks: ["crm-cleanup"] }),
  R("crm-deal.customer", "crm", "crmdeals", "customerId", C, { blocks: ["crm-cleanup", "customer-data-cleanup"] }),
  R("crm-account.customer", "crm", "crmaccounts", "customerId", C, { blocks: ["crm-cleanup", "customer-data-cleanup"] }),
  R("crm-contact.account", "crm", "crmcontacts", "accountId", "crmaccounts", { blocks: ["crm-cleanup"] }),
  R("crm-contact.lead", "crm", "crmcontacts", "leadId", "crmleads", { blocks: ["crm-cleanup"] }),
  R("crm-contact.customer", "crm", "crmcontacts", "customerId", C, { blocks: ["crm-cleanup", "customer-data-cleanup"] }),
  R("customer.crm-account", "crm", C, "crmAccountId", "crmaccounts", { blocks: ["crm-cleanup", "customer-data-cleanup"] }),
  R("customer.crm-deal", "crm", C, "crmDealId", "crmdeals", { blocks: ["crm-cleanup", "customer-data-cleanup"] }),
  { id: "crm-lead.deal-back-link", kind: "reciprocal", group: "crm", source: "crmleads", path: "convertedDealId", target: "crmdeals", back: "leadId", severity: "IMPORTANT", blocks: ["crm-cleanup"], note: "Conversion creates the deal with leadId set to the lead." },
  { id: "customer.crm-account-back-link", kind: "reciprocal", group: "crm", source: C, path: "crmAccountId", target: "crmaccounts", back: "customerId", severity: "IMPORTANT", blocks: ["crm-cleanup", "customer-data-cleanup"], note: "Deal-to-client conversion sets account.customerId." },
  { id: "customer.crm-deal-back-link", kind: "reciprocal", group: "crm", source: C, path: "crmDealId", target: "crmdeals", back: "customerId", severity: "IMPORTANT", blocks: ["crm-cleanup", "customer-data-cleanup"] },
  { id: "crm-lead.canonical-legacy-agreement", kind: "agreement", group: "crm", source: "crmleads", fields: ["convertedDealId", "convertedToDealId"], severity: "IMPORTANT", blocks: ["crm-cleanup"], note: "When both conversion links are set they must name the same deal." },

  // CLIENT / EXTERNAL USERS
  R("user.customer", "users", "users", "clientId", C, { severity: "CRITICAL", blocks: ["user-cleanup", "customer-data-cleanup"] }),
  {
    id: "user.external-company", kind: "conditional", group: "users", source: "users", path: "clientId", target: C, severity: "CRITICAL", blocks: ["user-cleanup", "customer-data-cleanup"],
    note: "An external user (resolved isInternal === false) needs a company unless an active vendor profile links them; classification comes from the captured access flag, not role names.",
  },

  // SUPPORT
  R("ticket.customer", "support", "tickets", "customerId", C, { severity: "CRITICAL", blocks: ["support-cleanup", "customer-data-cleanup"], note: "Null for internal tickets; a set value scopes client visibility." }),
  R("ticket.project", "support", "tickets", "projectId", "projects", { blocks: ["support-cleanup"] }),
  R("ticket.requester", "support", "tickets", "clientId", "users", { required: true, historical: true, note: "The user who opened the ticket; a deleted requester is historical, not a tenant problem." }),
  R("ticket.assignee", "support", "tickets", "assigneeId", "users", { blocks: ["support-cleanup"] }),
  R("ticket.watchers", "support", "tickets", "watcherIds[]", "users", { historical: true }),
  R("ticket.comment-author", "support", "tickets", "comments[].authorId", "users", { required: true, historical: true }),
  OWN("ticket.project-customer", "support", "tickets", "projectId", "projects", { severity: "IMPORTANT", blocks: ["support-cleanup"], note: "Schema co-locates customerId and projectId; the Tickets API does not validate the pair on write." }),
];

// Reference fields deliberately outside B2, with the reason. Audit stamps
// (createdBy / updatedBy) are excluded everywhere: historical actors that may
// legitimately be deleted. Media references not listed above are added
// automatically from the inventory as asset-cleanup evidence.
export const EXCLUDED = Object.freeze({
  "*.createdBy": "audit stamp: historical actor",
  "*.updatedBy": "audit stamp: historical actor",
  "Audit.actorId": "audit log actor: historical by design",
  "Audit.targetUserId": "audit log subject: historical by design",
  "AccessRequest.reviewedBy": "historical reviewer",
  "AccessRequest.inviteId": "onboarding trail outside the B2 study set",
  "Invite.invitedBy": "historical inviter",
  "Invite.accessRequestId": "onboarding trail outside the B2 study set",
  "Invite.acceptedByUserId": "historical acceptor",
  "VendorApplication.approvedBy": "historical approver",
  "VendorApplication.categorySelections[].mainCategoryId": "category selection detail outside the B2 study set",
  "VendorApplication.categorySelections[].categoryId": "category selection detail outside the B2 study set",
  "VendorApplication.categorySelections[].subcategoryId": "category selection detail outside the B2 study set",
  "ProcurementVendor.categories": "category tagging outside the B2 study set",
  "ProcurementRequest.assignedTo": "staff assignment outside the B2 study set",
  "ProcurementRequest.vendorId": "outside the B2 study set",
  "ProcurementCategory.parentId": "category tree outside the B2 study set",
  "JobApplication.careerId": "careers outside the B2 study set",
  "JobApplication.reviewedBy": "historical reviewer",
  "BrandAsset.customerId": "tenant link outside the B2 study set",
  "SocialMetrics.customerId": "tenant link outside the B2 study set",
  "Message.customerId": "tenant link outside the B2 study set",
  "Message.authorId": "historical author",
  "Message.readBy": "historical read receipts",
  "Enrollment.customerId": "outside the B2 study set (used as the ownership target for jobs and invoices)",
  "Enrollment.serviceTemplateId": "outside the B2 study set",
  "Enrollment.projectId": "outside the B2 study set",
  "Enrollment.accountOwnerId": "staff assignment outside the B2 study set",
  "Enrollment.executionLeadId": "staff assignment outside the B2 study set",
  "Project.customerId": "outside the B2 study set (used as the ownership target for jobs, files, invoices and tickets)",
  "Project.enrollmentId": "outside the B2 study set",
  "Project.ownerUserId": "staff assignment outside the B2 study set",
  "Customer.ownerUserId": "staff assignment outside the B2 study set",
  "CRMAccount.ownerUserId": "staff assignment outside the B2 study set",
  "CRMContact.ownerUserId": "staff assignment outside the B2 study set",
  "CRMDeal.ownerUserId": "staff assignment outside the B2 study set",
  "CRMLead.ownerUserId": "staff assignment outside the B2 study set",
  "CRMActivity.assignedTo": "staff assignment outside the B2 study set",
  "HRStaff.managerStaffId": "reporting line outside the B2 study set",
  "HRStaff.teamId": "team link outside the B2 study set",
  "HRExpense.staffUserId": "HR expense trail outside the B2 study set",
  "HRExpense.approvedBy": "historical approver",
  "HRExpense.registeredBy": "historical actor",
  "HRLeave.staffUserId": "HR leave trail outside the B2 study set",
  "HRLeave.approvedBy": "historical approver",
  "Team.leadUserId": "team lead outside the B2 study set",
  "Ticket.approvedBy": "historical approver",
});

// Fields a snapshot may carry besides the reference paths: identifiers, the
// polymorphic discriminator, and the access facts the conditional rule needs.
const EXTRA_FIELDS = Object.freeze({ users: ["isInternal", "isActive"], procurementvendors: ["isActive"], crmactivities: ["entityType"] });

/* ---------------------------------------------------------- paths & ids */
const ID_RE = /^[0-9a-fA-F]{24}$/;
/** A reference value → { kind: "id", id } | { kind: "null" } | { kind: "malformed" } | { kind: "shape" }. */
function readId(v) {
  if (v === null || v === undefined) return { kind: "null" };
  if (typeof v === "string") return ID_RE.test(v) ? { kind: "id", id: v.toLowerCase() } : { kind: "malformed" };
  if (isPlainObject(v) && Object.keys(v).length === 1 && typeof v.$oid === "string") return ID_RE.test(v.$oid) ? { kind: "id", id: v.$oid.toLowerCase() } : { kind: "malformed" };
  return { kind: "shape" };
}
const segs = (p) => p.split(".");
const rootField = (p) => segs(p)[0].replace(/\[\]$/, "");

/**
 * Every value at `path` in `record`. Yields { value, fieldPath, index, absent, shape }.
 * Array segments ("x[]") iterate per element and keep the element index.
 */
function valuesAt(record, path) {
  const out = [];
  const walk = (obj, rest, at, index) => {
    if (!rest.length) return out.push({ value: obj, fieldPath: at, index });
    const seg = rest[0];
    const arr = seg.endsWith("[]");
    const name = arr ? seg.slice(0, -2) : seg;
    const here = at ? `${at}.${name}` : name;
    if (!isPlainObject(obj)) return out.push({ value: obj, fieldPath: here, index, shape: true });
    if (!(name in obj) || obj[name] === undefined) return out.push({ value: null, fieldPath: here, index, absent: true });
    const v = obj[name];
    if (arr) {
      if (v === null) return out.push({ value: null, fieldPath: here, index, absent: true });
      if (!Array.isArray(v)) return out.push({ value: v, fieldPath: here, index, shape: true });
      v.forEach((el, i) => walk(el, rest.slice(1), `${here}[${i}]`, i));
      return undefined;
    }
    if (rest.length > 1 && (v === null)) return out.push({ value: null, fieldPath: here, index, absent: true });
    return walk(v, rest.slice(1), here, index);
  };
  walk(record, segs(path), "", null);
  return out;
}

/* ---------------------------------------------------------- catalog build */
/** Catalog = explicit relationships + every other Media reference in the inventory. */
export function buildReferenceCatalog(inventory) {
  if (!isPlainObject(inventory) || !Array.isArray(inventory.models)) throw new LifecycleError("CATALOG_INVALID", "source inventory has no models", EXIT.VALIDATION_FAILURE);
  const explicitKeys = new Set(EXPLICIT.filter((r) => r.kind === "ref").map((r) => `${r.source}:${r.path.replace(/\[\]$/, "")}`));
  const derived = [];
  for (const m of inventory.models) {
    for (const f of m.fields || []) {
      if (f.ref !== "Media") continue;
      if (explicitKeys.has(`${m.collection}:${f.path}`)) continue;
      const path = f.type === "Array" ? `${f.path}[]` : f.path;
      derived.push(R(`media.${m.collection}.${f.path.replace(/\[\]/g, "")}`, "media", m.collection, path, "media", { required: Boolean(f.required), blocks: ["asset-cleanup"], derived: true }));
    }
  }
  const relationships = [...EXPLICIT, ...derived].sort((a, b) => a.id.localeCompare(b.id));
  const ids = relationships.map((r) => r.id);
  if (new Set(ids).size !== ids.length) throw new LifecycleError("CATALOG_INVALID", "duplicate relationship id", EXIT.VALIDATION_FAILURE);
  const body = { schemaVersion: CATALOG_SCHEMA_VERSION, relationships, excluded: EXCLUDED };
  return { relationships, catalogVersion: digestOf(body), allowedFields: allowedFields(relationships) };
}

function allowedFields(relationships) {
  const allow = new Map();
  const add = (c, p) => {
    if (!allow.has(c)) allow.set(c, new Set(["_id"]));
    allow.get(c).add(p);
  };
  for (const r of relationships) {
    if (r.kind === "agreement") r.fields.forEach((f) => add(r.source, f));
    else add(r.source, r.path);
    if (r.kind === "ownership") { add(r.source, r.sourceOwner); add(r.target, r.targetOwner); }
    if (r.kind === "reciprocal") { if (r.back) add(r.target, r.back); if (r.agree) { add(r.source, r.agree[0]); add(r.target, r.agree[1]); } }
    if (r.kind === "polymorphic") { add(r.source, r.typeField); Object.values(r.targets).forEach((t) => add(t, "_id")); }
    if (r.kind === "conditional") add("procurementvendors", "userId");
    if (r.target) add(r.target, "_id");
  }
  for (const [c, fs] of Object.entries(EXTRA_FIELDS)) fs.forEach((f) => add(c, f));
  return allow;
}

/**
 * Compare the catalog with the inventory. Returns a list of problems; empty
 * means every catalog field exists with the expected target, and every
 * inventory reference field is covered or excluded with a reason.
 */
export function catalogDrift(inventory, catalog = buildReferenceCatalog(inventory)) {
  const problems = [];
  const byCollection = new Map(inventory.models.map((m) => [m.collection, m]));
  const modelOf = new Map(inventory.models.map((m) => [m.name, m.collection]));
  const field = (c, p) => byCollection.get(c)?.fields.find((f) => f.path === p.replace(/\[\]$/, ""));
  const covered = new Set();
  for (const r of catalog.relationships) {
    if (!byCollection.has(r.source)) { problems.push(`${r.id}: unknown source collection ${r.source}`); continue; }
    const paths = r.kind === "agreement" ? r.fields : [r.path];
    for (const p of paths) {
      const f = field(r.source, p);
      if (!f) { problems.push(`${r.id}: ${r.source}.${p} is not in the inventory`); continue; }
      covered.add(`${r.source}:${f.path}`);
      if (r.kind === "polymorphic") {
        const t = byCollection.get(r.source).fields.find((x) => x.path === r.typeField);
        const keys = Object.keys(r.targets).sort();
        if (!t || JSON.stringify([...(t.enum || [])].sort()) !== JSON.stringify(keys)) problems.push(`${r.id}: ${r.typeField} enum no longer matches the mapped entity types`);
        for (const tc of Object.values(r.targets)) if (!byCollection.has(tc)) problems.push(`${r.id}: unknown target ${tc}`);
        continue;
      }
      const target = r.target ?? null;
      if (target && f.ref && modelOf.get(f.ref) !== target) problems.push(`${r.id}: ${r.source}.${f.path} now references ${f.ref}`);
      if (target && !f.ref) problems.push(`${r.id}: ${r.source}.${f.path} is no longer a reference`);
      if (p.endsWith("[]") !== (f.type === "Array" && !p.includes("[]."))) {
        if (!p.includes("[].")) problems.push(`${r.id}: ${r.source}.${f.path} array shape changed`);
      }
      if (r.kind === "ref" && !r.historical && Boolean(f.required) !== Boolean(r.required) && !r.derived) problems.push(`${r.id}: required flag differs from the model`);
    }
  }
  for (const m of inventory.models) {
    for (const f of m.fields || []) {
      if (!f.ref && !f.refPath) continue;
      if (covered.has(`${m.collection}:${f.path}`)) continue;
      const leaf = f.path.split(".").pop();
      if (EXCLUDED[`${m.name}.${f.path}`] || EXCLUDED[`*.${leaf}`]) continue;
      problems.push(`uncovered reference field ${m.name}.${f.path} (add it to the catalog or exclude it with a reason)`);
    }
  }
  for (const k of Object.keys(EXCLUDED)) {
    if (k.startsWith("*.")) continue;
    const [name, ...rest] = k.split(".");
    const m = inventory.models.find((x) => x.name === name);
    if (!m || !m.fields.some((f) => f.path === rest.join("."))) problems.push(`exclusion ${k} no longer matches a model field`);
  }
  return problems;
}

/* ---------------------------------------------------------- snapshot */
function flattenPaths(value, prefix, out) {
  if (Array.isArray(value)) {
    if (!value.length) out.add(`${prefix}[]`);
    for (const el of value) {
      if (isPlainObject(el) && !("$oid" in el)) for (const [k, v] of Object.entries(el)) flattenPaths(v, `${prefix}[].${k}`, out);
      else out.add(`${prefix}[]`);
    }
  } else if (isPlainObject(value) && !("$oid" in value)) {
    for (const [k, v] of Object.entries(value)) flattenPaths(v, prefix ? `${prefix}.${k}` : k, out);
    if (!Object.keys(value).length) out.add(prefix);
  } else out.add(prefix);
}

/** Validate and normalise a snapshot. Throws LifecycleError (exit 4 / 5). */
export function validateReferenceSnapshot(doc, catalog) {
  const bad = (msg, code = EXIT.VALIDATION_FAILURE) => {
    throw new LifecycleError("INVALID_SNAPSHOT", msg, code);
  };
  if (!isPlainObject(doc)) bad("snapshot must be a JSON object");
  if (doc.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) bad("snapshot schema version is not supported", EXIT.UNSUPPORTED_VERSION);
  for (const k of Object.keys(doc)) if (!["schemaVersion", "source", "capture", "collections"].includes(k)) bad(`snapshot has an unsupported top-level field (${k})`);
  const s = doc.source;
  if (!isPlainObject(s)) bad("snapshot source metadata is missing");
  if (!["synthetic", "captured"].includes(s.kind)) bad("snapshot source.kind must be synthetic or captured");
  if (!isSha256(s.targetFingerprint)) bad("snapshot source.targetFingerprint must be a sha256 digest");
  if (!isUtcTimestamp(s.capturedAt)) bad("snapshot source.capturedAt must be a UTC timestamp");
  if (s.applicationCommit !== null && !GIT_COMMIT_RE.test(String(s.applicationCommit))) bad("snapshot source.applicationCommit must be a 40-character commit or null");
  if (s.profileAlias !== undefined && !/^[a-z0-9][a-z0-9_-]{1,62}$/.test(String(s.profileAlias))) bad("snapshot source.profileAlias is invalid");
  for (const k of Object.keys(s)) if (!["kind", "targetFingerprint", "capturedAt", "applicationCommit", "profileAlias"].includes(k)) bad(`snapshot source has an unsupported field (${k})`);
  const cap = doc.capture;
  if (!isPlainObject(cap) || typeof cap.complete !== "boolean" || !isPlainObject(cap.collections)) bad("snapshot capture metadata is missing");
  if (!isPlainObject(doc.collections)) bad("snapshot collections are missing");
  if (findSecrets(doc).length) bad("snapshot contains secret-like content");

  for (const [c, meta] of Object.entries(cap.collections)) {
    if (!catalog.allowedFields.has(c)) bad(`capture names a collection outside the reference catalog (${c})`);
    if (!isPlainObject(meta) || typeof meta.complete !== "boolean" || !Array.isArray(meta.fields)) bad(`capture metadata for ${c} needs { complete, fields }`);
    for (const f of meta.fields) if (!catalog.allowedFields.get(c).has(f)) bad(`capture lists a field that reference checking does not need (${c}.${f})`);
  }
  for (const [c, records] of Object.entries(doc.collections)) {
    if (!catalog.allowedFields.has(c)) bad(`snapshot contains a collection outside the reference catalog (${c})`);
    if (!cap.collections[c]) bad(`snapshot collection ${c} has no capture metadata`);
    if (!Array.isArray(records)) bad(`snapshot collection ${c} must be an array`);
    const allow = catalog.allowedFields.get(c);
    const declared = new Set(cap.collections[c].fields);
    const seen = new Set();
    for (const rec of records) {
      if (!isPlainObject(rec)) bad(`snapshot collection ${c} has a record that is not an object`);
      const id = readId(rec._id);
      if (id.kind !== "id") bad(`snapshot collection ${c} has a record without a valid _id`);
      if (seen.has(id.id)) bad(`snapshot collection ${c} repeats an _id`);
      seen.add(id.id);
      const paths = new Set();
      flattenPaths(rec, "", paths);
      for (const p of paths) {
        // Exact leaf, or an empty/null container of an allowed leaf (e.g. "comments[]" for "comments[].authorId").
        const ok = allow.has(p) || [...allow].some((a) => a.startsWith(`${p}.`) || a.startsWith(`${p}[]`));
        if (!ok) bad(`snapshot carries a field reference checking does not need (${c}.${p}); only identifiers and reference fields are accepted`);
        const root = p.split(/[.[]/)[0];
        if (root !== "_id" && ![...declared].some((d) => d.split(/[.[]/)[0] === root)) bad(`snapshot carries ${c}.${root}, which its capture metadata does not declare`);
      }
    }
  }
  return doc;
}

/* ---------------------------------------------------------- evaluation */
/**
 * Evaluate a validated snapshot. Returns the report object. Never mutates
 * the snapshot (it is cloned first).
 */
export function evaluateReferences(snapshotInput, catalog) {
  const snapshot = structuredClone(snapshotInput);
  validateReferenceSnapshot(snapshot, catalog);
  const cap = snapshot.capture;
  const data = snapshot.collections;
  const captured = (c) => Boolean(cap.collections[c]) && Array.isArray(data[c]);
  const completeColl = (c) => captured(c) && cap.collections[c].complete === true;
  const hasField = (c, p) => captured(c) && cap.collections[c].fields.some((f) => f === p || f.split(/[.[]/)[0] === rootField(p));
  const index = new Map();
  for (const [c, recs] of Object.entries(data)) index.set(c, new Map(recs.map((r) => [readId(r._id).id, r])));
  const lookup = (c, id) => index.get(c)?.get(id) ?? null;

  const findings = [];
  const counts = Object.fromEntries(STATES.map((s) => [s, 0]));
  const examined = new Set();
  let references = 0;
  const relStatus = [];

  const emit = (r, rec, at, state, extra = {}) => {
    counts[state]++;
    const severity = extra.severity ?? null;
    const evidence = Boolean(r.retirementEvidence) && state === "VALID";
    const report = !["VALID", "NULL_ALLOWED"].includes(state) || evidence;
    if (!report) return;
    findings.push({
      relationship: r.id,
      group: r.group,
      kind: r.kind,
      sourceCollection: r.source,
      sourceId: readId(rec._id).id,
      fieldPath: at.fieldPath,
      arrayIndex: at.index ?? null,
      targetCollection: extra.targetCollection ?? r.target ?? null,
      targetId: extra.targetId ?? null,
      state,
      severity: evidence ? "IMPORTANT" : severity,
      classification: extra.classification ?? (evidence ? "RETIREMENT_EVIDENCE" : r.historical ? "HISTORICAL_REVIEW" : "INTEGRITY_FINDING"),
      cleanupBlocker: r.blocks.length ? [...r.blocks] : null,
      code: extra.code ?? state,
    });
  };

  // Target resolution shared by ref / ownership / reciprocal / polymorphic.
  const resolve = (targetColl, id) => {
    if (!captured(targetColl)) return { state: "INCOMPLETE_EVIDENCE", code: "TARGET_COLLECTION_NOT_CAPTURED" };
    const t = lookup(targetColl, id);
    if (t) return { state: "VALID", target: t };
    if (!completeColl(targetColl)) return { state: "INCOMPLETE_EVIDENCE", code: "TARGET_COLLECTION_PARTIAL" };
    return { state: "MISSING_TARGET" };
  };

  for (const r of catalog.relationships) {
    const status = { relationship: r.id, kind: r.kind, group: r.group, status: "EVALUATED", references: 0 };
    relStatus.push(status);
    const fieldsNeeded = r.kind === "agreement" ? r.fields : [r.path];
    if (!captured(r.source) || !fieldsNeeded.every((p) => hasField(r.source, p))) {
      status.status = "NOT_EVALUATED";
      status.reason = captured(r.source) ? "reference field not captured" : "source collection not captured";
      continue;
    }
    if (!completeColl(r.source)) status.status = "PARTIAL";
    for (const rec of data[r.source]) {
      examined.add(`${r.source}:${readId(rec._id).id}`);
      if (r.kind === "agreement") {
        references++; status.references++;
        const [a, b] = r.fields.map((f) => readId(valuesAt(rec, f)[0]?.value));
        if (a.kind === "id" && b.kind === "id" && a.id !== b.id) emit(r, rec, { fieldPath: r.fields.join("|"), index: null }, "RECIPROCAL_MISMATCH", { severity: r.severity, code: "CANONICAL_LEGACY_DISAGREE", targetCollection: "crmdeals" });
        else counts.VALID++;
        continue;
      }
      if (r.kind === "conditional") {
        references++; status.references++;
        const at = { fieldPath: r.path, index: null };
        if (typeof rec.isInternal !== "boolean") { emit(r, rec, at, "INCOMPLETE_EVIDENCE", { severity: "IMPORTANT", code: "ACCESS_CLASSIFICATION_NOT_CAPTURED" }); continue; }
        if (rec.isInternal) { counts.NULL_ALLOWED++; continue; }
        const id = readId(rec.clientId);
        if (id.kind === "id") { counts.VALID++; continue; } // target existence is checked by user.customer
        if (id.kind !== "null") continue; // malformed / shape reported by user.customer
        if (!captured("procurementvendors") || !hasField("procurementvendors", "userId") || !hasField("procurementvendors", "isActive") || !completeColl("procurementvendors")) {
          emit(r, rec, at, "INCOMPLETE_EVIDENCE", { severity: "IMPORTANT", code: "VENDOR_PROFILES_NOT_CAPTURED" });
          continue;
        }
        const me = readId(rec._id).id;
        const vendor = data.procurementvendors.some((v) => readId(v.userId).id === me && v.isActive === true);
        if (vendor) { counts.NULL_ALLOWED++; continue; }
        emit(r, rec, at, "MISSING_REQUIRED_REFERENCE", { severity: rec.isActive === false ? "IMPORTANT" : "CRITICAL", code: rec.isActive === false ? "INACTIVE_EXTERNAL_USER_WITHOUT_COMPANY" : "ACTIVE_EXTERNAL_USER_WITHOUT_COMPANY" });
        continue;
      }
      for (const at of valuesAt(rec, r.path)) {
        references++; status.references++;
        if (at.shape) { emit(r, rec, at, "UNSUPPORTED_SHAPE", { severity: atLeast(r.severity, "IMPORTANT") }); continue; }
        const id = readId(at.value);
        if (id.kind === "shape") { emit(r, rec, at, "UNSUPPORTED_SHAPE", { severity: atLeast(r.severity, "IMPORTANT") }); continue; }
        if (id.kind === "malformed") { emit(r, rec, at, "MALFORMED_REFERENCE", { severity: r.historical ? "IMPORTANT" : atLeast(r.severity, "IMPORTANT") }); continue; }
        if (id.kind === "null") {
          if (r.kind === "ref" && r.required) emit(r, rec, at, "MISSING_REQUIRED_REFERENCE", { severity: r.historical ? "IMPORTANT" : r.severity });
          else if (r.kind === "polymorphic" && r.required) emit(r, rec, at, "MISSING_REQUIRED_REFERENCE", { severity: r.severity });
          else counts.NULL_ALLOWED++;
          continue;
        }
        if (r.kind === "polymorphic") {
          const type = rec[r.typeField];
          const tc = typeof type === "string" ? r.targets[type] : undefined;
          if (!tc) { emit(r, rec, at, "UNKNOWN_TARGET_TYPE", { severity: r.severity, targetId: id.id, targetCollection: null, code: type == null ? "ENTITY_TYPE_MISSING" : "ENTITY_TYPE_UNMAPPED" }); continue; }
          const res = resolve(tc, id.id);
          if (res.state === "VALID") counts.VALID++;
          else emit(r, rec, at, res.state, { severity: r.severity, targetId: id.id, targetCollection: tc, code: res.code });
          continue;
        }
        const res = resolve(r.target, id.id);
        if (r.kind === "ref") {
          if (res.state === "VALID") emit(r, rec, at, "VALID", { targetId: id.id });
          else if (res.state === "MISSING_TARGET" && r.historical) emit(r, rec, at, "MISSING_TARGET", { severity: "INFORMATIONAL", targetId: id.id, classification: "HISTORICAL_REVIEW", code: "HISTORICAL_ACTOR_ABSENT" });
          else emit(r, rec, at, res.state, { severity: res.state === "INCOMPLETE_EVIDENCE" ? "IMPORTANT" : r.severity, targetId: id.id, code: res.code });
          continue;
        }
        // ownership / reciprocal: only meaningful once the target resolves;
        // a missing target is reported by the matching "ref" relationship.
        if (res.state !== "VALID") { counts.NOT_COMPARABLE++; continue; }
        if (r.kind === "ownership") {
          if (!hasField(r.target, r.targetOwner) || !hasField(r.source, r.sourceOwner)) { emit(r, rec, at, "INCOMPLETE_EVIDENCE", { severity: "IMPORTANT", targetId: id.id, code: "OWNER_FIELD_NOT_CAPTURED" }); continue; }
          const mine = readId(rec[r.sourceOwner]);
          const theirs = readId(res.target[r.targetOwner]);
          if (mine.kind !== "id" || theirs.kind !== "id") { counts.NOT_COMPARABLE++; continue; }
          if (mine.id === theirs.id) counts.VALID++;
          else emit(r, rec, at, "OWNERSHIP_MISMATCH", { severity: r.severity, targetId: id.id, code: "CUSTOMER_DIFFERS" });
          continue;
        }
        if (r.kind === "reciprocal") {
          const tf = r.back ?? r.agree[1];
          if (!hasField(r.target, tf)) { emit(r, rec, at, "INCOMPLETE_EVIDENCE", { severity: "IMPORTANT", targetId: id.id, code: "BACK_LINK_NOT_CAPTURED" }); continue; }
          if (r.back) {
            const back = readId(res.target[r.back]);
            if (back.kind === "id" && back.id === readId(rec._id).id) counts.VALID++;
            else emit(r, rec, at, "RECIPROCAL_MISMATCH", { severity: r.severity, targetId: id.id, code: back.kind === "null" ? "BACK_LINK_MISSING" : "BACK_LINK_POINTS_ELSEWHERE" });
          } else {
            const a = readId(rec[r.agree[0]]);
            const b = readId(res.target[r.agree[1]]);
            if (a.kind !== "id" || b.kind !== "id") counts.NOT_COMPARABLE++;
            else if (a.id === b.id) counts.VALID++;
            else emit(r, rec, at, "RECIPROCAL_MISMATCH", { severity: r.severity, targetId: id.id, code: "LINKED_USER_DIFFERS" });
          }
        }
      }
    }
  }

  findings.sort((a, b) => a.relationship.localeCompare(b.relationship) || a.sourceCollection.localeCompare(b.sourceCollection)
    || a.sourceId.localeCompare(b.sourceId) || a.fieldPath.localeCompare(b.fieldPath) || (a.arrayIndex ?? -1) - (b.arrayIndex ?? -1));
  const notEvaluated = relStatus.filter((s) => s.status === "NOT_EVALUATED").length;
  const partial = relStatus.filter((s) => s.status === "PARTIAL").length;
  const incompleteColls = Object.entries(cap.collections).filter(([, m]) => !m.complete).map(([c]) => c).sort();
  const complete = cap.complete === true && notEvaluated === 0 && partial === 0 && incompleteColls.length === 0 && counts.INCOMPLETE_EVIDENCE === 0;
  const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, findings.filter((f) => f.severity === s && f.classification !== "RETIREMENT_EVIDENCE").length]));
  const blockers = {};
  for (const f of findings) for (const b of f.cleanupBlocker || []) blockers[b] = (blockers[b] || 0) + 1;

  return {
    reportVersion: REPORT_VERSION,
    readOnly: true,
    source: {
      kind: snapshot.source.kind,
      profileAlias: snapshot.source.profileAlias ?? null,
      targetFingerprint: snapshot.source.targetFingerprint,
      capturedAt: snapshot.source.capturedAt,
      applicationCommit: snapshot.source.applicationCommit,
    },
    snapshotDigest: digestOf(snapshotInput),
    catalogVersion: catalog.catalogVersion,
    evidence: {
      complete,
      incompleteCollections: incompleteColls,
      relationshipsNotEvaluated: notEvaluated,
      relationshipsPartial: partial,
      conclusion: complete
        ? "Findings describe the supplied snapshot only. They do not prove production integrity and do not authorise any cleanup."
        : "INCOMPLETE EVIDENCE: findings are a lower bound and the absence of a finding means nothing. Not proof of production integrity; no cleanup authorised.",
    },
    meaning: {
      states: "VALID / NULL_ALLOWED are counted, not listed (except legacy Production links, listed as RETIREMENT_EVIDENCE). MISSING_TARGET and MALFORMED_REFERENCE are distinct; OWNERSHIP_MISMATCH means the target exists but belongs to another customer; NOT_COMPARABLE means an ownership or reciprocal check could not be made (target missing, or an owner value absent).",
      cleanupBlocker: "Names the cleanup a finding must be resolved before. It never marks anything safe to modify or delete, and no repair instruction is given.",
      historical: "A missing historical actor (requester, author, approver) is INFORMATIONAL review: deletion of that user may be legitimate. Tenant and ownership relationships are never downgraded for this reason.",
    },
    summary: {
      relationshipsInCatalog: catalog.relationships.length,
      relationshipsChecked: relStatus.length - notEvaluated,
      relationshipsNotEvaluated: notEvaluated,
      sourceRecordsExamined: examined.size,
      referencesExamined: references,
      valid: counts.VALID,
      nullAllowed: counts.NULL_ALLOWED,
      missingRequired: counts.MISSING_REQUIRED_REFERENCE,
      missingTargets: counts.MISSING_TARGET,
      malformed: counts.MALFORMED_REFERENCE,
      ownershipMismatches: counts.OWNERSHIP_MISMATCH,
      reciprocalMismatches: counts.RECIPROCAL_MISMATCH,
      unknownTargetTypes: counts.UNKNOWN_TARGET_TYPE,
      unsupportedShapes: counts.UNSUPPORTED_SHAPE,
      incompleteEvidence: counts.INCOMPLETE_EVIDENCE + notEvaluated,
      notComparable: counts.NOT_COMPARABLE,
      findingsBySeverity: bySeverity,
      productionRetirementEvidence: findings.filter((f) => f.classification === "RETIREMENT_EVIDENCE").length,
      cleanupBlockers: Object.fromEntries(Object.entries(blockers).sort(([a], [b]) => a.localeCompare(b))),
    },
    relationships: relStatus,
    findings,
  };
}
