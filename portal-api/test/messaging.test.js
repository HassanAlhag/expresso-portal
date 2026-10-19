import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call } from "./helpers.js";
import Message from "../src/modules/messaging/message.model.js";

afterEach(restoreAll);
after(stopApp);

const clientA = oid();
const clientB = oid();
const users = {
  vendor: { _id: oid(), role: "vendor" },
  clientUser: { _id: oid(), role: "client", clientId: clientA },
  ops: { _id: oid(), role: "operations_manager" },
  externalCustom: { _id: oid(), role: "partner_viewer" },
};

function stubMessages() {
  stub(Message, "find", () => q([]));
  stub(Message, "countDocuments", () => q(0));
}

test("vendor cannot read client messages (audit S1)", async () => {
  setupAuth({ users: Object.values(users) });
  stubMessages();
  const r = await call("GET", `/api/messaging?customerId=${clientA}`, { user: users.vendor });
  assert.equal(r.status, 403);
});

test("vendor cannot post into a client thread", async () => {
  setupAuth({ users: Object.values(users) });
  stubMessages();
  const r = await call("POST", "/api/messaging", {
    user: users.vendor,
    body: { customerId: clientA, body: "hello" },
  });
  assert.equal(r.status, 403);
});

test("client reads own thread but not another client's", async () => {
  setupAuth({ users: Object.values(users) });
  stubMessages();
  const own = await call("GET", `/api/messaging?customerId=${clientA}`, { user: users.clientUser });
  assert.equal(own.status, 200);
  const other = await call("GET", `/api/messaging?customerId=${clientB}`, { user: users.clientUser });
  assert.equal(other.status, 403);
});

test("external custom role with messaging permission and no clientId is denied", async () => {
  setupAuth({
    users: Object.values(users),
    roles: { partner_viewer: { permissions: ["messaging.read", "messaging.write"], isInternal: false } },
  });
  stubMessages();
  const r = await call("GET", `/api/messaging?customerId=${clientA}`, { user: users.externalCustom });
  assert.equal(r.status, 403);
});

test("internal operations manager can read any client thread", async () => {
  setupAuth({ users: Object.values(users) });
  stubMessages();
  const r = await call("GET", `/api/messaging?customerId=${clientB}`, { user: users.ops });
  assert.equal(r.status, 200);
});

test("unauthenticated request is rejected", async () => {
  const r = await call("GET", `/api/messaging?customerId=${clientA}`);
  assert.equal(r.status, 401);
});
