// Stage R2 hardening — vendor approval: invitation wording, duplicate and
// concurrent approval, retry after a failure or an interrupted approval.
// Runs through the real Express app; collections are in-memory (fakeStore.js).
import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { setupAuth, restoreAll, stopApp, oid, call } from "./helpers.js";
import { fakeCollections } from "./fakeStore.js";
import { buildInviteEmail } from "../src/modules/iam/invites/invite.controller.js";
import { LEFTOVER_STALE_MS } from "../src/modules/procurement/vendor-application.controller.js";
import User from "../src/modules/iam/users/user.model.js";
import Invite from "../src/modules/iam/invites/invite.model.js";
import ProcurementVendor from "../src/modules/procurement/vendor.model.js";
import VendorApplication from "../src/modules/procurement/vendor-application.model.js";

afterEach(restoreAll);
after(stopApp);

const buyer = { _id: oid(), role: "procurement_manager" };
const admin = { _id: oid(), role: "super_admin" };
const catA = oid();
const OLD = () => new Date(Date.now() - LEFTOVER_STALE_MS - 60_000);

function world({ failures = {}, seed = {} } = {}) {
  const appId = new mongoose.Types.ObjectId();
  const db = {
    apps: [
      {
        _id: appId,
        companyName: "Acme Supplies",
        contactName: "Sara Vendor",
        email: "sara@acme.example",
        phone: "",
        status: "pending",
        categorySelections: [{ subcategoryId: catA }],
        ...(seed.app || {}),
      },
    ],
    users: seed.users || [],
    vendors: seed.vendors || [],
    invites: seed.invites || [],
  };
  const ops = fakeCollections(
    db,
    { apps: VendorApplication, users: User, vendors: ProcurementVendor, invites: Invite },
    { failures, uniqueEmail: ["users"] }
  );
  setupAuth({ users: [buyer, admin] }); // after the fakes: auth keeps its own User.findById
  db.appId = appId;
  return { db, ops };
}

const approve = (db) => call("PATCH", `/api/vendor-applications/${db.appId}/approve`, { user: buyer });
const activeInvites = (db) => db.invites.filter((i) => i.status === "pending" && i.expiresAt > new Date());

async function captureConsole(fn) {
  const lines = [];
  const orig = console.log;
  console.log = (...a) => {
    lines.push(a.join(" "));
  };
  try {
    return { result: await fn(), output: lines.join("\n") };
  } finally {
    console.log = orig;
  }
}

// ── Invitation wording ──────────────────────────────────────────────────────
test("wording: the vendor invitation names the Vendor Portal and never the Client Portal", () => {
  const { subject, html } = buildInviteEmail({ fullName: "Sara", acceptUrl: "https://x/accept", role: "vendor" });
  assert.match(subject, /Vendor Portal/);
  assert.match(html, /Vendor Portal/);
  assert.doesNotMatch(subject + html, /Client Portal/);
});

test("wording: non-vendor invitations keep the Client Portal wording", () => {
  const { subject, html } = buildInviteEmail({ fullName: "Ali", acceptUrl: "https://x/accept", role: "client" });
  assert.match(subject, /Client Portal/);
  assert.doesNotMatch(subject + html, /Vendor Portal/);
});

test("wording: the name in the email is HTML-escaped", () => {
  const { html } = buildInviteEmail({ fullName: "<b>x</b>", acceptUrl: "https://x/a", role: "vendor" });
  assert.ok(!html.includes("<b>x</b>"));
});

test("wording: approving a vendor sends the Vendor Portal invitation", async () => {
  const { db } = world();
  const { result: r, output } = await captureConsole(() => approve(db));
  assert.equal(r.status, 200);
  assert.match(output, /You're invited to the Expresso Digital Vendor Portal/);
  assert.doesNotMatch(output, /Client Portal/);
});

test("wording: resending a vendor invitation keeps the Vendor Portal wording and clears an abandoned claim", async () => {
  const userId = new mongoose.Types.ObjectId();
  const invite = {
    _id: new mongoose.Types.ObjectId(),
    email: "sara@acme.example",
    fullName: "Sara",
    role: "vendor",
    status: "pending",
    tokenHash: "x".repeat(64),
    expiresAt: new Date(Date.now() + 86400000),
    acceptedAt: OLD(),
    acceptedByUserId: userId,
    vendorId: new mongoose.Types.ObjectId(),
  };
  const { db } = world({ seed: { invites: [invite] } });
  const { result: r, output } = await captureConsole(() =>
    call("POST", `/api/invites/${invite._id}/resend`, { user: admin })
  );
  assert.equal(r.status, 200);
  assert.match(output, /Vendor Portal/);
  assert.doesNotMatch(output, /Client Portal/);
  assert.equal(db.invites[0].acceptedAt, null, "abandoned claim is cleared");
  assert.equal(String(db.invites[0].acceptedByUserId), String(userId), "reserved account id is kept for resumption");
});

// ── Approval ────────────────────────────────────────────────────────────────
test("approval: creates one unlinked vendor profile and one expiring, single-use invitation — no password", async () => {
  const { db } = world();
  const r = await approve(db);
  assert.equal(r.status, 200);
  assert.equal(db.vendors.length, 1);
  assert.equal(db.vendors[0].userId, null);
  assert.deepEqual(db.vendors[0].categories.map(String), [catA]);
  assert.equal(activeInvites(db).length, 1);
  const inv = activeInvites(db)[0];
  assert.equal(inv.role, "vendor");
  assert.equal(String(inv.vendorId), String(db.vendors[0]._id));
  assert.equal(inv.tokenHash.length, 64, "only the token hash is stored");
  assert.equal(db.apps[0].status, "approved");
  assert.equal(String(db.apps[0].vendorId), String(db.vendors[0]._id));
  assert.equal(db.users.length, 0, "no account is created at approval");
  assert.ok(!/password|token|credentials/i.test(JSON.stringify(r.body)));
});

test("approval: double-click (two concurrent approvals) gives one vendor profile and one active invitation", async () => {
  const { db } = world();
  const [a, b] = await Promise.all([approve(db), approve(db)]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
  assert.equal(db.vendors.length, 1);
  assert.equal(activeInvites(db).length, 1);
  assert.equal(String(activeInvites(db)[0].vendorId), String(db.vendors[0]._id));
  assert.equal(String(db.apps[0].vendorId), String(db.vendors[0]._id));
});

test("approval: five concurrent approvals still give one profile and one active invitation", async () => {
  const { db } = world();
  const rs = await Promise.all([1, 2, 3, 4, 5].map(() => approve(db)));
  assert.equal(rs.filter((r) => r.status === 200).length, 1);
  assert.equal(db.vendors.length, 1);
  assert.equal(activeInvites(db).length, 1);
});

test("approval: approving again after success is refused and writes nothing", async () => {
  const { db, ops } = world();
  assert.equal((await approve(db)).status, 200);
  const before = ops.length;
  assert.equal((await approve(db)).status, 409);
  assert.equal(ops.length, before, "no writes on the second approval");
  assert.equal(db.vendors.length, 1);
  assert.equal(activeInvites(db).length, 1);
});

test("approval: an existing account or an unrelated pending invitation for the email is refused", async () => {
  let { db } = world({ seed: { users: [{ _id: new mongoose.Types.ObjectId(), email: "sara@acme.example" }] } });
  assert.equal((await approve(db)).status, 409);
  assert.equal(db.vendors.length, 0);
  restoreAll();
  ({ db } = world({
    seed: {
      invites: [{ _id: new mongoose.Types.ObjectId(), email: "sara@acme.example", status: "pending", role: "client", expiresAt: new Date(Date.now() + 86400000), createdAt: OLD() }],
    },
  }));
  assert.equal((await approve(db)).status, 409);
  assert.equal(db.vendors.length, 0);
  assert.equal(activeInvites(db).length, 1, "the unrelated invitation is left alone");
});

test("approval: a failure part-way is compensated, and a retry then succeeds normally", async () => {
  const { db } = world({ failures: { "invites.create": 1 } });
  const first = await approve(db);
  assert.equal(first.status, 500);
  assert.ok(!JSON.stringify(first.body).includes("simulated"), "internal error text is not returned");
  assert.equal(db.vendors.length, 0, "profile created by the failed request is removed");
  assert.equal(db.invites.length, 0);
  assert.equal(db.apps[0].status, "pending");
  const retry = await approve(db);
  assert.equal(retry.status, 200);
  assert.equal(db.vendors.length, 1);
  assert.equal(activeInvites(db).length, 1);
});

test("approval: if marking the application approved fails, the profile and invitation are removed", async () => {
  const { db } = world({ failures: { "apps.updateOne": 1 } });
  assert.equal((await approve(db)).status, 500);
  assert.equal(db.vendors.length, 0);
  assert.equal(db.invites.length, 0);
  assert.equal((await approve(db)).status, 200);
});

function interruptedApproval(createdAt) {
  const vendorId = new mongoose.Types.ObjectId();
  return {
    vendorId,
    vendors: [{ _id: vendorId, name: "Acme Supplies", applicationId: null, userId: null, isActive: true, categories: [], createdAt }],
    invites: [
      {
        _id: new mongoose.Types.ObjectId(),
        email: "sara@acme.example",
        role: "vendor",
        status: "pending",
        tokenHash: "y".repeat(64),
        vendorId,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt,
      },
    ],
  };
}

test("interrupted approval: the partial state is detectable from normal data", async () => {
  const left = interruptedApproval(OLD());
  const { db } = world({ seed: left });
  left.vendors[0].applicationId = db.appId;
  // Detectable: a vendor profile for an application that is not approved, and
  // a pending vendor invitation whose application is not approved.
  const orphanProfiles = db.vendors.filter(
    (v) => v.userId == null && db.apps.some((a) => String(a._id) === String(v.applicationId) && a.status !== "approved")
  );
  assert.equal(orphanProfiles.length, 1);
});

test("interrupted approval: approving again reuses the profile and replaces the undelivered invitation", async () => {
  const left = interruptedApproval(OLD());
  const { db } = world({ seed: left });
  left.vendors[0].applicationId = db.appId;
  const oldInviteId = left.invites[0]._id;
  const r = await approve(db);
  assert.equal(r.status, 200);
  assert.equal(db.vendors.length, 1, "no duplicate profile");
  assert.equal(String(db.vendors[0]._id), String(left.vendorId), "the leftover profile is reused");
  assert.deepEqual(db.vendors[0].categories.map(String), [catA]);
  assert.equal(activeInvites(db).length, 1, "one active invitation");
  assert.notEqual(String(activeInvites(db)[0]._id), String(oldInviteId));
  assert.equal(db.invites.find((i) => String(i._id) === String(oldInviteId)).status, "cancelled");
  assert.equal(String(db.apps[0].vendorId), String(left.vendorId));
});

test("interrupted approval: a resumed approval that fails again keeps the reused profile for the next retry", async () => {
  const left = interruptedApproval(OLD());
  const { db } = world({ seed: left, failures: { "apps.updateOne": 1 } });
  left.vendors[0].applicationId = db.appId;
  assert.equal((await approve(db)).status, 500);
  assert.equal(db.vendors.length, 1, "the reused profile is not deleted");
  assert.equal(activeInvites(db).length, 0, "the invitation from the failed attempt is removed");
  assert.equal((await approve(db)).status, 200);
  assert.equal(db.vendors.length, 1);
  assert.equal(activeInvites(db).length, 1);
});

test("interrupted approval: records that may belong to a running approval are not touched (409)", async () => {
  const left = interruptedApproval(new Date());
  const { db, ops } = world({ seed: left });
  left.vendors[0].applicationId = db.appId;
  const r = await approve(db);
  assert.equal(r.status, 409);
  assert.equal(ops.length, 0, "no writes");
  assert.equal(activeInvites(db).length, 1);
});
