import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call } from "./helpers.js";
import Leave from "../src/modules/hr/leaves/leave.model.js";
import Expense from "../src/modules/hr/expenses/expense.model.js";

afterEach(restoreAll);
after(stopApp);

const staff = { _id: oid(), role: "staff", fullName: "Sam Staff" };
const hr = { _id: oid(), role: "hr_management" };

test("staff only see their own leave requests (audit S5)", async () => {
  setupAuth({ users: [staff, hr] });
  let filter;
  stub(Leave, "countDocuments", (f) => {
    filter = f;
    return q(0);
  });
  stub(Leave, "find", () => q([]));
  const r = await call("GET", "/api/hr/leaves", { user: staff });
  assert.equal(r.status, 200);
  const owner = filter.$and[0].$or;
  assert.equal(String(owner[0].staffUserId), staff._id);
});

test("HR approvers see all leave requests", async () => {
  setupAuth({ users: [staff, hr] });
  let filter;
  stub(Leave, "countDocuments", (f) => {
    filter = f;
    return q(0);
  });
  stub(Leave, "find", () => q([]));
  await call("GET", "/api/hr/leaves", { user: hr });
  assert.equal(filter.$and, undefined);
});

test("staff cannot open a colleague's leave request", async () => {
  setupAuth({ users: [staff, hr] });
  const id = oid();
  stub(Leave, "findById", () => q({ _id: id, staffUserId: oid(), createdBy: oid() }));
  const r = await call("GET", `/api/hr/leaves/${id}`, { user: staff });
  assert.equal(r.status, 404);
});

test("staff leave is always filed for themselves", async () => {
  setupAuth({ users: [staff, hr] });
  let created;
  stub(Leave, "create", async (doc) => {
    created = doc;
    return { _id: oid(), ...doc };
  });
  const r = await call("POST", "/api/hr/leaves", {
    user: staff,
    body: { staffUserId: hr._id, startDate: "2026-11-03", endDate: "2026-11-05" },
  });
  assert.equal(r.status, 201);
  assert.equal(String(created.staffUserId), staff._id);
  assert.equal(created.staffName, "Sam Staff");
});

test("approvers cannot approve their own leave", async () => {
  setupAuth({ users: [staff, hr] });
  const id = oid();
  stub(Leave, "findById", () => q({ _id: id, staffUserId: hr._id }));
  stub(Leave, "findByIdAndUpdate", () => q({ _id: id, status: "approved" }));
  const own = await call("POST", `/api/hr/leaves/${id}/approve`, { user: hr });
  assert.equal(own.status, 403);
});

test("approvers can approve someone else's leave", async () => {
  setupAuth({ users: [staff, hr] });
  const id = oid();
  stub(Leave, "findById", () => q({ _id: id, staffUserId: staff._id }));
  stub(Leave, "findByIdAndUpdate", () => q({ _id: id, status: "approved" }));
  const r = await call("POST", `/api/hr/leaves/${id}/approve`, { user: hr });
  assert.equal(r.status, 200);
});

test("staff only see their own expense claims", async () => {
  setupAuth({ users: [staff, hr] });
  let filter;
  stub(Expense, "countDocuments", (f) => {
    filter = f;
    return q(0);
  });
  stub(Expense, "find", () => q([]));
  const r = await call("GET", "/api/hr/expenses", { user: staff });
  assert.equal(r.status, 200);
  assert.equal(String(filter.$and[0].$or[0].staffUserId), staff._id);
});

test("company monthly expense report needs approve permission", async () => {
  setupAuth({ users: [staff, hr] });
  stub(Expense, "aggregate", () => q([]));
  const r = await call("GET", "/api/hr/expenses/monthly", { user: staff });
  assert.equal(r.status, 403);
});
