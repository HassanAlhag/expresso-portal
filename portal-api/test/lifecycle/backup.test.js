// R5-D2 — backup creation. Unit tests use a fake read-only adapter and a fake
// mongodump; no database, network, storage or environment file is touched.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, symlinkSync, existsSync, realpathSync, mkdirSync, appendFileSync, truncateSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runBackup, captureState, verifyBackupArtifact, checkLiveIdentity, parseBackupArgs, locateMongodump, childEnvironment, ARCHIVE_NAME, MANIFEST_NAME, INCOMPLETE_NAME, EXIT_INTERRUPTED } from "../../src/scripts/lifecycle/backup.js";
import { validateManifest, sealManifest } from "../../src/scripts/lifecycle/manifest.js";
import { verifyEvidence } from "../../src/scripts/lifecycle/evidence.js";
import { REPO_ROOT } from "../../src/scripts/lifecycle/catalog.js";
import { manifestBody } from "./fixtures.js";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/scripts/lifecycle");
const USER = "backup_reader";
const PASS = "S3cr3t-Pw!";
const URI = `mongodb://${USER}:${encodeURIComponent(PASS)}@127.0.0.1:27999/expresso_d2_fixture?replicaSet=rs0`;
const SPECIAL_PASS = "p@ss:w/rd#?%&=+ é";
const SPECIAL_URI = `mongodb://${encodeURIComponent("us:er@x")}:${encodeURIComponent(SPECIAL_PASS)}@127.0.0.1:27999/expresso_d2_fixture?replicaSet=rs0`;

let root;
let out;
let ev;
let profilesFile;
beforeEach(() => {
  root = realpathSync(mkdtempSync(path.join(tmpdir(), "d2-backup-test-")));
  out = path.join(root, "backups");
  ev = path.join(root, "evidence");
  mkdirSync(out);
  profilesFile = path.join(root, "profiles.json");
  writeFileSync(profilesFile, JSON.stringify({
    schemaVersion: "expresso.lifecycle.profiles/1",
    profiles: [
      { alias: "local-d2", class: "disposable", connection: { scheme: "mongodb", hosts: ["127.0.0.1:27999"], database: "expresso_d2_fixture", replicaSet: "rs0" }, operations: ["inventory", "backup"] },
      { alias: "local-noop", class: "local", connection: { scheme: "mongodb", hosts: ["127.0.0.1:27999"], database: "expresso_d2_fixture", replicaSet: "rs0" }, operations: ["inventory"] },
      { alias: "prod", class: "production", connection: { scheme: "mongodb+srv", hosts: ["cluster0.example.mongodb.net"], database: "expresso" }, operations: ["backup"] },
      { alias: "staging", class: "staging", connection: { scheme: "mongodb", hosts: ["10.0.0.5:27017"], database: "expresso_staging" }, operations: ["backup"] },
      { alias: "managed", class: "local", connection: { scheme: "mongodb", hosts: ["shard-00.abc.mongodb.net:27017"], database: "expresso_d2_fixture" }, operations: ["backup"] },
    ],
  }));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

/* ----------------------------------------------------------------- fakes */
const COLLECTIONS = () => [
  { name: "customers", count: 3, indexes: [{ name: "_id_", key: { _id: 1 } }, { name: "primaryEmail_1", key: { primaryEmail: 1 }, unique: true }], hash: "a".repeat(32) },
  { name: "jobs", count: 7, indexes: [{ name: "_id_", key: { _id: 1 } }, { name: "customerId_1_status_1", key: { customerId: 1, status: 1 } }], hash: "b".repeat(32) },
  { name: "zz_scratch", count: 2, indexes: [{ name: "_id_", key: { _id: 1 } }], hash: "c".repeat(32) },
];
function fakeAdapter({ hello = {}, collections = COLLECTIONS(), mutateAfterDump = false } = {}) {
  const calls = [];
  let dumped = false;
  const state = () => collections.map((c) => ({ ...c, hash: dumped && mutateAfterDump && c.name === "jobs" ? "d".repeat(32) : c.hash }));
  const a = {
    hello: async () => (calls.push("hello"), { isWritablePrimary: true, setName: "rs0", hosts: ["127.0.0.1:27999"], me: "127.0.0.1:27999", ...hello }),
    buildInfo: async () => (calls.push("buildInfo"), { version: "8.3.7" }),
    dbHash: async () => (calls.push("dbHash"), { collections: Object.fromEntries(state().map((c) => [c.name, c.hash])), md5: state().map((c) => c.hash).join("").slice(0, 32) }),
    listCollections: async () => (calls.push("listCollections"), collections.map((c) => ({ name: c.name, type: c.type ?? "collection", options: c.options ?? {} }))),
    countDocuments: async (n) => (calls.push("countDocuments"), collections.find((c) => c.name === n).count),
    listIndexes: async (n) => (calls.push("listIndexes"), collections.find((c) => c.name === n).indexes),
    serverInfo: async () => ({ version: "8.3.7", topology: "replica-set" }),
    close: async () => calls.push("close"),
  };
  // Any mutation method on the handle would be recorded and fail the test.
  for (const m of ["insertOne", "updateOne", "deleteMany", "drop", "dropDatabase", "createIndex", "command", "runCommand"]) a[m] = () => { calls.push(`MUTATION:${m}`); throw new Error(m); };
  a.markDumped = () => { dumped = true; };
  return { adapter: a, calls };
}
const fakeDump = (adapter, { code = 0, write = true, onRun } = {}) => async ({ archivePath, uri, signal }) => {
  fakeDump.lastUri = uri;
  onRun?.(signal);
  if (write) writeFileSync(archivePath, Buffer.from("fake-mongodump-archive:" + "x".repeat(4096)));
  adapter.markDumped();
  return { code, stderr: code ? `Failed: connection to mongodb://${USER}:${PASS}@127.0.0.1:27999 refused` : "" };
};

const args = (over = {}) => {
  const o = { "--profiles": profilesFile, "--profile": "local-d2", "--output": out, "--evidence-dir": ev, "--operator": "hassan", "--artifact-id": "bk-test-0001", ...over };
  return Object.entries(o).filter(([, v]) => v !== null).flat();
};
async function run(argv, { env = { LIFECYCLE_TARGET_URI: URI, PATH: "" }, adapter = fakeAdapter(), dump, locate, signal } = {}) {
  let stdout = "";
  let stderr = "";
  const code = await runBackup(argv, {
    env,
    now: () => new Date("2026-10-28T07:00:00.000Z"),
    randomHex: () => "abcd1234",
    stdout: (s) => (stdout += s),
    stderr: (s) => (stderr += s),
    openTarget: async () => adapter.adapter,
    locateTool: locate ?? (() => "/opt/mongo-tools/bin/mongodump"),
    toolVersion: () => "100.13.0",
    dump: dump ?? fakeDump(adapter.adapter),
    application: () => ({ gitCommit: "f".repeat(40), dirty: false, toolVersion: "x" }),
    lockfileDigest: () => "e".repeat(64),
    signal,
  });
  return { code, stdout, stderr, adapter };
}
const artifact = (id = "bk-test-0001") => path.join(out, id);
const everything = () => {
  const files = [];
  const walk = (d) => {
    for (const n of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, n.name);
      if (n.isDirectory()) walk(p); else files.push(p);
    }
  };
  walk(root);
  return files.filter((f) => !f.endsWith(ARCHIVE_NAME)).map((f) => `${f}\n${readFileSync(f, "utf8")}`).join("\n");
};

/* ----------------------------------------------------------------- arguments & output */
test("1–3. missing profile, target URI or output is refused before anything happens", async () => {
  assert.equal((await run(args({ "--profile": null }))).code, 2);
  const noUri = await run(args(), { env: { PATH: "", MONGO_URI: URI } }); // MONGO_URI is never a fallback
  assert.equal(noUri.code, 2);
  assert.match(noUri.stderr, /MISSING_TARGET/);
  assert.equal((await run(args({ "--output": null }))).code, 2);
  assert.equal(existsSync(ev), false);
  assert.deepEqual(readdirSync(out), []);
});

test("4–6. relative, repository, traversal and symlinked output directories are refused", async () => {
  for (const o of ["relative/dir", path.join(REPO_ROOT, "tmp"), REPO_ROOT, `${out}/../backups`, `${out}/`]) {
    const r = await run(args({ "--output": o }));
    assert.equal(r.code, 2, o);
    assert.match(r.stderr, /UNSAFE_OUTPUT/, o);
  }
  const link = path.join(root, "link");
  symlinkSync(out, link);
  const r = await run(args({ "--output": link }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /symbolic link/);
});

test("7. an existing artifact is never overwritten", async () => {
  assert.equal((await run(args())).code, 0);
  const before = readFileSync(path.join(artifact(), MANIFEST_NAME), "utf8");
  const again = await run(args());
  assert.equal(again.code, 2);
  assert.match(again.stderr, /OUTPUT_COLLISION/);
  assert.equal(readFileSync(path.join(artifact(), MANIFEST_NAME), "utf8"), before);
  assert.equal(existsSync(path.join(artifact(), INCOMPLETE_NAME)), false);
});

test("override flags and other operations do not exist", () => {
  for (const f of ["--force", "--yes-really", "--allow-production", "--skip-safety", "--restore", "--drop"]) {
    assert.throws(() => parseBackupArgs([...args(), f, "x"]), /unknown or unsupported option/);
  }
});

/* ----------------------------------------------------------------- D1 identity */
test("8–12. profile mismatch, production, staging, managed-cloud and mongodb+srv targets are refused", async () => {
  const cases = [
    [args(), "mongodb://127.0.0.1:27998/expresso_d2_fixture?replicaSet=rs0", /PROFILE_MISMATCH/],
    [args({ "--profile": "prod" }), "mongodb+srv://u:p@cluster0.example.mongodb.net/expresso", /UNSUPPORTED_PROFILE/],
    [args({ "--profile": "staging" }), "mongodb://10.0.0.5:27017/expresso_staging", /UNSUPPORTED_PROFILE/],
    [args({ "--profile": "managed" }), "mongodb://shard-00.abc.mongodb.net:27017/expresso_d2_fixture", /PRODUCTION_LIKE_TARGET|PROFILE_MISMATCH/],
    [args(), "mongodb+srv://u:p@127.0.0.1/expresso_d2_fixture", /PROFILE_MISMATCH|MALFORMED/],
    [args({ "--profile": "local-noop" }), URI, /OPERATION_NOT_ALLOWED/],
  ];
  for (const [a, uri, re] of cases) {
    const fake = fakeAdapter();
    const r = await run(a, { env: { LIFECYCLE_TARGET_URI: uri, PATH: "" }, adapter: fake });
    assert.equal(r.code, 2, `${uri}: ${r.stderr}`);
    assert.match(r.stderr, re);
    assert.deepEqual(fake.calls, [], "no connection is made for a refused target");
  }
  assert.deepEqual(readdirSync(out), []);
});

test("13–15. live replica-set, member and topology mismatches are refused before any artifact", async () => {
  const cases = [
    [{ setName: "rs9" }, /LIVE_IDENTITY_MISMATCH/],
    [{ hosts: ["127.0.0.1:27999", "db-2.prod.internal:27017"] }, /not on loopback/],
    [{ me: "127.0.0.1:28000", hosts: ["127.0.0.1:28000"] }, /LIVE_IDENTITY_MISMATCH/],
    [{ msg: "isdbgrid" }, /UNSUPPORTED_TOPOLOGY/],
    [{ isWritablePrimary: false }, /UNSUPPORTED_TOPOLOGY/],
    [{ setName: undefined, hosts: undefined, me: undefined }, /LIVE_IDENTITY_MISMATCH/], // standalone, but the profile declares rs0
  ];
  for (const [hello, re] of cases) {
    const fake = fakeAdapter({ hello });
    const r = await run(args(), { adapter: fake });
    assert.equal(r.code, 2, JSON.stringify(hello));
    assert.match(r.stderr, re);
    assert.ok(fake.calls.includes("close"));
  }
  assert.deepEqual(readdirSync(out), []);
  assert.throws(() => checkLiveIdentity({ isWritablePrimary: true, setName: "atlas-xyz-shard-0", hosts: ["127.0.0.1:27999"], me: "127.0.0.1:27999" }, { connection: { replicaSet: "atlas-xyz-shard-0", hosts: ["127.0.0.1:27999"] } }), /looks like production/);
});

/* ----------------------------------------------------------------- tooling */
test("16–17. a missing mongodump stops before connecting; a failed mongodump leaves no manifest", async () => {
  const fake = fakeAdapter();
  const missing = await run(args(), { adapter: fake, locate: () => { const e = new Error(); throw Object.assign(e, {}); } });
  assert.notEqual(missing.code, 0);
  assert.deepEqual(fake.calls, []);
  // The real lookup: an explicit path must exist; PATH lookup uses absolute entries only; nothing is downloaded.
  assert.throws(() => locateMongodump(path.join(root, "no-such-mongodump")), (e) => e.code === "TOOL_UNAVAILABLE");
  assert.throws(() => locateMongodump("relative/mongodump"), (e) => e.code === "TOOL_UNAVAILABLE");
  assert.throws(() => locateMongodump(undefined, `relative/bin${path.delimiter}${root}`), (e) => e.code === "TOOL_UNAVAILABLE");
  const fake2 = fakeAdapter();
  const failed = await run(args({ "--artifact-id": "bk-test-0002" }), { adapter: fake2, dump: fakeDump(fake2.adapter, { code: 1 }) });
  assert.equal(failed.code, 4);
  assert.match(failed.stderr, /DUMP_FAILED/);
  assert.equal(existsSync(path.join(artifact("bk-test-0002"), MANIFEST_NAME)), false);
  const marker = JSON.parse(readFileSync(path.join(artifact("bk-test-0002"), INCOMPLETE_NAME), "utf8"));
  assert.equal(marker.status, "INCOMPLETE");
  assert.equal(marker.category, "connectivity");
  assert.equal(verifyBackupArtifact(artifact("bk-test-0002")).ok, false);
  const failedRecords = readFileSync(path.join(ev, "lifecycle-evidence.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(failedRecords.at(-1).eventType, "backup.failed");
  assert.equal(failedRecords.at(-1).failureCategory, "connectivity");
});

/* ----------------------------------------------------------------- credentials */
test("18–20. credentials and the URI never appear in output, manifest, evidence, markers or paths", async () => {
  for (const [uri, user, pass, id] of [[URI, USER, PASS, "bk-cred-0001"], [SPECIAL_URI, "us:er@x", SPECIAL_PASS, "bk-cred-0002"]]) {
    const ok = await run(args({ "--artifact-id": id }), { env: { LIFECYCLE_TARGET_URI: uri, PATH: "" } });
    assert.equal(ok.code, 0, ok.stderr);
    const fake = fakeAdapter();
    const bad = await run(args({ "--artifact-id": `${id}-f` }), { env: { LIFECYCLE_TARGET_URI: uri, PATH: "" }, adapter: fake, dump: fakeDump(fake.adapter, { code: 2 }) });
    assert.equal(bad.code, 4);
    const everywhere = [ok.stdout, ok.stderr, bad.stdout, bad.stderr, everything(), readdirSync(out).join("\n")].join("\n");
    for (const secret of [user, pass, encodeURIComponent(pass), encodeURIComponent(user), uri, "mongodb://"]) {
      assert.ok(!everywhere.includes(secret), `leaked: ${secret}`);
    }
  }
  // The URI reaches the dump step unmodified (it goes to mongodump only through the private config pipe).
  assert.equal(fakeDump.lastUri, SPECIAL_URI);
  // The child environment never carries the target URI or any MongoDB connection string.
  const env = childEnvironment({ PATH: "/usr/bin", LIFECYCLE_TARGET_URI: SPECIAL_URI, MONGO_URI: URI, OTHER: "x" });
  assert.deepEqual(env, { PATH: "/usr/bin", OTHER: "x" });
});

/* ----------------------------------------------------------------- artifact & manifest */
test("21. the manifest records the archive's real SHA-256 and size", async () => {
  const r = await run(args());
  assert.equal(r.code, 0, r.stderr);
  const m = JSON.parse(readFileSync(path.join(artifact(), MANIFEST_NAME), "utf8"));
  const data = readFileSync(path.join(artifact(), ARCHIVE_NAME));
  const { createHash } = await import("node:crypto");
  assert.equal(m.artifacts[0].sha256, createHash("sha256").update(data).digest("hex"));
  assert.equal(m.artifacts[0].bytes, data.length);
  assert.deepEqual(readdirSync(artifact()).sort(), [ARCHIVE_NAME, MANIFEST_NAME]);
  assert.equal(verifyBackupArtifact(artifact()).ok, true);
});

test("22. modified, truncated, missing and extra files are detected", async () => {
  await run(args());
  const a = path.join(artifact(), ARCHIVE_NAME);
  appendFileSync(a, "x");
  assert.ok(verifyBackupArtifact(artifact()).problems.some((p) => p.code === "CHECKSUM_MISMATCH"));
  truncateSync(a, 10);
  assert.ok(verifyBackupArtifact(artifact()).problems.some((p) => p.code === "TRUNCATED_FILE"));
  writeFileSync(path.join(artifact(), "extra.bin"), "x");
  assert.ok(verifyBackupArtifact(artifact()).problems.some((p) => p.code === "EXTRA_FILE"));
  await run(args({ "--artifact-id": "bk-test-0003" }));
  const m = path.join(artifact("bk-test-0003"), ARCHIVE_NAME);
  rmSync(m);
  assert.ok(verifyBackupArtifact(artifact("bk-test-0003")).problems.some((p) => p.code === "MISSING_FILE"));
});

test("23. a valid backup manifest is never 'verified' and can never claim restore verification", async () => {
  const r = await run(args());
  const m = JSON.parse(readFileSync(path.join(artifact(), MANIFEST_NAME), "utf8"));
  const v = validateManifest(m);
  assert.equal(v.status, "VALID", JSON.stringify(v.errors));
  assert.equal(v.verified, false);
  assert.deepEqual(m.status, { backupCreated: true, artifactChecksumsValid: true, restoreVerified: false });
  assert.equal(JSON.parse(r.stdout).restoreVerified, false);
  const claimed = sealManifest({ ...manifestBody(), status: { backupCreated: true, artifactChecksumsValid: true, restoreVerified: true } });
  assert.equal(validateManifest(claimed).status, "INVALID");
  // Backward compatible: D1 manifests without a status block stay valid.
  assert.equal(validateManifest(sealManifest(manifestBody())).status, "VALID");
});

test("24–25. an interrupted run is not successful and its partial artifact is marked incomplete", async () => {
  const controller = new AbortController();
  const fake = fakeAdapter();
  const r = await run(args(), { adapter: fake, signal: controller.signal, dump: fakeDump(fake.adapter, { onRun: () => controller.abort() }) });
  assert.equal(r.code, EXIT_INTERRUPTED);
  assert.match(r.stderr, /INTERRUPTED/);
  assert.equal(existsSync(path.join(artifact(), MANIFEST_NAME)), false);
  assert.equal(JSON.parse(readFileSync(path.join(artifact(), INCOMPLETE_NAME), "utf8")).category, "interrupted");
  const check = verifyBackupArtifact(artifact());
  assert.equal(check.ok, false);
  assert.ok(check.problems.some((p) => p.code === "MISSING_MANIFEST"));
});

test("26. evidence is an append-only, verifiable hash chain of the backup steps", async () => {
  await run(args());
  const file = path.join(ev, "lifecycle-evidence.jsonl");
  assert.equal(verifyEvidence(file).ok, true);
  const events = readFileSync(file, "utf8").trim().split("\n").map((l) => JSON.parse(l).eventType);
  assert.deepEqual(events, ["backup.requested", "backup.identity-verified", "backup.started", "backup.artifact-checksummed", "backup.manifest-written", "backup.completed"]);
});

test("27. the source is only read, and a source that changes during capture fails the backup", async () => {
  const fake = fakeAdapter();
  await run(args(), { adapter: fake });
  assert.ok(fake.calls.every((c) => !c.startsWith("MUTATION")), fake.calls.join());
  assert.equal(fake.calls.filter((c) => c === "dbHash").length, 2);
  const moving = fakeAdapter({ mutateAfterDump: true });
  const r = await run(args({ "--artifact-id": "bk-test-0004" }), { adapter: moving });
  assert.equal(r.code, 4);
  assert.match(r.stderr, /SOURCE_CHANGED_DURING_BACKUP/);
  assert.equal(existsSync(path.join(artifact("bk-test-0004"), MANIFEST_NAME)), false);
});

const VIEW_COLLECTIONS = () => [
  ...COLLECTIONS(),
  { name: "brief_jobs", type: "view", options: { viewOn: "jobs", pipeline: [{ $match: { status: "brief" } }, { $sort: { customerId: 1, status: 1 } }], collation: { locale: "simple" } }, hash: null },
  { name: "system.views", type: "collection", options: {}, hash: "e".repeat(32) },
];
function metadataOnlyAdapter(collections) {
  const fake = fakeAdapter({ collections });
  for (const method of ["countDocuments", "listIndexes"]) {
    const inner = fake.adapter[method];
    fake.adapter[method] = async (name) => {
      assert.ok(name !== "system.views" && name !== "brief_jobs", "never read system.views or evaluate view data");
      return inner(name);
    };
  }
  return fake;
}
test("views: D2 uses metadata only, preserves definitions and ordinary counts, and reports honest count/index semantics", async () => {
  const collections = VIEW_COLLECTIONS();
  const fake = metadataOnlyAdapter(collections);
  const state = await captureState(fake.adapter);
  assert.equal(state.collections.find((c) => c.name === "brief_jobs").count, null);
  const r = await run(args(), { adapter: fake });
  assert.equal(r.code, 0, r.stderr);
  const m = JSON.parse(readFileSync(path.join(artifact(), MANIFEST_NAME), "utf8"));
  assert.equal(validateManifest(m).status, "VALID");
  const by = Object.fromEntries(m.database.collections.map((c) => [c.name, c]));
  assert.equal(by.jobs.count, 7);
  assert.equal(by.jobs.countSemantics, "documents");
  assert.equal(by.brief_jobs.type, "view");
  assert.equal(by.brief_jobs.count, null);
  assert.equal(by.brief_jobs.countSemantics, "not-applicable");
  assert.deepEqual(by.brief_jobs.options, collections.find((c) => c.type === "view").options);
  assert.equal(by["system.views"].count, 1);
  assert.equal(by["system.views"].countSemantics, "view-definitions");
  assert.equal(by["system.views"].indexesInspected, false);
  assert.deepEqual(by["system.views"].indexes, []);
  assert.equal(JSON.parse(r.stdout).collections.documents, 12, "exclude view definitions/results from document totals");
});
test("consistency: view definitions, ordered sort/index keys, types, collection options and metadata hashes cannot change across capture", async () => {
  const mutations = [
    (cs) => { cs.find((c) => c.type === "view").options.pipeline[0].$match.status = "done"; },
    (cs) => { cs.find((c) => c.type === "view").options.pipeline[1].$sort = { status: 1, customerId: 1 }; },
    (cs) => { cs[1].indexes[1].key = { status: 1, customerId: 1 }; },
    (cs) => { cs[1].options = { validator: { status: { $type: "string" } } }; },
    (cs) => { cs[1].type = "timeseries"; },
    (cs) => { cs.find((c) => c.name === "system.views").hash = "f".repeat(32); },
    (cs) => { cs.splice(cs.findIndex((c) => c.type === "view"), 1); },
  ];
  for (const [i, mutate] of mutations.entries()) {
    const collections = VIEW_COLLECTIONS();
    const fake = metadataOnlyAdapter(collections);
    const id = `bk-view-change-${i}`;
    const r = await run(args({ "--artifact-id": id }), { adapter: fake, dump: fakeDump(fake.adapter, { onRun: () => mutate(collections) }) });
    assert.equal(r.code, 4, `${i}: ${r.stderr}`);
    assert.match(r.stderr, /SOURCE_CHANGED_DURING_BACKUP/);
    assert.equal(existsSync(path.join(artifact(id), MANIFEST_NAME)), false);
    assert.equal(existsSync(path.join(artifact(id), INCOMPLETE_NAME)), true);
  }
});

test("32–35. metadata is deterministic and records counts, indexes and unknown collections", async () => {
  await run(args({ "--artifact-id": "bk-test-0005" }));
  await run(args({ "--artifact-id": "bk-test-0006" }));
  const read = (id) => JSON.parse(readFileSync(path.join(artifact(id), MANIFEST_NAME), "utf8"));
  const strip = (m) => ({ ...m, operationId: null, seal: null });
  assert.deepEqual(strip(read("bk-test-0005")), strip(read("bk-test-0006")));
  const m = read("bk-test-0005");
  const by = Object.fromEntries(m.database.collections.map((c) => [c.name, c]));
  assert.equal(by.jobs.count, 7);
  assert.deepEqual(by.customers.indexes.map((i) => i.name), ["_id_", "primaryEmail_1"]);
  assert.equal(by.customers.indexes[1].unique, true);
  assert.equal(by.zz_scratch.knownToRepository, false);
  assert.equal(by.customers.knownToRepository, true);
  assert.match(by.jobs.fingerprint, /^[0-9a-f]{64}$/);
  assert.equal(m.time.consistency.method, "quiescent-verified");
  assert.deepEqual(m.completion.exclusions.map((e) => e.component), ["object-storage-public", "object-storage-private"]);
});

test("a refused login is a permission failure; nothing from the driver error is printed", async () => {
  let stdout = "";
  let stderr = "";
  const code = await runBackup(args(), {
    env: { LIFECYCLE_TARGET_URI: URI, PATH: "" },
    stdout: (x) => (stdout += x),
    stderr: (x) => (stderr += x),
    openTarget: async () => { throw Object.assign(new Error(`auth failed for ${USER}:${PASS}@127.0.0.1`), { code: 18, codeName: "AuthenticationFailed" }); },
    locateTool: () => "/opt/mongo-tools/bin/mongodump",
    toolVersion: () => "100.13.0",
    application: () => ({ gitCommit: "f".repeat(40), dirty: false }),
  });
  assert.equal(code, 4);
  assert.match(stderr, /PERMISSION_DENIED/);
  assert.ok(!(stdout + stderr).includes(PASS) && !(stdout + stderr).includes(USER));
  assert.deepEqual(readdirSync(out), []);
});

test("an empty target database is refused as a likely wrong target", async () => {
  const r = await run(args(), { adapter: fakeAdapter({ collections: [] }) });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /EMPTY_DATABASE/);
  assert.deepEqual(readdirSync(out), []);
});

/* ----------------------------------------------------------------- static */
test("28–31. no restore/reset/seed/delete/repair/migrate path, no shell, no command strings", () => {
  for (const f of readdirSync(SRC).filter((x) => x.endsWith(".js"))) {
    const code = readFileSync(path.join(SRC, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
    // R5-D3: only restoreverify.js may name mongorestore (its exact use is pinned in safety.test.js).
    assert.doesNotMatch(code, f === "restoreverify.js" ? /shell:\s*true|\bexecSync\(|\bexec\(|spawnSync\(/ : /mongorestore|shell:\s*true|\bexecSync\(|\bexec\(|spawnSync\(/, f);
    assert.doesNotMatch(code, /["'](restore|reset|seed|repair|migrate|drop|delete)["']\s*:\s*["']/, f);
  }
  const backup = readFileSync(path.join(SRC, "backup.js"), "utf8");
  // argv carries only the private config-pipe path, the archive path and flags: never the URI or credentials.
  assert.match(backup, /spawn\(binary, \[`--config=\$\{configPath\}`, `--archive=\$\{archivePath\}`, "--gzip", "--quiet"\], \{ stdio: \["ignore", "ignore", "pipe"\], shell: false, env: childEnvironment\(\) \}\)/);
  assert.doesNotMatch(backup, /--uri=|--password|--username|-p\b/);
});
