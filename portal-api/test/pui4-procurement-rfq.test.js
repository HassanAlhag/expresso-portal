// PUI-4 boundaries on "create an RFQ from a procurement request", the action
// behind the request page's Create RFQ button:
// - it is staff-only, like every other RFQ write: a client user with
//   procurement.write gets 403 and nothing is created or changed (the route
//   reads any request by id, so it must not be reachable from outside);
// - the new RFQ's description, which matched vendors see once published,
//   does not carry the request's internal budget.
// R3 RFQ numbering is unchanged (covered by r3-reliability).
import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, startApp, stopApp, stub, q, oid, call } from "./helpers.js";
import Counter from "../src/modules/admin/counter.model.js";
import RFQ from "../src/modules/procurement/rfq.model.js";
import ProcurementRequest from "../src/modules/procurement/request.model.js";

before(startApp);
afterEach(restoreAll);
after(stopApp);

const companyA = oid();
const staff = { _id: oid(), role: "procurement_manager" };
const clientAdmin = { _id: oid(), role: "client_admin", clientId: companyA };
const roles = {
  procurement_manager: { permissions: ["procurement.read", "procurement.write", "procurement.approve"], isInternal: true },
  client_admin: { permissions: ["procurement.read", "procurement.write"] },
};

function world(request) {
  const created = [];
  const requestUpdates = [];
  stub(ProcurementRequest, "findById", () => q(request));
  stub(ProcurementRequest, "findByIdAndUpdate", (id, update) => {
    requestUpdates.push({ id, update });
    return q({});
  });
  stub(RFQ, "findOne", () => q(null));
  stub(Counter, "findOneAndUpdate", () => q({ _id: "rfq", seq: 41 }));
  stub(RFQ, "create", async (doc) => {
    created.push(doc);
    return { _id: oid(), ...doc };
  });
  return { created, requestUpdates };
}

const request = (over = {}) => ({
  _id: oid(),
  customerId: companyA,
  title: "Conference cameras",
  description: "Four PTZ cameras for the boardroom.",
  requirements: "4K, HDMI and USB output.",
  budget: 48000,
  currency: "AED",
  categoryId: { _id: oid(), name: "Cameras", level: 3 },
  ...over,
});

test("create-rfq: a client user with procurement.write is refused and nothing is written", async () => {
  setupAuth({ users: [clientAdmin], roles });
  const { created, requestUpdates } = world(request());
  const r = await call("POST", `/api/procurement/requests/${oid()}/create-rfq`, { user: clientAdmin });
  assert.equal(r.status, 403, JSON.stringify(r.body));
  assert.equal(created.length, 0, "no RFQ is created");
  assert.equal(requestUpdates.length, 0, "the request's status is not changed");
});

test("create-rfq: the client's own request is refused too (RFQs are a staff tool)", async () => {
  setupAuth({ users: [clientAdmin], roles });
  const own = request();
  const { created } = world(own);
  const r = await call("POST", `/api/procurement/requests/${own._id}/create-rfq`, { user: clientAdmin });
  assert.equal(r.status, 403);
  assert.equal(created.length, 0);
});

test("create-rfq: staff create the draft; its vendor-visible description has no budget", async () => {
  setupAuth({ users: [staff], roles });
  const { created, requestUpdates } = world(request());
  const r = await call("POST", `/api/procurement/requests/${oid()}/create-rfq`, { user: staff });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(created.length, 1);
  const rfq = created[0];
  assert.equal(rfq.status, "draft");
  assert.match(rfq.rfqNumber, /^RFQ-\d{4}-0041$/);
  assert.match(rfq.description, /Four PTZ cameras/);
  assert.match(rfq.description, /Requirements:\n4K, HDMI and USB output\./);
  assert.doesNotMatch(rfq.description, /budget/i);
  assert.doesNotMatch(rfq.description, /48000|48,000/);
  assert.equal(requestUpdates.length, 1);
  assert.equal(requestUpdates[0].update.status, "assessing", "the request moves to Assessing, as before");
});

test("create-rfq: staff without procurement.write are refused", async () => {
  const viewer = { _id: oid(), role: "procurement_viewer" };
  setupAuth({ users: [viewer], roles: { ...roles, procurement_viewer: { permissions: ["procurement.read"], isInternal: true } } });
  const { created } = world(request());
  const r = await call("POST", `/api/procurement/requests/${oid()}/create-rfq`, { user: viewer });
  assert.equal(r.status, 403);
  assert.equal(created.length, 0);
});
