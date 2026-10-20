import { after, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { call, oid, q, restoreAll, setupAuth, stopApp, stub } from "./helpers.js";
import Solution from "../src/modules/web-content/solution.model.js";
import { TECHNOLOGY_GROUPS } from "../src/modules/web-content/technologyGroups.js";

after(stopApp);
afterEach(restoreAll);
const editor = { _id: oid(), role: "website-editor" };
function setupEditor() {
  setupAuth({ users: [editor], roles: { "website-editor": { permissions: ["website.write"], isInternal: true } } });
}

test("existing list endpoint exposes four groups and classifies every approved legacy slug without writes", async () => {
  const membership = {
    "business-software": ["erp-solution", "crm-solution", "queue-management", "software-licensing"],
    "cloud-hosting": ["cloud-services", "web-hosting-domains"],
    infrastructure: ["data-center", "data-center-hardware", "networking-hardware"],
    "connectivity-advisory": ["iot-solutions", "vas-solutions", "it-consultation"],
  };
  const items = Object.entries(membership).flatMap(([group, slugs]) => slugs.map((slug) => ({ slug, title: slug })));
  stub(Solution, "find", (filter) => { assert.equal(filter.isActive, true); return q(items); });
  const res = await call("GET", "/api/web-content/solutions");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.groups, TECHNOLOGY_GROUPS);
  for (const [group, slugs] of Object.entries(membership)) {
    assert.deepEqual(res.body.items.filter((item) => item.group === group).map((item) => item.slug), slugs);
  }
  assert.ok(items.every((item) => item.group === undefined));
});

test("existing detail URL and content survive grouping; explicit CMS assignment wins", async () => {
  const item = { slug: "erp-solution", group: "cloud-hosting", title: "ERP Solution", blocks: [{ type: "split", title: "Existing content" }] };
  stub(Solution, "findOne", (filter) => { assert.equal(filter.slug, item.slug); return q(item); });
  const res = await call("GET", "/api/web-content/solutions/erp-solution");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.item, item);
});

test("CMS create persists a group and older API clients can still create known solutions", async () => {
  setupEditor();
  stub(Solution, "create", async (data) => data);
  for (const body of [
    { title: "Custom", slug: "custom", group: "infrastructure" },
    { title: "ERP Solution", slug: "erp-solution" },
  ]) {
    const res = await call("POST", "/api/web-content/solutions", { user: editor, body });
    assert.equal(res.status, 201);
    assert.equal(res.body.item.group, body.group || "business-software");
  }
});

test("CMS update moves groups without changing slug, blocks or other content", async () => {
  setupEditor();
  const id = oid();
  stub(Solution, "findById", () => q({ _id: id, kind: "technology", slug: "erp-solution" }));
  stub(Solution, "findByIdAndUpdate", (actualId, patch) => {
    assert.equal(actualId, id);
    assert.deepEqual(patch, { group: "cloud-hosting", updatedBy: editor._id });
    return q({ _id: id, slug: "erp-solution", blocks: [{ type: "split" }], ...patch });
  });
  const res = await call("PATCH", `/api/web-content/solutions/${id}`, { user: editor, body: { group: "cloud-hosting" } });
  assert.equal(res.status, 200);
  assert.equal(res.body.item.slug, "erp-solution");
  assert.deepEqual(res.body.item.blocks, [{ type: "split" }]);
});

test("invalid group writes are rejected before reaching the model", async () => {
  setupEditor();
  stub(Solution, "create", () => assert.fail("Invalid create reached model"));
  stub(Solution, "findById", () => assert.fail("Invalid update reached model"));
  stub(Solution, "findByIdAndUpdate", () => assert.fail("Invalid update reached model"));
  for (const group of ["digital", null, {}, ["infrastructure"]]) {
    const created = await call("POST", "/api/web-content/solutions", { user: editor, body: { title: "Custom", group } });
    const updated = await call("PATCH", `/api/web-content/solutions/${oid()}`, { user: editor, body: { group } });
    assert.equal(created.status, 400);
    assert.equal(updated.status, 400);
  }
});

test("unassigned legacy content remains available and a partial edit preserves its inferred group", async () => {
  stub(Solution, "find", () => q([{ slug: "constructor", title: "Custom" }]));
  const listed = await call("GET", "/api/web-content/solutions");
  assert.equal(listed.body.items[0].group, "");
  setupEditor();
  stub(Solution, "findById", () => q({ kind: "technology", slug: "erp-solution" }));
  stub(Solution, "findByIdAndUpdate", (id, patch) => {
    assert.equal(Object.hasOwn(patch, "group"), false);
    return q({ slug: "erp-solution", ...patch });
  });
  const updated = await call("PATCH", `/api/web-content/solutions/${oid()}`, { user: editor, body: { isActive: false } });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.item.group, "business-software");
});
