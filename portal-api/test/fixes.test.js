import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call } from "./helpers.js";
import Invoice from "../src/modules/billing/invoice.model.js";
import User from "../src/modules/iam/users/user.model.js";

afterEach(restoreAll);
after(stopApp);

const finance = { _id: oid(), role: "finance" };

test("marking an invoice paid records the balance as a payment (audit B6)", async () => {
  setupAuth({ users: [finance] });
  const id = oid();
  const doc = {
    _id: id,
    status: "sent",
    total: 1050,
    amountPaid: 50,
    payments: [{ amount: 50 }],
    saved: false,
    async save() {
      this.saved = true;
    },
  };
  let calls = 0;
  stub(Invoice, "findById", () => (calls++ === 0 ? q(doc) : q({ _id: id, status: "paid" })));
  const r = await call("POST", `/api/billing/invoices/${id}/mark-paid`, { user: finance });
  assert.equal(r.status, 200);
  assert.equal(doc.status, "paid");
  assert.equal(doc.saved, true);
  assert.equal(doc.payments.at(-1).amount, 1000);
});

test("a void invoice cannot be marked paid", async () => {
  setupAuth({ users: [finance] });
  const id = oid();
  stub(Invoice, "findById", () => q({ _id: id, status: "void", payments: [], save: async () => {} }));
  const r = await call("POST", `/api/billing/invoices/${id}/mark-paid`, { user: finance });
  assert.equal(r.status, 409);
});

test("notification preferences are saved, unknown keys ignored (audit B5)", async () => {
  setupAuth({ users: [finance] });
  let update;
  stub(User, "findByIdAndUpdate", (_id, u) => {
    update = u;
    return q({ notificationPreferences: { emailDigest: false } });
  });
  const r = await call("PATCH", "/api/users/me/notifications", {
    user: finance,
    body: { preferences: { emailDigest: false, isAdmin: true, teamActivity: "yes" } },
  });
  assert.equal(r.status, 200);
  assert.deepEqual(update, { $set: { "notificationPreferences.emailDigest": false } });
});

test("the user schema stores notification preferences", () => {
  assert.ok(User.schema.path("notificationPreferences.emailDigest"));
});
