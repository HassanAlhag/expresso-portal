// W4: homepage slide eyebrows are optional. An explicitly blank eyebrow is
// stored blank on create and update; only an absent field gets the old default.
// Real Express app; the Slide model is stubbed (no database).
import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call } from "./helpers.js";
import Slide from "../src/modules/homepage/slide.model.js";

afterEach(restoreAll);
after(stopApp);

const admin = { _id: oid(), role: "super_admin" };

function captureCreate() {
  const created = [];
  setupAuth({ users: [admin] });
  stub(Slide, "create", async (doc) => {
    created.push(doc);
    return { _id: oid(), ...doc };
  });
  return created;
}

function captureUpdate() {
  const patches = [];
  setupAuth({ users: [admin] });
  stub(Slide, "findByIdAndUpdate", (_id, patch) => {
    patches.push(patch);
    return q({ _id, ...patch });
  });
  return patches;
}

test("create: an explicitly blank right eyebrow is stored blank", async () => {
  const created = captureCreate();
  const r = await call("POST", "/api/homepage/slides", {
    user: admin,
    body: { eyebrowLeft: "YOUR DIGITAL PARTNER", eyebrowRight: "", title: "One partner. From plan to delivery." },
  });
  assert.equal(r.status, 201);
  assert.equal(created[0].eyebrowLeft, "YOUR DIGITAL PARTNER");
  assert.equal(created[0].eyebrowRight, "");
});

test("create: an explicitly blank left eyebrow is stored blank (whitespace counts as blank)", async () => {
  const created = captureCreate();
  const r = await call("POST", "/api/homepage/slides", {
    user: admin,
    body: { eyebrowLeft: "   ", eyebrowRight: "DIGITAL SERVICES", title: "Build your brand." },
  });
  assert.equal(r.status, 201);
  assert.equal(created[0].eyebrowLeft, "");
  assert.equal(created[0].eyebrowRight, "DIGITAL SERVICES");
});

test("create: populated eyebrows are stored as given (trimmed)", async () => {
  const created = captureCreate();
  await call("POST", "/api/homepage/slides", {
    user: admin,
    body: { eyebrowLeft: " EXPRESSO DIGITAL ", eyebrowRight: "CREATIVE STUDIO", title: "Sample" },
  });
  assert.equal(created[0].eyebrowLeft, "EXPRESSO DIGITAL");
  assert.equal(created[0].eyebrowRight, "CREATIVE STUDIO");
});

test("create (legacy callers): eyebrow fields that are not sent keep the previous defaults", async () => {
  const created = captureCreate();
  await call("POST", "/api/homepage/slides", { user: admin, body: { title: "Sample" } });
  assert.equal(created[0].eyebrowLeft, "EXPRESSO DIGITAL");
  assert.equal(created[0].eyebrowRight, "GROWTH SYSTEMS");
});

test("update: a blank eyebrow can be saved intentionally", async () => {
  const patches = captureUpdate();
  const r = await call("PATCH", `/api/homepage/slides/${oid()}`, { user: admin, body: { eyebrowRight: "" } });
  assert.equal(r.status, 200);
  assert.equal(patches[0].eyebrowRight, "");
  assert.equal("eyebrowLeft" in patches[0], false, "fields not sent are not touched");
});

test("update: a populated eyebrow stays populated", async () => {
  const patches = captureUpdate();
  await call("PATCH", `/api/homepage/slides/${oid()}`, {
    user: admin,
    body: { eyebrowLeft: "TECHNOLOGY SOLUTIONS", eyebrowRight: "INFRASTRUCTURE" },
  });
  assert.equal(patches[0].eyebrowLeft, "TECHNOLOGY SOLUTIONS");
  assert.equal(patches[0].eyebrowRight, "INFRASTRUCTURE");
});
