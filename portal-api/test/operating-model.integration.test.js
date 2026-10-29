// Real MongoDB transactions against a fresh, local, disposable database only.
// MONGO_TEST_URI=.../expresso_operating_test?replicaSet=... node --test test/operating-model.integration.test.js
import "./setup-env.js";
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { call, stopApp } from "./helpers.js";
import { resetTransactionSupportCache } from "../src/utils/transaction.js";
import Enrollment from "../src/modules/enrollments/enrollment.model.js";
import Project from "../src/modules/projects/project.model.js";
import Customer from "../src/modules/customers/customer.model.js";
import ServiceTemplate from "../src/modules/services/serviceTemplate.model.js";
import Job from "../src/modules/content/jobs/job.model.js";
import DeliveryPeriod from "../src/modules/operating/deliveryPeriod.model.js";
import User from "../src/modules/iam/users/user.model.js";
import Role from "../src/modules/iam/roles/role.model.js";
import Team from "../src/modules/iam/teams/team.model.js";
import Deal from "../src/modules/crm/deals/deal.model.js";

const uri = process.env.MONGO_TEST_URI || "", skip = !uri;
let lead, account, manager, other, customer, template, team;
const req = () => randomUUID();
const permissions = ["crm.read", "crm.write", "customers.read", "customers.write", "enrollments.read", "enrollments.write", "projects.read", "projects.write", "projects.delete", "jobs.read", "jobs.write", "jobs.delete", "jobs.approve", "services.read"];
before(async () => {
  if (skip) return;
  const parsed = new URL(uri.replace(/^mongodb(\+srv)?:/, "http:"));
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname), "Only loopback test databases are permitted");
  assert.match(parsed.pathname, /test/i, "Explicit test database name is required");
  await mongoose.connect(uri, { dbName: `expresso_operating_phase1_test_${process.pid}` });
  assert.ok((await mongoose.connection.db.admin().command({ hello: 1 })).setName);
  await Promise.all([Enrollment, Project, Customer, ServiceTemplate, Job, DeliveryPeriod, User, Role, Team].map((m) => m.init()));
  resetTransactionSupportCache();
});
beforeEach(async () => {
  if (skip) return;
  for (const model of [Enrollment, Project, Customer, ServiceTemplate, Job, DeliveryPeriod, User, Role, Team]) await model.deleteMany({});
  await Role.create([{ key: "delivery_operator", label: "Delivery operator", isInternal: true, permissions }, { key: "delivery_manager", label: "Delivery manager", isInternal: true, permissions: [...permissions, "delivery.override"] }]);
  [lead, account, manager, other] = await User.create(["Lead", "Account", "Manager", "Other"].map((name) => ({ fullName: name, email: `${name.toLowerCase()}@operating.test`, passwordHash: "synthetic-not-a-login", role: name === "Manager" ? "delivery_manager" : "delivery_operator", isActive: true })));
  team = await Team.create({ key: "delivery", label: "Delivery", leadUserId: lead._id });
  customer = await Customer.create({ companyName: "SAH", contactName: "SAH Contact", slug: "sah-test", accountManagerId: account._id });
  template = await ServiceTemplate.create({ name: "Social", slug: "social-test", status: "active", scopeGroups: [], executionMode: "recurring" });
});
after(async () => { await stopApp(); if (!skip && mongoose.connection.readyState) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); } });
const post = (path, body = {}, user = lead) => call("POST", path, { user, body: { requestId: req(), ...body } });
function agreed(scope = null) {
  return { startDate: "2026-11-01", endDate: "2026-12-31", effectiveDate: "2026-11-01", timezone: "Asia/Dubai", deliveryCadence: scope?.mode === "phased_project" ? "once" : "monthly",
    scope: scope || { mode: "recurring", groups: [{ id: "social", title: "Social", jobs: [{ id: "posts", title: "Post", type: "post", quantity: 6 }, { id: "videos", title: "Video", type: "video", quantity: 8 }] }] },
    executionLeadId: String(lead._id), accountOwnerId: String(account._id), teamId: String(team._id), price: 1000, currency: "AED", billingCycle: "monthly",
    reference: "Illustrative signed agreement", clientContact: "SAH Contact", acceptedAt: "2026-10-01", reason: "Confirmed actual agreement",
    approvalRoute: [{ id: "lead", purpose: "Lead review", required: true, source: "EXECUTION_LEAD" }, { id: "client", purpose: "Client acceptance", required: true, source: "CLIENT_EXTERNAL_RECORDED" }] };
}
async function enrollment() {
  const e = await Enrollment.create({ customerId: customer._id, serviceTemplateId: template._id });
  const confirmation = await post(`/api/enrollments/${e._id}/operating/confirm`, agreed()); assert.equal(confirmation.status, 200, JSON.stringify(confirmation.body));
  return e;
}
async function action(job, command, body = {}, user = lead) {
  const current = await Job.findById(job._id).lean();
  return post(`/api/jobs/${job._id}/operating/${command}`, { expectedVersion: current.operating.version, ...body }, user);
}
async function deliver(job) {
  let r = await action(job, "submit", { outputReference: "Private final file reference" }); assert.equal(r.status, 200, JSON.stringify(r.body));
  const revision = r.body.item.operating.submission.revision;
  r = await action(job, "decide", { stepId: "lead", revision, decision: "approved" }); assert.equal(r.status, 200, JSON.stringify(r.body));
  r = await action(job, "decide", { stepId: "client", revision, decision: "approved", clientContact: "SAH Client", clientApprovedAt: "2026-10-01", evidence: "Written client approval" }, account); assert.equal(r.status, 200, JSON.stringify(r.body));
  r = await action(job, "complete", { evidence: "Delivered final files" }); assert.equal(r.status, 200, JSON.stringify(r.body));
}
test("SAH: monthly entitlement, reviewed carry, original credit, historical outstanding and waiver", { skip }, async () => {
  const e = await enrollment();
  const activation = await post(`/api/enrollments/${e._id}/operating/activate`); assert.equal(activation.status, 200, JSON.stringify(activation.body));
  const november = activation.body.period;
  let jobs = await Job.find({ originDeliveryPeriodId: november._id }).lean(); assert.equal(jobs.length, 14);
  for (const type of ["post", "video"]) { const list = jobs.filter((j) => j.type === type); for (const job of list.slice(0, -1)) await deliver(job); }
  const cutoff = new Date().toISOString();
  const opening = await post(`/api/enrollments/${e._id}/operating/open-period`, { periodStart: "2026-12-01" }); assert.equal(opening.status, 200, JSON.stringify(opening.body));
  const december = opening.body.period;
  const pending = await Job.find({ originDeliveryPeriodId: november._id, "operating.disposition": "outstanding" }).lean(); assert.equal(pending.length, 2);
  const carryBody = { requestId: req(), expectedVersion: 0, reason: "Carry two unfinished November obligations", decisions: pending.map((j) => ({ jobId: String(j._id), decision: "carry", toPeriodId: december._id })) };
  const carry = await post(`/api/enrollments/${e._id}/operating/periods/${november._id}/reconcile`, carryBody); assert.equal(carry.status, 200, JSON.stringify(carry.body));
  assert.equal((await post(`/api/enrollments/${e._id}/operating/periods/${november._id}/reconcile`, carryBody)).body.repeated, true);
  const repeatedDecision = { ...carryBody, requestId: req(), expectedVersion: carry.body.period.operatingVersion };
  assert.equal((await post(`/api/enrollments/${e._id}/operating/periods/${november._id}/reconcile`, repeatedDecision)).status, 400, "A new command cannot carry work into its current work period again");
  let view = await call("GET", `/api/enrollments/${e._id}/operating`, { user: lead }); assert.equal(view.status, 200, JSON.stringify(view.body));
  const rows = view.body.periods.find((p) => p._id === december._id).summary;
  assert.deepEqual(rows.map((r) => [r.base, r.carryIn, r.workload]), [[6, 1, 7], [8, 1, 9]]);
  assert.equal(await Job.countDocuments({ enrollmentId: e._id }), 28);
  for (const old of pending) { const j = await Job.findById(old._id).lean(); assert.equal(String(j.originDeliveryPeriodId), november._id); assert.equal(String(j.workDeliveryPeriodId), december._id); }
  await deliver(pending[0]);
  const waiver = await action(pending[1], "waive", { reason: "Client explicitly waived this item" }, manager); assert.equal(waiver.status, 200, JSON.stringify(waiver.body));
  view = await call("GET", `/api/enrollments/${e._id}/operating?cutoff=${encodeURIComponent(cutoff)}`, { user: lead });
  assert.deepEqual(view.body.periods.find((p) => p._id === november._id).summary.map((r) => r.outstanding), [1, 1]);
  view = await call("GET", `/api/enrollments/${e._id}/operating`, { user: lead });
  const novemberRows = view.body.periods.find((p) => p._id === november._id).summary;
  assert.equal(novemberRows.reduce((n, r) => n + r.completed, 0), 13); assert.equal(novemberRows.reduce((n, r) => n + r.waived, 0), 1);
  assert.deepEqual(view.body.periods.find((p) => p._id === december._id).summary.map((r) => r.base), [6, 8]);
});
test("concurrent/repeated Enrollment activation and period opening create one set of obligations", { skip }, async () => {
  const e = await enrollment(); const path = `/api/enrollments/${e._id}/operating/activate`;
  assert.equal((await post(path, { periodStart: "2026-12-01" })).status, 400, "Activation cannot silently skip the confirmed first period");
  assert.equal(await DeliveryPeriod.countDocuments({}), 0); assert.equal(await Job.countDocuments({}), 0);
  const replies = await Promise.all([post(path), post(path)]); assert.deepEqual(replies.map((r) => r.status), [200, 200], JSON.stringify(replies));
  assert.equal((await post(path)).body.repeated, true); assert.equal(await DeliveryPeriod.countDocuments({}), 1); assert.equal(await Job.countDocuments({}), 14);
  const next = `/api/enrollments/${e._id}/operating/open-period`, body = { periodStart: "2026-12-01" };
  const openings = await Promise.all([post(next, body), post(next, body)]); assert.deepEqual(openings.map((r) => r.status), [200, 200], JSON.stringify(openings));
  assert.equal((await post(next, body)).body.repeated, true); assert.equal(await DeliveryPeriod.countDocuments({}), 2); assert.equal(await Job.countDocuments({}), 28);
  assert.equal((await post(next, { periodStart: "2026-11-15", partialDecision: { quantities: { posts: 6, videos: 8 }, reason: "Reviewed quantities" } })).status, 409);
});
test("extra units, concurrency, pause, expiry and future revisions preserve accepted history", { skip }, async () => {
  const e = await enrollment(); const active = await post(`/api/enrollments/${e._id}/operating/activate`); const p = active.body.period;
  const path = `/api/enrollments/${e._id}/operating/periods/${p._id}/adjust`;
  const body = { requestId: req(), expectedVersion: 0, scopeLineId: "videos", quantity: 2, reason: "Approved campaign extras", evidence: "Client addendum" };
  assert.equal((await post(path, body, lead)).status, 403);
  const results = await Promise.all([post(path, body, manager), post(path, body, manager)]); assert.deepEqual(results.map((r) => r.status), [200, 200], JSON.stringify(results));
  assert.equal(await Job.countDocuments({}), 16); assert.equal((await DeliveryPeriod.findById(p._id)).adjustments.length, 1);
  assert.equal((await post(path, { ...body, requestId: req() }, manager)).status, 409);
  assert.equal((await post(`/api/enrollments/${e._id}/operating/state`, { status: "paused", reason: "Client suspension" })).status, 200);
  assert.equal((await post(`/api/enrollments/${e._id}/operating/open-period`, { periodStart: "2026-12-01" })).status, 400);
  assert.equal((await post(`/api/enrollments/${e._id}/operating/state`, { status: "active", reason: "Resume" })).status, 200);
  const owner = await Enrollment.findById(e._id).lean(); const revision = agreed(); revision.effectiveDate = "2026-12-01"; revision.previousRevisionId = owner.agreementRevisions[0].id; revision.scope.groups[0].jobs[0].quantity = 10;
  assert.equal((await post(`/api/enrollments/${e._id}/operating/revise`, revision)).status, 200);
  await ServiceTemplate.updateOne({ _id: template._id }, { price: 99999, executionMode: "one_time" });
  const noteEdit = await call("PATCH", `/api/enrollments/${e._id}`, { user: lead, body: { notes: "Operational note" } }); assert.equal(noteEdit.status, 200, JSON.stringify(noteEdit.body));
  assert.equal((await Enrollment.findById(e._id)).agreementRevisions[0].scope.groups[0].jobs[0].quantity, 6);
  const dec = await post(`/api/enrollments/${e._id}/operating/open-period`, { periodStart: "2026-12-01" }); assert.equal(dec.status, 200, JSON.stringify(dec.body));
  assert.equal(dec.body.period.baseEntitlement[0].quantity, 10); assert.equal((await DeliveryPeriod.findById(p._id)).baseEntitlement[0].quantity, 6);
  assert.equal((await post(`/api/enrollments/${e._id}/operating/open-period`, { periodStart: "2027-01-01" })).status, 400);
});
test("Website: stable phases, ordered acceptance, recorded UAT, direct/CRM origins and repeat activation", { skip }, async () => {
  const scope = { mode: "phased_project", groups: ["Discovery", "Design", "Development", "Testing", "UAT", "Launch"].map((name, i) => ({ id: `phase-${i}`, title: name, jobs: [{ id: `line-${i}`, title: `${name} outcome`, type: "task", quantity: 1 }] })) };
  const project = await Project.create({ customerId: customer._id, name: "Website", type: "website", source: "manual" });
  const confirmation = await post(`/api/projects/${project._id}/operating/confirm`, agreed(scope)); assert.equal(confirmation.status, 200, JSON.stringify(confirmation.body));
  const path = `/api/projects/${project._id}/operating/activate`;
  const activation = await Promise.all([post(path), post(path)]); assert.deepEqual(activation.map((r) => r.status), [200, 200], JSON.stringify(activation));
  assert.equal((await post(path)).body.repeated, true); assert.equal(await DeliveryPeriod.countDocuments({}), 0); assert.equal(await Job.countDocuments({}), 6);
  const jobs = await Job.find({ projectId: project._id }).lean(); assert.deepEqual(jobs.map((j) => j.phaseId), scope.groups.map((g) => g.id));
  assert.equal((await post(`/api/projects/${project._id}/operating/accept-phase`, { phaseId: "phase-0", reason: "Premature" })).status, 400);
  for (const job of jobs) {
    await deliver(job);
    assert.equal((await post(`/api/projects/${project._id}/operating/accept-phase`, { phaseId: job.phaseId, reason: "Outcome reviewed and accepted" })).status, 200);
  }
  const closed = await post(`/api/projects/${project._id}/operating/state`, { status: "completed", reason: "Launched and handed over" }); assert.equal(closed.status, 200, JSON.stringify(closed.body));
  const reopened = await action(jobs[0], "reopen", { reason: "Client requested a correction" }); assert.equal(reopened.status, 200);
  assert.ok((await Project.findById(project._id)).phases.every((p) => !p.acceptedAt));
  const extra = await Project.create({ customerId: customer._id, name: "Extra landing page", source: "sales" });
  const extraAgreement = agreed({ mode: "phased_project", groups: [{ id: "landing", title: "Landing page", jobs: [{ id: "landing-job", title: "Landing page", type: "page", quantity: 1 }] }] });
  assert.equal((await post(`/api/projects/${extra._id}/operating/confirm`, extraAgreement)).status, 200);
  assert.equal((await post(`/api/projects/${extra._id}/operating/activate`)).status, 200); assert.equal(await DeliveryPeriod.countDocuments({}), 0);
});
test("approval double-submit, assigned permission, generic PATCH/publish bypass, blockers and reopening", { skip }, async () => {
  const e = await enrollment(); await post(`/api/enrollments/${e._id}/operating/activate`); let job = await Job.findOne({}).lean();
  assert.equal((await action(job, "complete", { evidence: "Premature" })).status, 400);
  assert.equal((await call("PATCH", `/api/jobs/${job._id}`, { user: lead, body: { status: "approved" } })).status, 400);
  assert.equal((await post(`/api/jobs/${job._id}/publish`, { externalPostUrl: "https://publication.test/item" })).status, 400);
  assert.equal((await action(job, "submit", { outputReference: "Draft 1" })).status, 200);
  job = await Job.findById(job._id).lean(); const body = { expectedVersion: job.operating.version, revision: 1, stepId: "lead", decision: "approved" };
  assert.equal((await post(`/api/jobs/${job._id}/operating/decide`, body, other)).status, 403);
  const approvals = await Promise.all([post(`/api/jobs/${job._id}/operating/decide`, body), post(`/api/jobs/${job._id}/operating/decide`, body)]);
  assert.deepEqual(approvals.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await Job.findById(job._id)).operating.decisions.length, 1);
  assert.equal((await call("PATCH", `/api/jobs/${job._id}`, { user: lead, body: { caption: "Changed output" } })).status, 200);
  assert.equal((await Job.findById(job._id)).operating.submission.submittedAt, null);
  const blocked = await action(job, "start-blocker", { blocker: { reason: "ACCESS", responsibleParty: "CLIENT", note: "Waiting for access", nextAction: "Client sends access" } }); assert.equal(blocked.status, 200);
  assert.equal((await action(job, "end-blocker", { blockerId: blocked.body.item.operating.blockers[0].id, reason: "Access received" })).status, 200);
  const denied = await action(job, "exceptional-complete", { reason: "Attempted override", evidence: "No permission" }, lead); assert.equal(denied.status, 403);
  await deliver(job); assert.equal((await action(job, "reopen", { reason: "Correct final output" })).status, 200);
  const latest = await Job.findById(job._id).lean(); assert.equal(latest.operating.disposition, "outstanding"); assert.ok(latest.operating.events.some((e) => e.action === "completed")); assert.ok(latest.operating.events.some((e) => e.action === "reopened"));
  assert.equal((await call("DELETE", `/api/jobs/${job._id}`, { user: lead })).status, 409);
});
test("reviewed adoption maps only selected legacy Jobs and preserves unmapped work", { skip }, async () => {
  const e = await Enrollment.create({ customerId: customer._id, serviceTemplateId: template._id });
  const legacy = await Job.create([{ customerId: customer._id, enrollmentId: e._id, title: "Reviewed November post", type: "post" }, { customerId: customer._id, enrollmentId: e._id, title: "Unallocated old work", type: "task" }]);
  assert.equal((await post(`/api/enrollments/${e._id}/operating/confirm`, agreed())).status, 400);
  const agreement = { ...agreed(), adoptionReviewed: true, adoptionMappings: [{ jobId: String(legacy[0]._id), scopeLineId: "posts", scopeUnitOrdinal: 1 }] };
  assert.equal((await post(`/api/enrollments/${e._id}/operating/confirm`, agreement)).status, 200);
  assert.equal((await post(`/api/enrollments/${e._id}/operating/activate`)).status, 200);
  assert.equal(await Job.countDocuments({ operatingModelVersion: 1 }), 14); assert.equal(await Job.countDocuments({}), 15);
  assert.equal((await Job.findById(legacy[0]._id)).title, legacy[0].title); assert.equal((await Job.findById(legacy[1]._id)).operatingModelVersion, 0);
});
test("Won CRM handoff activates a linked phased Project without competing agreement truth", { skip }, async () => {
  const deal = await Deal.create({ title: "SAH", stage: "won", status: "open", ownerUserId: lead._id });
  const converted = await post(`/api/crm/deals/${deal._id}/convert-to-customer`); assert.equal(converted.status, 200, JSON.stringify(converted.body));
  const stored = await Deal.findById(deal._id); assert.equal(stored.status, "won"); assert.ok(stored.wonAt);
  const scope = { mode: "phased_project", groups: [{ id: "web-design", title: "Website design", jobs: [{ id: "home", title: "Homepage", type: "page", quantity: 1 }] }] };
  const service = await ServiceTemplate.create({ name: "Website", slug: "website-test", executionMode: "phased_project", scopeGroups: scope.groups });
  const created = await post("/api/enrollments", { customerId: String(customer._id), serviceTemplateId: String(service._id), sourceDealId: String(deal._id), status: "draft" }); assert.equal(created.status, 201, JSON.stringify(created.body));
  const e = created.body.item;
  const confirmed = await post(`/api/enrollments/${e._id}/operating/confirm`, { ...agreed(scope), sourceDealId: String(deal._id) }); assert.equal(confirmed.status, 200, JSON.stringify(confirmed.body));
  const activation = await post(`/api/enrollments/${e._id}/operating/activate`); assert.equal(activation.status, 200, JSON.stringify(activation.body));
  const project = await Project.findById(activation.body.project._id).lean(); assert.equal(project.agreementRevisions.length, 0); assert.equal(project.linkedAgreementRevisionId, confirmed.body.agreement.id);
  assert.equal(String(project.enrollmentId), e._id); assert.equal(await DeliveryPeriod.countDocuments({ enrollmentId: e._id }), 0);
  assert.equal(await Job.countDocuments({ projectId: project._id, phaseId: "web-design" }), 1);
});
test("failed activation rolls back the period, all Jobs and activation state", { skip }, async () => {
  const e = await enrollment(); const original = Job.create; let writes = 0;
  Job.create = async function (...args) { if (++writes === 3) throw new Error("Injected Job creation failure"); return original.apply(this, args); };
  try { assert.equal((await post(`/api/enrollments/${e._id}/operating/activate`)).status, 500); }
  finally { Job.create = original; }
  assert.equal(await DeliveryPeriod.countDocuments({}), 0); assert.equal(await Job.countDocuments({}), 0);
  const stored = await Enrollment.findById(e._id); assert.equal(stored.activatedAt, null); assert.equal(stored.status, "draft"); assert.equal(stored.agreementRevisions.length, 1);
  assert.equal((await post(`/api/enrollments/${e._id}/operating/activate`)).status, 200);
});
test("Account Manager remains separate from client login; reviewers must have effective approval permission", { skip }, async () => {
  const external = await User.create({ fullName: "Client login", email: "client@operating.test", role: "client", clientId: customer._id, passwordHash: "synthetic" });
  await Customer.updateOne({ _id: customer._id }, { ownerUserId: external._id });
  const saved = await call("PATCH", `/api/customers/${customer._id}`, { user: lead, body: { accountManagerId: String(lead._id) } }); assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(String((await Customer.findById(customer._id)).ownerUserId), String(external._id));
  const denied = await call("PATCH", `/api/customers/${customer._id}`, { user: lead, body: { accountManagerId: String(external._id) } }); assert.equal(denied.status, 400);
  const e = await Enrollment.create({ customerId: customer._id, serviceTemplateId: template._id });
  await User.updateOne({ _id: account._id }, { revokedPermissions: ["jobs.approve"] });
  const refused = await post(`/api/enrollments/${e._id}/operating/confirm`, agreed()); assert.equal(refused.status, 400); assert.match(refused.body.message, /jobs.approve/);
  assert.equal((await Enrollment.findById(e._id)).agreementRevisions.length, 0);
});
test("partial first/last months require explicit quantities; no automatic proration", { skip }, async () => {
  const e = await Enrollment.create({ customerId: customer._id, serviceTemplateId: template._id });
  const agreement = { ...agreed(), startDate: "2026-11-15", effectiveDate: "2026-11-15", endDate: "2026-12-15" };
  assert.equal((await post(`/api/enrollments/${e._id}/operating/confirm`, agreement)).status, 200);
  assert.equal((await post(`/api/enrollments/${e._id}/operating/activate`)).status, 400); assert.equal(await Job.countDocuments({}), 0);
  const active = await post(`/api/enrollments/${e._id}/operating/activate`, { partialDecision: { reason: "Agreed first-month quantities", quantities: { posts: 3, videos: 4 } } });
  assert.equal(active.status, 200, JSON.stringify(active.body)); assert.equal(active.body.count, 7);
  assert.equal((await post(`/api/enrollments/${e._id}/operating/open-period`, { periodStart: "2026-12-01" })).status, 400);
  const last = await post(`/api/enrollments/${e._id}/operating/open-period`, { periodStart: "2026-12-01", partialDecision: { reason: "Agreed final-month quantities", quantities: { posts: 5, videos: 6 } } });
  assert.equal(last.status, 200, JSON.stringify(last.body)); assert.deepEqual(last.body.period.baseEntitlement.map((l) => l.quantity), [5, 6]);
});
test("partial-period activation cannot silently omit a reviewed adoption mapping", { skip }, async () => {
  const e = await Enrollment.create({ customerId: customer._id, serviceTemplateId: template._id });
  const legacy = await Job.create({ customerId: customer._id, enrollmentId: e._id, title: "Reviewed legacy unit", type: "post" });
  const agreement = { ...agreed(), startDate: "2026-11-15", effectiveDate: "2026-11-15", adoptionReviewed: true,
    adoptionMappings: [{ jobId: String(legacy._id), scopeLineId: "posts", scopeUnitOrdinal: 6 }] };
  assert.equal((await post(`/api/enrollments/${e._id}/operating/confirm`, agreement)).status, 200);
  const body = { partialDecision: { reason: "Explicit partial-month quantities", quantities: { posts: 3, videos: 4 } } };
  assert.equal((await post(`/api/enrollments/${e._id}/operating/activate`, body)).status, 400);
  assert.equal(await DeliveryPeriod.countDocuments({}), 0); assert.equal(await Job.countDocuments({ operatingModelVersion: 1 }), 0);
  body.partialDecision.quantities.posts = 6;
  assert.equal((await post(`/api/enrollments/${e._id}/operating/activate`, body)).status, 200);
  assert.equal((await Job.findById(legacy._id)).operatingModelVersion, 1);
});
test("expiry stops new entitlement while old obligations remain deliverable and auditable", { skip }, async () => {
  const e = await Enrollment.create({ customerId: customer._id, serviceTemplateId: template._id });
  const agreement = { ...agreed(), startDate: "2025-09-01", effectiveDate: "2025-09-01", endDate: "2025-09-30", acceptedAt: "2025-08-01" };
  assert.equal((await post(`/api/enrollments/${e._id}/operating/confirm`, agreement)).status, 200);
  assert.equal((await post(`/api/enrollments/${e._id}/operating/activate`)).status, 403);
  const activated = await post(`/api/enrollments/${e._id}/operating/activate`, { missedPeriodReason: "Reviewed historical obligations missing their period" }, manager); assert.equal(activated.status, 200, JSON.stringify(activated.body));
  const pending = await Job.find({ enrollmentId: e._id }).lean(); const before = pending[0].originalCommittedDueDate;
  assert.equal((await post(`/api/enrollments/${e._id}/operating/open-period`, { periodStart: "2025-10-01" }, manager)).status, 400);
  assert.equal((await call("GET", `/api/enrollments/${e._id}/operating`, { user: lead })).body.displayState, "Expired — Pending Closure");
  const rescheduled = await call("PATCH", `/api/jobs/${pending[0]._id}`, { user: lead, body: { dueDate: "2026-11-02", operatingChangeReason: "Finish the original obligation after expiry" } }); assert.equal(rescheduled.status, 200);
  await deliver(pending[0]); assert.equal(+new Date((await Job.findById(pending[0]._id)).originalCommittedDueDate), +new Date(before));
  assert.equal(await Job.countDocuments({ enrollmentId: e._id }), 14);
});
