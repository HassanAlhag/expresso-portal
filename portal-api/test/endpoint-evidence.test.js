// R5-C1 — offline endpoint / caller evidence register.
// Fixture tests cover each false-positive defence; repository tests pin the
// reconciliation with the 300 registered routes and the current review set.
// No network, database, storage, environment or access logs are used.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const GEN = path.resolve(here, "../../docs/architecture/generate-endpoint-evidence.cjs");
const ARTIFACT = path.resolve(here, "../../docs/architecture/endpoint-evidence.json");
const { analyse, build } = createRequire(import.meta.url)(GEN);

/* ----------------------------------------------------------- fixture */
const R = (method, p, file, line, guards = ["requireAuth"]) => ({
  method,
  path: p,
  domain: "fixture",
  file,
  line,
  globalGuards: [],
  handlers: [...guards.map((label) => ({ label, source: "x" })), { label: "handler", source: file }],
});
const THINGS = "portal-api/src/things.routes.js";
const FILES = "portal-api/src/files.routes.js";
const APP = "portal-api/src/app.js";
const routes = [
  R("GET", "/api/things", THINGS, 1),
  R("POST", "/api/things", THINGS, 2),
  R("GET", "/api/things/public", THINGS, 3, []),
  R("GET", "/api/things/stats", THINGS, 4),
  R("GET", "/api/things/legacy", THINGS, 5),
  R("GET", "/api/things/:id", THINGS, 6),
  R("PATCH", "/api/things/:id", THINGS, 7),
  R("DELETE", "/api/things/:id", THINGS, 8),
  R("GET", "/api/things/tree", THINGS, 9), // registered after /:id: Express never reaches it for GET
  R("GET", "/api/things/unread/:customerId", THINGS, 10),
  R("GET", "/api/things/:id/history", THINGS, 11),
  R("GET", "/api/private-files/:token", FILES, 1, []),
  R("GET", "/api/health", APP, 5, []),
];
const mounts = [
  { prefix: "/api/things", file: THINGS, line: 20 },
  { prefix: "/api/private-files", file: FILES, line: 21 },
];
const client = {
  entry: "client/src/index.js",
  files: {
    "client/src/index.js": `import { createRoot } from "react-dom/client";\nimport App from "./App";\ncreateRoot(document.getElementById("root")).render(<App />);\n`,
    "client/src/App.jsx": `import { listThings, createThing, getThing, getTree, getUnread } from "./api/things";
import { useNav } from "./hooks/useNav";
export default function App() {
  useNav();
  listThings(); createThing({}); getThing("1"); getTree(); getUnread("c1");
  return <div />;
}
`,
    "client/src/api/client.js": `import axios from "axios";\nexport const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || "/api" });\n`,
    "client/src/api/things.js": `import { api } from "./client";
const BASE = "/things";
export const listThings = () => api.get(BASE);
export const createThing = (body) => api.post(\`\${BASE}\`, body);
export const getThing = (id) => api.get(\`\${BASE}/\${id}\`);
export const updateThing = (id, body) => api.patch(\`\${BASE}/\${id}\`, body);
export const deleteThing = (id) => api.delete(\`\${BASE}/\${id}\`);
export const getTree = () => api.get(\`\${BASE}/tree\`);
export const getUnread = (customerId) => api.get(\`\${BASE}/unread/\${customerId}\`);
export const getStats = () => api.get(\`\${BASE}/stats\`);
// A local helper calls getStats, but nothing uses loadDashboard.
export function loadDashboard() { return getStats(); }
`,
    "client/src/hooks/useNav.js": `const API = process.env.REACT_APP_API_URL || "/api";
function load(kind, path) { return fetch(\`\${API}\${path}\`).then((r) => r.json()); }
export function useNav() { return load("public", "/things/public"); }
`,
    "client/src/legacy/OldPage.jsx": `import { api } from "../api/client";\nexport default function OldPage() { api.get("/things/legacy"); return null; }\n`,
  },
};
const server = {
  entry: "portal-api/src/server.js",
  files: {
    "portal-api/src/server.js": `import { createApp } from "./app.js";\nimport { signedLink } from "./storage.js";\ncreateApp(); signedLink;\n`,
    "portal-api/src/app.js": `export function createApp() { const app = {}; app.get("/api/health", () => {}); return app; }\n`,
    "portal-api/src/storage.js": `export function signedLink(base, token) { return \`\${base}/api/private-files/\${encodeURIComponent(token)}\`; }\n`,
  },
};
const tests = {
  files: {
    "portal-api/test/things.test.js": `const call = async () => {};
await call("GET", \`/api/things/\${"x"}/history\`);
await call("GET", "/api/things");
`,
  },
};
const annotations = { entries: [{ method: "GET", path: "/api/health", classification: "OPERATOR_RETAIN", reason: "liveness check" }] };

let fx;
const rec = (o, method, p) => o.records.find((r) => r.method === method && r.path === p);
before(() => {
  fx = analyse({ routes, mounts, client, server, tests, annotations });
});

test("fixture: an active caller is ACTIVE_TRACKED_CALLER", () => {
  const r = rec(fx, "GET", "/api/things");
  assert.ok(r.classifications.includes("ACTIVE_TRACKED_CALLER"));
  assert.equal(r.evidence.activeTrackedCallers[0].function, "listThings");
  assert.equal(r.retirementStatus, "NOT_AUTHORIZED");
  assert.equal(r.ownerReviewRequired, false);
});

test("fixture: methods are separate records (GET active, PATCH/DELETE unused)", () => {
  assert.ok(rec(fx, "GET", "/api/things/:id").classifications.includes("ACTIVE_TRACKED_CALLER"));
  for (const m of ["PATCH", "DELETE"]) {
    const r = rec(fx, m, "/api/things/:id");
    assert.deepEqual(r.evidence.activeTrackedCallers, []);
    assert.ok(r.classifications.includes("UNUSED_EXPORT"), m);
    assert.ok(r.classifications.includes("NO_TRACKED_ACTIVE_CALLER"), m);
  }
});

test("fixture: an unused export in a live module is not an active caller", () => {
  const r = rec(fx, "PATCH", "/api/things/:id");
  assert.equal(r.evidence.unusedExportCallers[0].function, "updateThing");
  assert.equal(r.evidence.unusedExportCallers[0].file, "client/src/api/things.js");
});

test("fixture: a local helper call does not make an endpoint active", () => {
  const r = rec(fx, "GET", "/api/things/stats");
  assert.deepEqual(r.classifications.filter((c) => c === "ACTIVE_TRACKED_CALLER"), []);
  assert.ok(r.classifications.includes("UNUSED_EXPORT"));
  assert.equal(r.retirementStatus, "EVIDENCE_REQUIRED");
});

test("fixture: API prefix interpolation and wrapper parameters resolve", () => {
  // useNav → load("public", "/things/public") → fetch(`${API}${path}`) with API = env || "/api"
  const r = rec(fx, "GET", "/api/things/public");
  assert.equal(r.evidence.activeTrackedCallers.length, 1);
  assert.equal(r.evidence.activeTrackedCallers[0].file, "client/src/hooks/useNav.js");
  assert.equal(fx.unresolvedCallSites.length, 0);
});

test("fixture: static and dynamic segments are not confused; Express order wins", () => {
  // `${BASE}/${id}` never counts for /public, /stats or /tree.
  assert.deepEqual(rec(fx, "GET", "/api/things/stats").evidence.activeTrackedCallers, []);
  // /unread/:customerId is a two-segment route, distinct from /:id.
  assert.equal(rec(fx, "GET", "/api/things/unread/:customerId").evidence.activeTrackedCallers[0].function, "getUnread");
  // A literal /things/tree is served by the earlier GET /:id, so the later /tree route has no caller.
  const id = rec(fx, "GET", "/api/things/:id").evidence.activeTrackedCallers.map((s) => s.function).sort();
  assert.deepEqual(id, ["getThing", "getTree"]);
  assert.ok(rec(fx, "GET", "/api/things/tree").classifications.includes("NO_TRACKED_ACTIVE_CALLER"));
});

test("fixture: a caller in an unreachable file is UNREACHABLE_CALLER, not active", () => {
  const r = rec(fx, "GET", "/api/things/legacy");
  assert.ok(r.classifications.includes("UNREACHABLE_CALLER"));
  assert.ok(!r.classifications.includes("ACTIVE_TRACKED_CALLER"));
  assert.equal(r.evidence.unreachableCallers[0].file, "client/src/legacy/OldPage.jsx");
});

test("fixture: test references are evidence of expected behaviour only", () => {
  const r = rec(fx, "GET", "/api/things/:id/history");
  assert.deepEqual(r.classifications, ["TEST_ONLY", "NO_TRACKED_ACTIVE_CALLER", "EXTERNAL_CONSUMER_POSSIBLE"]);
  assert.equal(r.ownerReviewRequired, true);
  assert.equal(r.usageEvidence, "NOT_COLLECTED");
  // A tested route that also has an active caller is not TEST_ONLY.
  assert.ok(!rec(fx, "GET", "/api/things").classifications.includes("TEST_ONLY"));
  assert.equal(rec(fx, "GET", "/api/things").evidence.testReferences.length, 1);
});

test("fixture: a server-generated private-file URL is a browser-generated path", () => {
  const r = rec(fx, "GET", "/api/private-files/:token");
  assert.ok(r.classifications.includes("BROWSER_GENERATED_PATH"));
  assert.ok(!r.classifications.includes("NO_TRACKED_ACTIVE_CALLER"));
  assert.equal(r.ownerReviewRequired, false);
  // Route registration in app.js is not a caller.
  assert.deepEqual(rec(fx, "GET", "/api/health").evidence.browserGeneratedPaths, []);
});

test("fixture: operator-retain annotations protect without a frontend caller", () => {
  const r = rec(fx, "GET", "/api/health");
  assert.ok(r.classifications.includes("OPERATOR_RETAIN"));
  assert.ok(r.classifications.includes("NO_TRACKED_ACTIVE_CALLER"));
  assert.equal(r.ownerReviewRequired, false);
  assert.equal(r.retirementStatus, "NOT_AUTHORIZED");
  assert.equal(r.operatorRetain.reason, "liveness check");
});

test("fixture: annotations must name a real route, a known class and a reason", () => {
  const run = (entries) => analyse({ routes, mounts, client, server, tests, annotations: { entries } });
  assert.throws(() => run([{ method: "GET", path: "/api/nope", classification: "OPERATOR_RETAIN", reason: "x" }]), /unregistered route/);
  assert.throws(() => run([{ method: "GET", path: "/api/health", classification: "SAFE_TO_DELETE", reason: "x" }]), /unsupported classification/);
  assert.throws(() => run([{ method: "GET", path: "/api/health", classification: "OPERATOR_RETAIN", reason: "" }]), /needs a reason/);
});

test("fixture: external consumers are never ruled out", () => {
  for (const r of fx.records) assert.equal(r.externalConsumerStatus, "UNKNOWN");
  assert.ok(rec(fx, "GET", "/api/things/public").classifications.includes("EXTERNAL_CONSUMER_POSSIBLE")); // public, even with a caller
});

/* ----------------------------------------------------------- repository */
let repo;
before(() => {
  repo = build();
});

test("repository: every one of the 300 registered routes has exactly one record", () => {
  const inv = JSON.parse(readFileSync(path.resolve(here, "../../docs/architecture/source-inventory.json"), "utf8"));
  assert.equal(inv.counts.apiRoutes, 300);
  assert.equal(repo.records.length, 300);
  assert.equal(repo.summary.totalApiRegistrations, 300);
  const keys = repo.records.map((r) => `${r.method} ${r.path}`);
  assert.equal(new Set(keys).size, 300);
  assert.deepEqual(new Set(keys), new Set(inv.apiRoutes.map((r) => `${r.method} ${r.path}`)));
});

test("repository: the generator is deterministic and the committed register is fresh", () => {
  const again = build();
  assert.equal(JSON.stringify(again), JSON.stringify(repo));
  assert.equal(readFileSync(ARTIFACT, "utf8"), `${JSON.stringify(repo, null, 2)}\n`);
  execFileSync(process.execPath, [GEN, "--check"], { stdio: "pipe" });
  const sorted = [...repo.records].sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
  assert.deepEqual(repo.records.map((r) => r.path + r.method), sorted.map((r) => r.path + r.method));
});

test("repository: usage evidence is NOT_COLLECTED and nothing is marked safe to delete", () => {
  for (const r of repo.records) {
    assert.equal(r.usageEvidence, "NOT_COLLECTED");
    assert.equal(r.externalConsumerStatus, "UNKNOWN");
    assert.ok(["NOT_AUTHORIZED", "EVIDENCE_REQUIRED"].includes(r.retirementStatus));
  }
  assert.equal(repo.summary.usageEvidenceCollected, 0);
  assert.doesNotMatch(readFileSync(ARTIFACT, "utf8"), /SAFE_TO_DELETE|"safe"/i);
});

test("repository: no absolute local paths, secrets or environment values in the register", () => {
  const text = readFileSync(ARTIFACT, "utf8");
  assert.doesNotMatch(text, /\/Users\/|\/sessions\/|\/home\/|[A-Z]:\\\\/);
  assert.doesNotMatch(text, /mongodb(\+srv)?:\/\/|AKIA[0-9A-Z]{16}|Bearer [A-Za-z0-9]|eyJ[A-Za-z0-9_-]{10,}\.|X-Amz-Signature|-----BEGIN/);
  assert.doesNotMatch(text, /(JWT_SECRET|AWS_SECRET_ACCESS_KEY|SMTP_PASS|MONGO_URI|SUPER_ADMIN_PASSWORD)\s*[=:]/);
});

// Current review set, re-derived from source (owner review + access-log evidence required).
const REVIEW = [
  "GET /api/productions", "GET /api/productions/:slug", "POST /api/productions", "PATCH /api/productions/:id",
  "PATCH /api/productions/:id/status", "DELETE /api/productions/:id",
  "GET /api/procurement/categories/public", "GET /api/crm/activities/:id", "GET /api/procurement/vendors/:id",
  "DELETE /api/roles/:id", "GET /api/roles/:id", "GET /api/teams/:id", "GET /api/careers/:id/applications",
  "GET /api/files/:id", "PATCH /api/hr/scorecard-templates/:id", "GET /api/hr/kpi/goals/:id",
  "GET /api/messaging/unread/:customerId", "DELETE /api/social-metrics/:id", "GET /api/hr/leaves/:id",
];

test("repository: the review-required set is the 19 routes re-derived from source", () => {
  const got = repo.records.filter((r) => r.ownerReviewRequired).map((r) => `${r.method} ${r.path}`).sort();
  assert.deepEqual(got, [...REVIEW].sort());
  for (const k of REVIEW) {
    const r = repo.records.find((x) => `${x.method} ${x.path}` === k);
    assert.ok(r.classifications.includes("NO_TRACKED_ACTIVE_CALLER"), k);
    assert.equal(r.retirementStatus, "EVIDENCE_REQUIRED", k);
  }
});

test("repository: study discrepancies are pinned (DELETE /api/service/:id is active; GET /api/hr/leaves/:id is test-only)", () => {
  const del = repo.records.find((r) => r.method === "DELETE" && r.path === "/api/service/:id");
  assert.ok(del.classifications.includes("ACTIVE_TRACKED_CALLER"));
  assert.equal(del.evidence.activeTrackedCallers[0].function, "deleteServiceTemplate");
  const leave = repo.records.find((r) => r.method === "GET" && r.path === "/api/hr/leaves/:id");
  assert.ok(leave.classifications.includes("TEST_ONLY"));
  assert.ok(repo.records.find((r) => r.method === "GET" && r.path === "/api/hr/leaves/stats").classifications.includes("ACTIVE_TRACKED_CALLER"));
});

test("repository: legacy Production routes are reported, with unused/unreachable callers only", () => {
  const prod = repo.records.filter((r) => r.path.startsWith("/api/productions"));
  assert.equal(prod.length, 6);
  for (const r of prod) {
    assert.ok(!r.classifications.includes("ACTIVE_TRACKED_CALLER"), `${r.method} ${r.path}`);
    assert.equal(r.retirementStatus, "EVIDENCE_REQUIRED");
  }
  assert.ok(repo.records.find((r) => r.method === "GET" && r.path === "/api/productions/:slug").classifications.includes("UNREACHABLE_CALLER"));
});

test("repository: operator/security endpoints are retained, not review candidates", () => {
  for (const k of ["GET /api/health", "GET /api/admin/system-status", "POST /api/users/:id/force-logout"]) {
    const r = repo.records.find((x) => `${x.method} ${x.path}` === k);
    assert.ok(r.classifications.includes("OPERATOR_RETAIN"), k);
    assert.equal(r.ownerReviewRequired, false, k);
  }
  assert.equal(repo.summary.operatorRetain, 3);
});

test("repository: intentional non-standard flows keep a tracked caller path", () => {
  const has = (m, p, c) => repo.records.find((r) => r.method === m && r.path === p).classifications.includes(c);
  assert.ok(has("GET", "/api/private-files/:token", "BROWSER_GENERATED_PATH")); // signed private-file delivery
  for (const [m, p] of [
    ["GET", "/api/invites/verify"], ["POST", "/api/invites/accept"],
    ["POST", "/api/auth/forgot-password"], ["POST", "/api/auth/reset-password"],
    ["POST", "/api/careers/cv-upload"], ["POST", "/api/vendor-applications"],
  ]) assert.ok(has(m, p, "ACTIVE_TRACKED_CALLER"), `${m} ${p}`);
});

test("repository: client reachability agrees with the source inventory and nothing is unresolved", () => {
  assert.equal(repo.summary.unresolvedCallSites, 0);
  assert.deepEqual(repo.unresolvedCallSites, []);
});
