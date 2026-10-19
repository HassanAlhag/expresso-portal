import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call } from "./helpers.js";
import Solution from "../src/modules/web-content/solution.model.js";

afterEach(restoreAll);
after(stopApp);

const editor = { _id: oid(), role: "admin" };

function captureFind() {
  const seen = {};
  stub(Solution, "find", (f) => {
    seen.filter = f;
    return q([]);
  });
  return seen;
}

test("public solutions list defaults to technology (legacy records included)", async () => {
  const seen = captureFind();
  const r = await call("GET", "/api/web-content/solutions");
  assert.equal(r.status, 200);
  assert.deepEqual(seen.filter, { kind: { $ne: "digital" }, isActive: true });
});

test("digital solutions are listed separately", async () => {
  const seen = captureFind();
  await call("GET", "/api/web-content/solutions?kind=digital");
  assert.deepEqual(seen.filter, { kind: "digital", isActive: true });
});

test("creating a digital solution defaults ownership to Expresso", async () => {
  setupAuth({ users: [editor] });
  let created;
  stub(Solution, "create", async (doc) => {
    created = doc;
    return doc;
  });
  const r = await call("POST", "/api/web-content/solutions", {
    user: editor,
    body: { title: "CAS", kind: "digital", customPage: "cas", demoCtaHref: "javascript:alert(1)" },
  });
  assert.equal(r.status, 201);
  assert.equal(created.kind, "digital");
  assert.equal(created.ownership, "expresso");
  assert.equal(created.customPage, "cas");
  assert.equal(created.demoCtaHref, ""); // unsafe link dropped
});

test("invalid kind or unknown custom page is rejected", async () => {
  setupAuth({ users: [editor] });
  stub(Solution, "create", async (doc) => doc);
  const bad = await call("POST", "/api/web-content/solutions", { user: editor, body: { title: "X", kind: "product" } });
  assert.equal(bad.status, 400);
  const page = await call("POST", "/api/web-content/solutions", { user: editor, body: { title: "X", customPage: "anything" } });
  assert.equal(page.status, 400);
});

test("existing technology solutions keep working when updated without new fields", async () => {
  setupAuth({ users: [editor] });
  let patch;
  stub(Solution, "findByIdAndUpdate", (_id, p) => {
    patch = p;
    return q({ _id, ...p });
  });
  const id = oid();
  const r = await call("PATCH", `/api/web-content/solutions/${id}`, { user: editor, body: { title: "ERP" } });
  assert.equal(r.status, 200);
  assert.equal(patch.kind, undefined);
  assert.equal(patch.title, "ERP");
});
