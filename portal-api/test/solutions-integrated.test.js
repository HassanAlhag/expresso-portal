// Stage 2 (Digital Solutions) + Stage 3 (technology groups) together.
import "./setup-env.js";
import { after, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { call, oid, q, restoreAll, setupAuth, stopApp, stub } from "./helpers.js";
import Solution from "../src/modules/web-content/solution.model.js";

after(stopApp);
afterEach(restoreAll);
const editor = { _id: oid(), role: "website-editor" };
const asEditor = () =>
  setupAuth({ users: [editor], roles: { "website-editor": { permissions: ["website.write"], isInternal: true } } });

const CAS = { slug: "cas", kind: "digital", title: "CAS", ownership: "expresso" };
const ERP = { slug: "erp-solution", title: "ERP Solution" }; // legacy: no kind, no group

test("technology listing never contains Digital Solutions; digital listing never contains technology", async () => {
  const filters = [];
  stub(Solution, "find", (filter) => {
    filters.push(filter);
    return q([]);
  });
  await call("GET", "/api/web-content/solutions");
  await call("GET", "/api/web-content/solutions?kind=digital");
  assert.deepEqual(filters[0].kind, { $ne: "digital" });
  assert.equal(filters[1].kind, "digital");
});

test("Digital Solutions are presented with no technology group, technology with its group", async () => {
  stub(Solution, "find", () => q([{ ...CAS, group: "" }, { ...ERP }]));
  const res = await call("GET", "/api/web-content/solutions?kind=all");
  const bySlug = Object.fromEntries(res.body.items.map((i) => [i.slug, i]));
  assert.equal(bySlug.cas.group, "");
  assert.equal(bySlug["erp-solution"].group, "business-software");
});

test("a technology record can never be presented as Expresso-owned", async () => {
  stub(Solution, "findOne", () => q({ ...ERP, ownership: "expresso" }));
  const res = await call("GET", "/api/web-content/solutions/erp-solution");
  assert.equal(res.body.item.ownership, "partner");
});

test("creating a Digital Solution needs no group and ignores one if sent", async () => {
  asEditor();
  stub(Solution, "create", async (doc) => doc);
  const none = await call("POST", "/api/web-content/solutions", {
    user: editor,
    body: { title: "CAS", slug: "cas", kind: "digital", group: "" },
  });
  assert.equal(none.status, 201);
  assert.equal(none.body.item.group, "");
  assert.equal(none.body.item.ownership, "expresso");
  const sent = await call("POST", "/api/web-content/solutions", {
    user: editor,
    body: { title: "Next", slug: "next", kind: "digital", group: "infrastructure" },
  });
  assert.equal(sent.status, 201);
  assert.equal(sent.body.item.group, "");
});

test("ownership cannot be set independently of the type", async () => {
  asEditor();
  let stored;
  stub(Solution, "create", async (doc) => (stored = doc));
  await call("POST", "/api/web-content/solutions", {
    user: editor,
    body: { title: "ERP", slug: "erp-x", kind: "technology", group: "business-software", ownership: "expresso" },
  });
  assert.equal(stored.ownership, "partner");
});

test("editing a Digital Solution from the CMS (group \"\") is accepted", async () => {
  asEditor();
  stub(Solution, "findById", () => q({ kind: "digital", slug: "cas" }));
  let patch;
  stub(Solution, "findByIdAndUpdate", (_id, p) => {
    patch = p;
    return q({ ...CAS, ...p });
  });
  const res = await call("PATCH", `/api/web-content/solutions/${oid()}`, {
    user: editor,
    body: { kind: "digital", group: "", tagline: "New tagline" },
  });
  assert.equal(res.status, 200);
  assert.equal(patch.group, "");
  assert.equal(patch.tagline, "New tagline");
});

test("a Technology Solution edit must keep a group", async () => {
  asEditor();
  stub(Solution, "findById", () => q({ kind: "technology", slug: "erp-solution" }));
  stub(Solution, "findByIdAndUpdate", () => assert.fail("must not write"));
  const res = await call("PATCH", `/api/web-content/solutions/${oid()}`, {
    user: editor,
    body: { group: "" },
  });
  assert.equal(res.status, 400);
});

test("changing type clears or restores the group", async () => {
  asEditor();
  let patch;
  stub(Solution, "findByIdAndUpdate", (_id, p) => {
    patch = p;
    return q({ slug: "erp-solution", ...p });
  });
  stub(Solution, "findById", () => q({ kind: "technology", slug: "erp-solution" }));
  await call("PATCH", `/api/web-content/solutions/${oid()}`, { user: editor, body: { kind: "digital" } });
  assert.equal(patch.group, "");
  assert.equal(patch.ownership, "expresso");

  stub(Solution, "findById", () => q({ kind: "digital", slug: "erp-solution" }));
  await call("PATCH", `/api/web-content/solutions/${oid()}`, { user: editor, body: { kind: "technology" } });
  assert.equal(patch.group, "business-software");
  assert.equal(patch.ownership, "partner");
});

test("reading legacy records performs no writes", async () => {
  stub(Solution, "find", () => q([{ ...ERP }]));
  stub(Solution, "findOne", () => q({ ...ERP }));
  for (const m of ["updateOne", "updateMany", "findByIdAndUpdate", "findOneAndUpdate", "create", "bulkWrite"]) {
    stub(Solution, m, () => assert.fail(`read path called ${m}`));
  }
  assert.equal((await call("GET", "/api/web-content/solutions")).status, 200);
  assert.equal((await call("GET", "/api/web-content/solutions/erp-solution")).status, 200);
});
