import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { approvalsComplete, normalizeScope, periodSummary, midnight, localDay } from "../src/modules/operating/operating.rules.js";
import Job from "../src/modules/content/jobs/job.model.js";
import DeliveryPeriod from "../src/modules/operating/deliveryPeriod.model.js";
import { setupAuth, restoreAll, stopApp, call, oid } from "./helpers.js";

afterEach(restoreAll); after(stopApp);
test("period identity excludes agreement revision; managed Job index excludes legacy rows", () => {
  const [key, spec] = DeliveryPeriod.schema.indexes().find(([, options]) => options.name === "uniq_enrollment_period_start");
  assert.deepEqual(key, { enrollmentId: 1, periodStart: 1 }); assert.equal(spec.unique, true);
  const managed = Job.schema.indexes().find(([, options]) => options.name === "uniq_managed_obligation")[1];
  assert.deepEqual(managed.partialFilterExpression, { managedObligationKey: { $type: "string" } });
});
test("scope quantities and identifiers are explicit; zero quantity never becomes one", () => {
  const scope = normalizeScope({ mode: "recurring", groups: [{ id: "g", title: "Social", jobs: [{ id: "p", title: "Post", type: "post", quantity: 6 }, { id: "v", title: "Video", type: "video", quantity: 0 }] }] });
  assert.equal(scope.groups[0].jobs[1].quantity, 0);
  assert.throws(() => normalizeScope({ ...scope, groups: [{ ...scope.groups[0], jobs: [{ ...scope.groups[0].jobs[0], quantity: 1.2 }] }] }), /whole numbers/);
  assert.throws(() => normalizeScope({ ...scope, groups: [...scope.groups, scope.groups[0]] }), /Duplicate/);
});
test("required approvals must belong to the active submitted revision", () => {
  const job = { operating: { submission: { revision: 2, submittedAt: new Date(), route: [{ id: "lead", required: true }] }, decisions: [{ revision: 1, stepId: "lead", decision: "approved" }] } };
  assert.equal(approvalsComplete(job), false);
  job.operating.decisions.push({ revision: 2, stepId: "lead", decision: "approved" }); assert.equal(approvalsComplete(job), true);
  job.operating.submission.submittedAt = null; assert.equal(approvalsComplete(job), false);
});
test("carry and later fulfillment preserve origin accounting and historical cutoffs", () => {
  const nov = { _id: "nov", baseEntitlement: [{ scopeLineId: "p", title: "Posts", type: "post", quantity: 1 }] };
  const dec = { _id: "dec", baseEntitlement: [{ scopeLineId: "p", title: "Posts", type: "post", quantity: 6 }] };
  const job = { scopeLineId: "p", originDeliveryPeriodId: "nov", operating: { events: [
    { action: "carried", at: "2026-12-01", facts: { toPeriodId: "dec" } }, { action: "completed", at: "2026-12-03", facts: {} },
  ] } };
  assert.equal(periodSummary(nov, [job], "2026-11-30T23:59:59Z")[0].outstanding, 1);
  assert.equal(periodSummary(nov, [job])[0].completed, 1);
  assert.equal(periodSummary(dec, [job])[0].base, 6); assert.equal(periodSummary(dec, [job])[0].workload, 7);
  assert.equal(periodSummary(dec, [job])[0].completed, 0);
});
test("local period boundaries are explicit, including DST zones", () => {
  assert.equal(midnight("2026-11-01", "Asia/Dubai").toISOString(), "2026-10-31T20:00:00.000Z");
  assert.equal(localDay(midnight("2026-03-09", "America/New_York"), "America/New_York"), "2026-03-09");
});
for (const role of ["client", "vendor"]) test(`${role} cannot acquire internal Operating Model access through grants`, async () => {
  const user = { _id: oid(), role, clientId: oid(), extraPermissions: ["jobs.read", "jobs.write", "jobs.approve", "enrollments.read", "enrollments.write", "projects.write", "delivery.override"] };
  setupAuth({ users: [user] }); const id = oid();
  for (const [method, path] of [["GET", `/api/enrollments/${id}/operating`], ["POST", `/api/projects/${id}/operating/activate`], ["POST", `/api/jobs/${id}/operating/decide`]]) assert.equal((await call(method, path, { user, ...(method === "GET" ? {} : { body: {} }) })).status, 403);
});
