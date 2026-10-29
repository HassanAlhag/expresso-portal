// Public Portfolio work items (/api/work): schema, publication boundary,
// permissions, create/update/archive/delete, the optional case-study link,
// "create from case study" and the initial seed plan.
// Real Express app; WorkItem and Portfolio model statics are stubbed (no database).
import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call } from "./helpers.js";
import WorkItem from "../src/modules/portfolio/workItem.model.js";
import Portfolio from "../src/modules/portfolio/portfolio.model.js";
import { WORK_TYPE_KEYS } from "../src/modules/portfolio/workItem.constants.js";
import { workItemFromCaseStudy, workTypeFromCaseStudy } from "../src/modules/portfolio/workItem.fromCaseStudy.js";
import { planWorkItemSeed, ASSET_ONLY_ITEMS, LINKED_CASE_STUDIES } from "../src/modules/portfolio/workItem.seedPlan.js";
import { ALL_PERMISSION_KEYS, DEFAULT_ROLE_PERMISSIONS, PERMISSION_CATALOG } from "../src/config/permissions.js";
import { isExternalDenied } from "../src/utils/roleRegistry.js";

afterEach(restoreAll);
after(stopApp);

const ROLES = {
  work_reader: { permissions: ["work.read"], isInternal: true },
  work_editor: { permissions: ["work.read", "work.write"], isInternal: true },
  work_deleter: { permissions: ["work.read", "work.delete"], isInternal: true },
  case_editor: { permissions: ["portfolio.read", "portfolio.write", "portfolio.delete"], isInternal: true },
  work_editor_cs: { permissions: ["work.read", "work.write", "portfolio.read"], isInternal: true },
};
const u = (role) => ({ _id: oid(), role });
const reader = u("work_reader");
const editor = u("work_editor");
const deleter = u("work_deleter");
const caseEditor = u("case_editor");
const editorCs = u("work_editor_cs");
const admin = u("super_admin");
const auth = () => setupAuth({ users: [reader, editor, deleter, caseEditor, editorCs, admin], roles: ROLES });

const caseStudy = (over = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  slug: "odeur-perfumes-website",
  title: "Odeur Perfumes — Website",
  clientName: "Odeur Perfumes",
  category: "Website Design",
  status: "published",
  sortOrder: 2,
  bannerTitle: "Tailored E-Commerce Built for a Lasting Impression",
  excerpt: "A refined e-commerce website for a perfume brand.",
  bannerDesc: "Longer banner text.",
  thumbnailImg: "/odeur.jpg",
  bannerImage: "/odeur.jpg",
  introDescription: "Overview narrative.",
  problems: "Challenge narrative.",
  solutions: ["Solution one"],
  result: "Outcome narrative.",
  imageUrls: [{ src: "/odeur1.jpeg" }, { src: "/odeur2.jpeg" }, { src: "/odeur1.jpeg" }, { src: "javascript:alert(1)" }],
  ...over,
});

/** Capture the filter/sort a list request produces. */
function captureList(items = []) {
  const seen = {};
  stub(WorkItem, "countDocuments", (f) => { seen.countFilter = f; return q(items.length); });
  stub(WorkItem, "find", (f) => {
    seen.filter = f;
    const chain = q(items);
    chain.sort = (s) => { seen.sort = s; return chain; };
    return chain;
  });
  return seen;
}

// ─── Schema ─────────────────────────────────────────────────────────────────
test("schema: lightweight visual record with an optional case-study link, no narrative fields", () => {
  const paths = Object.keys(WorkItem.schema.paths);
  for (const p of ["title", "slug", "clientName", "workType", "industry", "year", "shortDescription", "cover.src", "gallery", "video.src",
    "services", "technologies", "featured", "sortOrder", "status", "publishedAt", "caseStudy", "seo.metaTitle", "seo.metaDesc", "createdAt", "updatedAt"]) {
    assert.ok(paths.includes(p), `missing ${p}`);
  }
  for (const p of ["problems", "solutions", "result", "introDescription"]) assert.ok(!paths.includes(p), `${p} belongs to case studies`);
  assert.equal(WorkItem.schema.path("caseStudy").options.ref, "Portfolio");
  assert.equal(WorkItem.collection.collectionName, "workitems");
  assert.equal(Portfolio.collection.collectionName, "portfolios", "the case-study collection is unchanged");

  const ok = new WorkItem({ title: "Sample", slug: "sample", workType: "website" });
  assert.equal(ok.validateSync(), undefined);
  assert.equal(ok.status, "draft");
  assert.equal(ok.caseStudy, null);
  assert.equal(ok.featured, false);
  const badDoc = new WorkItem({ slug: "x", workType: "seo", year: 1800 });
  const err = badDoc.validateSync();
  assert.ok(err.errors.title && err.errors.workType && err.errors.year);
});

// ─── Public boundary ────────────────────────────────────────────────────────
test("public list: published only, even when drafts are requested", async () => {
  auth();
  const seen = captureList([]);
  const r = await call("GET", "/api/work?status=draft&workType=social&sort=sortOrder");
  assert.equal(r.status, 200);
  assert.equal(seen.filter.status, "published");
  assert.equal(seen.filter.workType, "social");
  assert.deepEqual(seen.sort, { featured: -1, sortOrder: 1, createdAt: -1 });
});

test("public list: unknown work types and sorts are ignored, featured filter applies", async () => {
  auth();
  const seen = captureList([]);
  await call("GET", "/api/work?workType=seo&sort=$where&featured=true");
  assert.equal("workType" in seen.filter, false);
  assert.equal(seen.filter.featured, true);
  assert.deepEqual(seen.sort, { featured: -1, sortOrder: 1, createdAt: -1 });
});

test("a case-study manager (portfolio.read) does not see portfolio drafts", async () => {
  auth();
  const seen = captureList([]);
  await call("GET", "/api/work?status=draft", { user: caseEditor });
  assert.equal(seen.filter.status, "published");
});

test("work.read sees drafts and can filter by status", async () => {
  auth();
  let seen = captureList([]);
  await call("GET", "/api/work", { user: reader });
  assert.equal("status" in seen.filter, false);
  restoreAll();
  auth();
  seen = captureList([]);
  await call("GET", "/api/work?status=archived", { user: reader });
  assert.equal(seen.filter.status, "archived");
});

test("public list hides an unpublished linked case study and never exposes its status", async () => {
  auth();
  const pub = { _id: oid(), slug: "a", title: "A", status: "published" };
  const draft = { _id: oid(), slug: "b", title: "B", status: "draft" };
  captureList([
    { _id: oid(), slug: "one", title: "One", status: "published", caseStudy: pub },
    { _id: oid(), slug: "two", title: "Two", status: "published", caseStudy: draft },
    { _id: oid(), slug: "three", title: "Three", status: "published", caseStudy: null },
  ]);
  const r = await call("GET", "/api/work");
  assert.deepEqual(r.body.items.map((i) => i.caseStudy), [{ _id: pub._id, slug: "a", title: "A" }, null, null]);
});

test("public detail: published by slug works; drafts are 404", async () => {
  auth();
  const store = {
    live: { _id: oid(), slug: "live", title: "Live", status: "published", caseStudy: null },
    hidden: { _id: oid(), slug: "hidden", title: "Hidden", status: "draft", caseStudy: null },
  };
  stub(WorkItem, "findOne", (f) => q(store[f.slug] || null));
  assert.equal((await call("GET", "/api/work/live")).status, 200);
  assert.equal((await call("GET", "/api/work/hidden")).status, 404);
  assert.equal((await call("GET", "/api/work/missing")).status, 404);
  const managed = await call("GET", "/api/work/hidden", { user: reader });
  assert.equal(managed.status, 200);
});

// ─── Permissions ────────────────────────────────────────────────────────────
test("writes need work.write; case-study permissions do not grant portfolio work", async () => {
  auth();
  stub(WorkItem, "exists", async () => null);
  stub(WorkItem, "create", async (d) => ({ _id: oid(), ...d }));
  const body = { title: "Sample", workType: "website" };
  assert.equal((await call("POST", "/api/work", { body })).status, 401);
  assert.equal((await call("POST", "/api/work", { user: reader, body })).status, 403);
  assert.equal((await call("POST", "/api/work", { user: caseEditor, body })).status, 403);
  assert.equal((await call("POST", "/api/work", { user: editor, body })).status, 201);
  assert.equal((await call("PATCH", `/api/work/${oid()}`, { user: caseEditor, body: { title: "x" } })).status, 403);
  assert.equal((await call("DELETE", `/api/work/${oid()}`, { user: editor })).status, 403);
  assert.equal((await call("POST", `/api/work/from-case-study/${oid()}`, { user: caseEditor })).status, 403);
});

test("permission catalog: work.* registered, portfolio.* kept for case studies, grants are minimal", () => {
  const work = PERMISSION_CATALOG.find((d) => d.domain === "work");
  assert.deepEqual(work.permissions.map((p) => p.key), ["work.read", "work.write", "work.delete"]);
  assert.equal(work.label, "Portfolio");
  const cs = PERMISSION_CATALOG.find((d) => d.domain === "portfolio");
  assert.equal(cs.label, "Case Studies");
  assert.deepEqual(cs.permissions.map((p) => p.key), ["portfolio.read", "portfolio.write", "portfolio.delete"]);
  for (const k of ["work.read", "work.write", "work.delete"]) {
    assert.ok(ALL_PERMISSION_KEYS.includes(k));
    assert.ok(DEFAULT_ROLE_PERMISSIONS.admin.includes(k));
    assert.ok(isExternalDenied(k), `${k} must never reach client/vendor roles`);
  }
  // Same pattern as website.*: operations managers view; nobody else is broadened.
  assert.deepEqual(DEFAULT_ROLE_PERMISSIONS.operations_manager.filter((p) => p.startsWith("work.")), ["work.read"]);
  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    if (["super_admin", "admin", "operations_manager"].includes(role)) continue;
    assert.deepEqual(perms.filter((p) => p.startsWith("work.")), [], `${role} gained work access`);
  }
  // Existing case-study grants are unchanged.
  for (const role of ["operations_manager", "project_manager", "staff"]) {
    assert.ok(DEFAULT_ROLE_PERMISSIONS[role].includes("portfolio.read") && DEFAULT_ROLE_PERMISSIONS[role].includes("portfolio.write"));
  }
});

// ─── Create / update ────────────────────────────────────────────────────────
test("create: slug from title, draft by default, unsafe media dropped, invalid input rejected", async () => {
  auth();
  const created = [];
  stub(WorkItem, "exists", async () => null);
  stub(WorkItem, "create", async (d) => { created.push(d); return { _id: oid(), ...d }; });
  const r = await call("POST", "/api/work", {
    user: editor,
    body: {
      title: "Odeur Perfumes — Website",
      workType: "ecommerce",
      year: "2023",
      services: "Website Design, E-commerce , Website Design",
      cover: { src: "/odeur.jpg", alt: "Odeur" },
      gallery: [{ src: "/odeur1.jpeg" }, { src: "javascript:alert(1)" }, { src: "//evil.example/x.png" }, { src: "https://cdn.example/x.png" }],
      video: { src: "http://insecure.example/v.mp4" },
    },
  });
  assert.equal(r.status, 201);
  const d = created[0];
  assert.equal(d.slug, "odeur-perfumes-website");
  assert.equal(d.status, "draft");
  assert.equal(d.publishedAt, null);
  assert.equal(d.year, 2023);
  assert.deepEqual(d.services, ["Website Design", "E-commerce"]);
  assert.deepEqual(d.gallery.map((g) => g.src), ["/odeur1.jpeg", "https://cdn.example/x.png"]);
  assert.equal(d.video.src, "");

  for (const body of [{ workType: "website" }, { title: "X", workType: "seo" }, { title: "X", workType: "website", year: 1700 }]) {
    assert.equal((await call("POST", "/api/work", { user: editor, body })).status, 400, JSON.stringify(body));
  }
});

test("videos: a list of safe sources with optional poster and title, capped at 12", async () => {
  auth();
  const id = oid();
  const patches = [];
  stub(WorkItem, "findById", () => q({ _id: id, slug: "sample", status: "draft" }));
  stub(WorkItem, "findByIdAndUpdate", (_id, patch) => { patches.push(patch); return q({ _id: id, ...patch }); });
  const r = await call("PATCH", `/api/work/${id}`, {
    user: editor,
    body: {
      videos: [
        { src: "https://cdn.example/reel-1.mp4", poster: "/poster.jpg", title: "  Launch reel  ", media: oid() },
        { src: "javascript:alert(1)", title: "dropped" },
        { src: "/clip.mp4", poster: "javascript:alert(1)" },
      ],
      video: { src: "", poster: "" },
    },
  });
  assert.equal(r.status, 200);
  assert.deepEqual(patches[0].videos.map((v) => [v.src, v.poster, v.title]), [
    ["https://cdn.example/reel-1.mp4", "/poster.jpg", "Launch reel"],
    ["/clip.mp4", "", ""],
  ]);
  assert.equal(patches[0].video.src, "", "saving the list clears the legacy single video");
  const many = Array.from({ length: 13 }, (_, i) => ({ src: `/v${i}.mp4` }));
  assert.equal((await call("PATCH", `/api/work/${id}`, { user: editor, body: { videos: many } })).status, 400);
  assert.equal((await call("PATCH", `/api/work/${id}`, { user: editor, body: { videos: "nope" } })).status, 400);
  assert.ok(Object.keys(WorkItem.schema.paths).includes("videos"));
});

test("create: duplicate slug is a conflict", async () => {
  auth();
  stub(WorkItem, "exists", async () => ({ _id: oid() }));
  const r = await call("POST", "/api/work", { user: editor, body: { title: "Taken", workType: "website" } });
  assert.equal(r.status, 409);
});

test("case-study relation: optional, must point at an existing case study", async () => {
  auth();
  const created = [];
  const known = oid();
  stub(WorkItem, "exists", async () => null);
  stub(WorkItem, "create", async (d) => { created.push(d); return { _id: oid(), ...d }; });
  stub(Portfolio, "exists", async (f) => (String(f._id) === known ? { _id: known } : null));
  const base = { title: "Linked", workType: "website" };
  assert.equal((await call("POST", "/api/work", { user: editor, body: { ...base, caseStudy: known } })).status, 201);
  assert.equal(created[0].caseStudy, known);
  assert.equal((await call("POST", "/api/work", { user: editor, body: { ...base, caseStudy: oid() } })).status, 400);
  assert.equal((await call("POST", "/api/work", { user: editor, body: { ...base, caseStudy: "not-an-id" } })).status, 400);
  assert.equal((await call("POST", "/api/work", { user: editor, body: { ...base, title: "Unlinked", caseStudy: null } })).status, 201);
  assert.equal(created[1].caseStudy, null);
});

test("update: publishing stamps publishedAt; archiving clears it; slug collisions are refused", async () => {
  auth();
  const id = oid();
  const patches = [];
  let current = { _id: id, slug: "sample", status: "draft" };
  stub(WorkItem, "findById", () => q(current));
  stub(WorkItem, "exists", async (f) => (f.slug === "taken" ? { _id: oid() } : null));
  stub(WorkItem, "findByIdAndUpdate", (_id, patch) => { patches.push(patch); return q({ ...current, ...patch }); });

  assert.equal((await call("PATCH", `/api/work/${id}`, { user: editor, body: { status: "published" } })).status, 200);
  assert.ok(patches[0].publishedAt instanceof Date || typeof patches[0].publishedAt === "string");
  current = { ...current, status: "published" };
  await call("PATCH", `/api/work/${id}`, { user: editor, body: { status: "archived" } });
  assert.equal(patches[1].status, "archived");
  assert.equal(patches[1].publishedAt, null);
  await call("PATCH", `/api/work/${id}`, { user: editor, body: { title: "Renamed" } });
  assert.equal("publishedAt" in patches[2], false, "unrelated edits keep the publication date");
  assert.equal("status" in patches[2], false);
  assert.equal((await call("PATCH", `/api/work/${id}`, { user: editor, body: { slug: "taken" } })).status, 409);
  assert.equal((await call("PATCH", `/api/work/${id}`, { user: editor, body: { status: "live" } })).status, 400);
  assert.equal((await call("PATCH", `/api/work/not-an-id`, { user: editor, body: {} })).status, 400);
});

test("reorder: display order follows the given ids", async () => {
  auth();
  const ids = [oid(), oid(), oid()];
  const updates = [];
  stub(WorkItem, "findByIdAndUpdate", (id, patch) => { updates.push([id, patch.sortOrder]); return q({}); });
  assert.equal((await call("PATCH", "/api/work/reorder", { user: editor, body: { ids } })).status, 200);
  assert.deepEqual(updates, ids.map((id, i) => [id, i]));
  assert.equal((await call("PATCH", "/api/work/reorder", { user: editor, body: { ids: ["x"] } })).status, 400);
});

// ─── Delete safety ──────────────────────────────────────────────────────────
test("delete: work.delete only, and never a published item", async () => {
  auth();
  const deleted = [];
  const docs = { pub: { _id: oid(), status: "published" }, arch: { _id: oid(), status: "archived" } };
  stub(WorkItem, "findById", (id) => q(Object.values(docs).find((d) => d._id === id) || null));
  stub(WorkItem, "deleteOne", (f) => { deleted.push(f._id); return q({ deletedCount: 1 }); });
  assert.equal((await call("DELETE", `/api/work/${docs.pub._id}`, { user: deleter })).status, 409);
  assert.equal(deleted.length, 0);
  assert.equal((await call("DELETE", `/api/work/${docs.arch._id}`, { user: deleter })).status, 200);
  assert.deepEqual(deleted, [docs.arch._id]);
  assert.equal((await call("DELETE", `/api/work/${oid()}`, { user: deleter })).status, 404);
});

// ─── Create from case study ─────────────────────────────────────────────────
test("delete: a concurrent publish prevents permanent deletion", async () => {
  auth();
  const id = oid();
  stub(WorkItem, "findById", () => q({ _id: id, status: "draft" }));
  let publishedSurvives = true;
  stub(WorkItem, "deleteOne", (filter) => {
    const matchesPublished = !filter.status || filter.status.$in.includes("published");
    if (matchesPublished) publishedSurvives = false;
    return q({ deletedCount: matchesPublished ? 1 : 0 });
  });
  assert.equal((await call("DELETE", `/api/work/${id}`, { user: deleter })).status, 409);
  assert.equal(publishedSurvives, true);
});

function freeze(o) {
  Object.freeze(o);
  for (const v of Object.values(o)) if (v && typeof v === "object" && !(v instanceof mongoose.Types.ObjectId)) freeze(v);
  return o;
}

test("derivation: factual fields only, linked, draft, deduplicated safe gallery, input untouched", () => {
  const cs = freeze(caseStudy());
  const d = workItemFromCaseStudy(cs);
  assert.equal(d.title, "Odeur Perfumes — Website");
  assert.equal(d.slug, "odeur-perfumes-website");
  assert.equal(d.clientName, "Odeur Perfumes");
  assert.equal(d.workType, "ecommerce");
  assert.equal(d.shortDescription, cs.excerpt);
  assert.equal(d.cover.src, "/odeur.jpg");
  assert.deepEqual(d.gallery.map((g) => g.src), ["/odeur1.jpeg", "/odeur2.jpeg"]);
  assert.deepEqual(d.services, ["Website Design"]);
  assert.deepEqual(d.technologies, []);
  assert.equal(d.status, "draft");
  assert.equal(d.caseStudy, cs._id);
  assert.equal(d.year, null);
  for (const k of ["problems", "solutions", "result", "introDescription"]) assert.equal(k in d, false);
  assert.ok(WORK_TYPE_KEYS.includes(d.workType));
  assert.equal(workTypeFromCaseStudy({ category: "Social Media" }), "social");
  assert.equal(workTypeFromCaseStudy({ category: "Website Design", title: "Godfel" }), "website");
  assert.equal(workTypeFromCaseStudy({ category: "" }), "other");
});

test("from-case-study: creates a new linked draft and never writes the case study", async () => {
  auth();
  const cs = caseStudy({ _id: oid() });
  const created = [];
  stub(Portfolio, "findById", () => q(cs));
  for (const m of ["findByIdAndUpdate", "updateOne", "findOneAndUpdate", "deleteOne", "findByIdAndDelete", "create"]) {
    stub(Portfolio, m, () => { throw new Error(`case study written via ${m}`); });
  }
  stub(WorkItem, "findOne", () => q(null));
  stub(WorkItem, "create", async (d) => { created.push(d); return { _id: oid(), ...d }; });
  const r = await call("POST", `/api/work/from-case-study/${cs._id}`, { user: editor });
  assert.equal(r.status, 201);
  assert.equal(created[0].status, "draft");
  assert.equal(String(created[0].caseStudy), cs._id);
});

test("from-case-study: existing slug is a conflict; unpublished case studies need portfolio.read", async () => {
  auth();
  const cs = caseStudy({ _id: oid(), status: "draft" });
  stub(Portfolio, "findById", () => q(cs));
  stub(WorkItem, "create", async (d) => ({ _id: oid(), ...d }));
  stub(WorkItem, "findOne", () => q(null));
  assert.equal((await call("POST", `/api/work/from-case-study/${cs._id}`, { user: editor })).status, 404);
  assert.equal((await call("POST", `/api/work/from-case-study/${cs._id}`, { user: editorCs })).status, 201);
  const existingId = oid();
  stub(WorkItem, "findOne", () => q({ _id: existingId }));
  const r = await call("POST", `/api/work/from-case-study/${cs._id}`, { user: editorCs });
  assert.equal(r.status, 409);
  assert.equal(r.body.existingId, existingId);
});

// ─── Seed plan ──────────────────────────────────────────────────────────────
test("seed plan: drafts only, six linked case studies, Sudatel visual-only, idempotent", () => {
  const byslug = new Map(
    [...LINKED_CASE_STUDIES, "sudatel"].map((slug, i) => [slug, freeze(caseStudy({
      _id: new mongoose.Types.ObjectId(), slug, title: slug, clientName: slug, category: i > 2 ? "Social Media" : "Website Design",
      excerpt: slug === "sudatel" ? "" : `excerpt ${slug}`, bannerTitle: "",
      imageUrls: slug === "sudatel" ? [{ src: "https://cdn.example/generic-artwork.webp" }] : [{ src: `/${slug}.png` }],
      thumbnailImg: `/${slug}-thumb.png`,
    }))])
  );
  const first = planWorkItemSeed(byslug, new Set());
  const drafts = first.create.map((c) => c.draft);
  assert.equal(drafts.length, 6 + 1 + ASSET_ONLY_ITEMS.length);
  assert.ok(drafts.every((d) => d.status === "draft" && d.publishedAt === null && d.featured === false));
  const linked = drafts.filter((d) => d.caseStudy);
  assert.deepEqual(linked.map((d) => d.slug), LINKED_CASE_STUDIES);
  const sudatel = drafts.find((d) => d.slug === "sudatel");
  assert.equal(sudatel.caseStudy, null);
  assert.deepEqual(sudatel.gallery, []);
  assert.equal(sudatel.cover.src, "/sudatel-thumb.png");
  const assets = drafts.filter((d) => ASSET_ONLY_ITEMS.some((a) => a.slug === d.slug));
  assert.ok(assets.every((d) => d.workType === "social" && d.shortDescription === "" && d.year === null && d.cover.src.startsWith("/")));
  // Every asset-only draft names its client from the creatives themselves.
  assert.deepEqual(assets.filter((d) => !d.clientName).map((d) => d.slug), []);
  assert.ok(assets.every((d) => !d.year && !d.industry && !d.shortDescription));
  assert.equal(new Set(drafts.map((d) => d.slug)).size, drafts.length, "slugs are unique");

  const again = planWorkItemSeed(byslug, new Set(drafts.map((d) => d.slug)));
  assert.equal(again.create.length, 0);
  assert.equal(again.skipped.length, drafts.length);
  const missing = planWorkItemSeed(new Map(), new Set());
  assert.equal(missing.skipped.filter((s) => s.reason === "case study not found").length, 7);
});
