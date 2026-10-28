// R5-D3 — restore verification. Unit tests: real D2 artifacts are produced by
// runBackup with fakes; the verification target and mongorestore are fakes
// (except the argv/environment test, which runs a stand-in executable).
// No database, network, storage or environment file is touched.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { appendFileSync, chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, truncateSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runBackup, verifyBackupArtifact, ARCHIVE_NAME, MANIFEST_NAME, INCOMPLETE_NAME } from "../../src/scripts/lifecycle/backup.js";
import {
  runRestoreVerify, preflightArtifact, proveDistinctDeclared, proveDistinctLive, compareRestored, mongorestoreArgs, namespaceArgs,
  restoreConnectionString, runMongorestore, validateVerification, sealVerification, VERIFICATION_NAME, NOT_VERIFIED_NAME,
} from "../../src/scripts/lifecycle/restoreverify.js";
import { sealManifest } from "../../src/scripts/lifecycle/manifest.js";
import { verifyEvidence } from "../../src/scripts/lifecycle/evidence.js";
import { targetFingerprint, validateProfiles, resolveTarget } from "../../src/scripts/lifecycle/target.js";
import { digestOf } from "../../src/scripts/lifecycle/common.js";

const SRC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/scripts/lifecycle");
const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../package.json");
const SOURCE_DB = "expresso_d3_src";
const VERIFY_DB = "expresso_d3_verify";
const SOURCE_URI = `mongodb://reader:${encodeURIComponent("Src-Pw-1")}@127.0.0.1:27999/${SOURCE_DB}?replicaSet=rs0`;
const T_USER = "us:er@x/#?";
const T_PASS = "p@ss:w/rd#?%&=+ é";
const TARGET_URI = `mongodb://${encodeURIComponent(T_USER)}:${encodeURIComponent(T_PASS)}@127.0.0.1:27996/${VERIFY_DB}?replicaSet=rsv`;
const SECRETS = [T_PASS, encodeURIComponent(T_PASS), T_USER, encodeURIComponent(T_USER), "Src-Pw-1", "mongodb://"];

let root;
let backups;
let out;
let ev;
let profilesFile;

const conn = (hosts, database, replicaSet) => ({ scheme: "mongodb", hosts, database, ...(replicaSet === undefined ? {} : { replicaSet }) });
beforeEach(() => {
  root = realpathSync(mkdtempSync(path.join(tmpdir(), "d3-unit-")));
  backups = path.join(root, "backups");
  out = path.join(root, "verifications");
  ev = path.join(root, "evidence");
  mkdirSync(backups);
  mkdirSync(out);
  profilesFile = path.join(root, "profiles.json");
  writeFileSync(profilesFile, JSON.stringify({
    schemaVersion: "expresso.lifecycle.profiles/1",
    profiles: [
      { alias: "src-a", class: "disposable", connection: conn(["127.0.0.1:27999"], SOURCE_DB, "rs0"), operations: ["backup"] },
      { alias: "verify-b", class: "disposable", connection: conn(["127.0.0.1:27996"], VERIFY_DB, "rsv"), operations: ["restore-verify"] },
      { alias: "verify-b-backup-only", class: "disposable", connection: conn(["127.0.0.1:27996"], VERIFY_DB, "rsv"), operations: ["backup", "inventory"] },
      { alias: "verify-same-db", class: "disposable", connection: conn(["127.0.0.1:27996"], SOURCE_DB, "rsv"), operations: ["restore-verify"] },
      { alias: "verify-same-server", class: "disposable", connection: conn(["127.0.0.1:27999"], VERIFY_DB, "rs0"), operations: ["restore-verify"] },
      { alias: "verify-standalone", class: "disposable", connection: conn(["127.0.0.1:27995"], VERIFY_DB), operations: ["restore-verify"] },
      { alias: "verify-wrong-rs", class: "disposable", connection: conn(["127.0.0.1:27996"], VERIFY_DB, "rs-other"), operations: ["restore-verify"] },
      { alias: "prod", class: "production", connection: { scheme: "mongodb+srv", hosts: ["cluster0.example.mongodb.net"], database: VERIFY_DB }, operations: ["restore-verify"] },
      { alias: "staging", class: "staging", connection: conn(["10.0.0.5:27017"], VERIFY_DB, "rsv"), operations: ["restore-verify"] },
      { alias: "managed", class: "disposable", connection: conn(["shard-00.abc.mongodb.net:27017"], VERIFY_DB, "rsv"), operations: ["restore-verify"] },
      { alias: "srv", class: "disposable", connection: { scheme: "mongodb+srv", hosts: ["verify.example.test"], database: VERIFY_DB }, operations: ["restore-verify"] },
      { alias: "prodname", class: "disposable", connection: conn(["127.0.0.1:27996"], "expresso_prod", "rsv"), operations: ["restore-verify"] },
    ],
  }));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

/* ----------------------------------------------------------------- D2 artifact (real, via runBackup with fakes) */
const SOURCE_COLLECTIONS = () => [
  { name: "customers", type: "collection", options: {}, count: 3, indexes: [{ name: "_id_", key: { _id: 1 } }, { name: "primaryEmail_1", key: { primaryEmail: 1 }, unique: true }], hash: "a".repeat(32) },
  { name: "jobs", type: "collection", options: { validator: { $jsonSchema: { required: ["status"] } } }, count: 7, indexes: [{ name: "_id_", key: { _id: 1 } }, { name: "customerId_1_status_1", key: { customerId: 1, status: 1 } }], hash: "b".repeat(32) },
  { name: "zz_scratch", type: "collection", options: {}, count: 2, indexes: [{ name: "_id_", key: { _id: 1 } }], hash: "c".repeat(32) },
];
const WITH_VIEWS = () => [
  ...SOURCE_COLLECTIONS(),
  { name: "recent_jobs", type: "view", options: { viewOn: "jobs", pipeline: [{ $match: { status: "brief" } }] }, count: 4, indexes: [], hash: null },
  { name: "system.views", type: "collection", options: {}, count: 1, indexes: [{ name: "_id_", key: { _id: 1 } }], hash: "e".repeat(32) },
];
const dbHashOf = (cols) => ({
  collections: Object.fromEntries(cols.filter((c) => c.type !== "view").map((c) => [c.name, c.hash])),
  md5: cols.filter((c) => c.type !== "view").map((c) => c.hash).join("").slice(0, 32),
});
function stateAdapter(getCols, hello) {
  const calls = [];
  const a = {
    hello: async () => (calls.push("hello"), hello),
    buildInfo: async () => (calls.push("buildInfo"), { version: "8.3.7" }),
    dbHash: async () => (calls.push("dbHash"), dbHashOf(getCols())),
    listCollections: async () => (calls.push("listCollections"), getCols().map((c) => ({ name: c.name, type: c.type, options: c.options }))),
    countDocuments: async (n) => (calls.push("countDocuments"), getCols().find((c) => c.name === n).count),
    listIndexes: async (n) => (calls.push("listIndexes"), getCols().find((c) => c.name === n).indexes),
    close: async () => calls.push("close"),
  };
  for (const m of ["insertOne", "updateOne", "deleteMany", "drop", "dropDatabase", "createIndex", "command", "runCommand"]) a[m] = () => { calls.push(`MUTATION:${m}`); throw new Error(m); };
  return { adapter: a, calls };
}
async function makeArtifact(id = "bk-d3-0001", cols = SOURCE_COLLECTIONS()) {
  const src = stateAdapter(() => cols, { isWritablePrimary: true, setName: "rs0", hosts: ["127.0.0.1:27999"], me: "127.0.0.1:27999" });
  let err = "";
  const code = await runBackup(["--profiles", profilesFile, "--profile", "src-a", "--output", backups, "--evidence-dir", path.join(root, "src-evidence"), "--operator", "d3-unit", "--artifact-id", id], {
    env: { LIFECYCLE_TARGET_URI: SOURCE_URI, PATH: "" },
    now: () => new Date("2026-10-28T08:00:00.000Z"),
    stdout: () => {},
    stderr: (s) => (err += s),
    openTarget: async () => src.adapter,
    locateTool: () => "/opt/mongo-tools/bin/mongodump",
    toolVersion: () => "100.13.0",
    dump: async ({ archivePath }) => (writeFileSync(archivePath, Buffer.from(`fake-archive:${id}:${"x".repeat(4096)}`)), { code: 0, stderr: "" }),
    application: () => ({ gitCommit: "f".repeat(40), dirty: false }),
    lockfileDigest: () => "e".repeat(64),
  });
  assert.equal(code, 0, err);
  return path.join(backups, id);
}

/* ----------------------------------------------------------------- D3 fakes */
const TARGET_HELLO = { isWritablePrimary: true, setName: "rsv", hosts: ["127.0.0.1:27996"], me: "127.0.0.1:27996" };
function fakeTarget({ before = [], after = (src) => src, hello = TARGET_HELLO, sourceCols = SOURCE_COLLECTIONS() } = {}) {
  let restored = false;
  const t = stateAdapter(() => (restored ? after(sourceCols.map((c) => ({ ...c }))) : before), hello);
  t.markRestored = () => { restored = true; };
  // Like MongoDB with the readWrite role: system.views cannot be counted or have its indexes listed.
  for (const m of ["countDocuments", "listIndexes"]) {
    const inner = t.adapter[m];
    t.adapter[m] = async (n) => {
      if (n === "system.views") throw Object.assign(new Error("not authorized"), { codeName: "Unauthorized" });
      return inner(n);
    };
  }
  return t;
}
function fakeRestore(target, { code = 0, onRun } = {}) {
  const calls = [];
  const fn = async (opts) => {
    calls.push({ ...opts, signal: undefined });
    await onRun?.(opts);
    if (code === 0) target.markRestored();
    return { code, stderr: code ? `error connecting to ${TARGET_URI}` : "" };
  };
  fn.calls = calls;
  return fn;
}
const args = (artifactDir, over = {}) => {
  const o = { "--artifact": artifactDir, "--profiles": profilesFile, "--profile": "verify-b", "--output": out, "--evidence-dir": ev, "--operator": "d3-unit", "--verification-id": "rv-unit-0001", ...over };
  return Object.entries(o).filter(([, v]) => v !== null).flat();
};
async function verify(argv, { target = fakeTarget(), restore, env = { LIFECYCLE_TARGET_URI: TARGET_URI, PATH: "" }, locate, signal } = {}) {
  let stdout = "";
  let stderr = "";
  const opened = [];
  const r = restore ?? fakeRestore(target);
  const code = await runRestoreVerify(argv, {
    env,
    now: () => new Date("2026-10-28T09:00:00.000Z"),
    randomHex: () => "abcd1234",
    stdout: (s) => (stdout += s),
    stderr: (s) => (stderr += s),
    openTarget: async (uri, db) => (opened.push({ uri, db }), target.adapter),
    locateTool: locate ?? (() => "/opt/mongo-tools/bin/mongorestore"),
    toolVersion: () => "100.13.0",
    restore: r,
    signal,
  });
  return { code, stdout, stderr, opened, restoreCalls: r.calls, target };
}
const vdir = (id = "rv-unit-0001") => path.join(out, id);
const events = () => (existsSync(path.join(ev, "lifecycle-evidence.jsonl")) ? readFileSync(path.join(ev, "lifecycle-evidence.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l)) : []);
const allText = () => {
  const files = [];
  const walk = (d) => {
    for (const n of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, n.name);
      if (n.isDirectory()) walk(p); else if (!p.endsWith(ARCHIVE_NAME)) files.push(readFileSync(p, "utf8"));
    }
  };
  walk(root);
  return files.join("\n");
};
const reseal = (dir, mutate) => {
  const f = path.join(dir, MANIFEST_NAME);
  const m = JSON.parse(readFileSync(f, "utf8"));
  mutate(m);
  writeFileSync(f, `${JSON.stringify(sealManifest(m), null, 2)}\n`);
};

/* ----------------------------------------------------------------- success path */
test("33, 40, 42, 43, 47, 50. a valid artifact restores into the empty verification database and verifies", async () => {
  const dir = await makeArtifact();
  const manifestBefore = readFileSync(path.join(dir, MANIFEST_NAME));
  const r = await verify(args(dir));
  assert.equal(r.code, 0, r.stderr);
  // 42. sealed, validating verification artifact
  const doc = JSON.parse(readFileSync(path.join(vdir(), VERIFICATION_NAME), "utf8"));
  assert.deepEqual(validateVerification(doc), { ok: true, problems: [] });
  assert.deepEqual(doc.status, { restoreSucceeded: true, contentVerified: true, restoreVerified: true });
  assert.equal(doc.backup.artifactId, "bk-d3-0001");
  assert.equal(doc.backup.sourceDatabase, SOURCE_DB);
  assert.equal(doc.target.verificationDatabase, VERIFY_DB);
  assert.equal(doc.target.emptyBeforeRestore, true);
  assert.deepEqual(doc.namespaceMapping, { from: `${SOURCE_DB}.*`, to: `${VERIFY_DB}.*`, include: `${SOURCE_DB}.*` });
  assert.equal(doc.tool.mongorestore, "100.13.0");
  // 33. collection set, counts, indexes, options, content
  assert.deepEqual(doc.comparison.results.map((c) => c.name), ["customers", "jobs", "zz_scratch"]);
  for (const c of doc.comparison.results) assert.deepEqual(c.checks, { type: "equal", options: "equal", count: "equal", indexes: "equal", content: "equal" });
  assert.deepEqual(doc.comparison.databaseHash, { result: "equal" });
  // 40. the collection unknown to the repository is restored and verified, not hidden
  assert.deepEqual(doc.comparison.unknownToRepository, ["zz_scratch"]);
  // 43. the D2 manifest is byte-for-byte unchanged and still says restoreVerified false
  assert.deepEqual(readFileSync(path.join(dir, MANIFEST_NAME)), manifestBefore);
  assert.equal(JSON.parse(manifestBefore).status.restoreVerified, false);
  assert.equal(verifyBackupArtifact(dir).ok, true);
  assert.deepEqual(readdirSync(dir).sort(), [ARCHIVE_NAME, MANIFEST_NAME]);
  // 47. evidence chain, in order
  assert.equal(verifyEvidence(path.join(ev, "lifecycle-evidence.jsonl")).ok, true);
  assert.deepEqual(events().map((e) => `${e.eventType}:${e.result}`), ["restore.requested:requested", "restore.identity-verified:succeeded", "restore.started:started", "restore.completed:succeeded", "verification.completed:succeeded"]);
  assert.deepEqual(doc.evidence.records.map((x) => x.eventType), ["restore.requested", "restore.identity-verified", "restore.started", "restore.completed"]);
  assert.equal(events().at(-1).digests.verification, doc.seal.digest);
  // 50. deterministic, sanitized report
  const report = JSON.parse(r.stdout);
  assert.deepEqual(Object.keys(report), ["result", "restoreVerified", "note", "verificationId", "verificationFile", "verificationDigest", "backup", "tool", "target", "verificationDatabase", "live", "comparison", "evidenceRecords"]);
  assert.equal(report.result, "RESTORE_VERIFIED");
  for (const s of SECRETS) assert.equal((r.stdout + r.stderr + allText()).includes(s), false, "no credential or URI anywhere");
  // read-only inspection only
  assert.equal(r.target.calls.some((c) => c.startsWith("MUTATION")), false);
});

test("views: a manifest claiming a non-default system.views index cannot be verified", async () => {
  const cols = WITH_VIEWS();
  const dir = await makeArtifact("bk-d3-odd-index", cols);
  const file = path.join(dir, MANIFEST_NAME);
  const m = JSON.parse(readFileSync(file, "utf8"));
  m.database.collections.find((c) => c.name === "system.views").indexes = [{ name: "odd_1", key: { odd: 1 } }];
  writeFileSync(file, JSON.stringify(sealManifest(m)));
  const r = await verify(args(dir), { target: fakeTarget({ sourceCols: cols }) });
  assert.equal(r.code, 4);
  const marker = JSON.parse(readFileSync(path.join(vdir(), NOT_VERIFIED_NAME), "utf8"));
  assert.deepEqual(marker.problems, [{ code: "INDEX_NOT_VERIFIABLE", collection: "system.views" }]);
});
test("views: system.views is compared through the view definitions and the database hash is reported as not comparable", async () => {
  const dir = await makeArtifact("bk-d3-views", WITH_VIEWS());
  // After the rename system.views hashes differently (its _id values carry the database name).
  const target = fakeTarget({ sourceCols: WITH_VIEWS(), after: (c) => c.map((x) => (x.name === "system.views" ? { ...x, hash: "f".repeat(32) } : x)) });
  const count = target.adapter.countDocuments;
  target.adapter.countDocuments = (name) => {
    assert.notEqual(name, "recent_jobs", "corrected D2 artifacts never require evaluating view data");
    return count(name);
  };
  const r = await verify(args(dir), { target });
  assert.equal(r.code, 0, r.stderr);
  const doc = JSON.parse(readFileSync(path.join(vdir(), VERIFICATION_NAME), "utf8"));
  const sv = doc.comparison.results.find((c) => c.name === "system.views");
  assert.equal(sv.content, "view-definitions");
  assert.equal(sv.checks.count, "equal");
  assert.match(sv.checks.indexes, /^server-managed/);
  assert.match(doc.comparison.results.find((c) => c.name === "recent_jobs").checks.count, /^not-applicable/);
  assert.equal(doc.comparison.databaseHash.result, "not-comparable");
  // A changed view definition is still caught.
  const changed = fakeTarget({ sourceCols: WITH_VIEWS(), after: (c) => c.map((x) => (x.name === "recent_jobs" ? { ...x, options: { viewOn: "jobs", pipeline: [] } } : x)) });
  const r2 = await verify(args(dir, { "--verification-id": "rv-unit-0002" }), { target: changed });
  assert.equal(r2.code, 4);
  assert.match(r2.stderr, /OPTIONS_MISMATCH/);
});

test("compatibility: existing D2 manifests without count/index semantics remain verifiable, including legacy numeric view counts", async () => {
  for (const [i, cols] of [SOURCE_COLLECTIONS(), WITH_VIEWS()].entries()) {
    const dir = await makeArtifact(`bk-d3-legacy-${i}`, cols);
    const file = path.join(dir, MANIFEST_NAME);
    const m = JSON.parse(readFileSync(file, "utf8"));
    for (const c of m.database.collections) {
      delete c.countSemantics;
      delete c.indexesInspected;
      const original = cols.find((x) => x.name === c.name);
      c.count = original.count;
      c.indexes = original.indexes.map((ix) => ({ ...ix, unique: ix.unique === true }));
      c.fingerprint = digestOf({ contentHash: original.hash, count: original.count });
    }
    writeFileSync(file, JSON.stringify(sealManifest(m)));
    const bytes = readFileSync(file);
    const r = await verify(args(dir, { "--verification-id": `rv-legacy-${i}` }), { target: fakeTarget({ sourceCols: cols }) });
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(readFileSync(file), bytes);
  }
});

/* ----------------------------------------------------------------- artifact preflight (1–13): refused before any connection or restore */
async function refusedBeforeRestore(dir, over, pattern, exitCode = 4) {
  const r = await verify(args(dir, over));
  assert.ok([exitCode].flat().includes(r.code), `exit ${r.code}: ${r.stderr}`);
  assert.match(r.stderr, pattern);
  assert.equal(r.restoreCalls.length, 0, "mongorestore never started");
  assert.equal(r.opened.length, 0, "no database connection");
  assert.equal(existsSync(vdir()), false, "no verification output");
  return r;
}
test("1–3. missing, relative and symbolic-link artifact paths are refused", async () => {
  const dir = await makeArtifact();
  await refusedBeforeRestore(path.join(backups, "no-such-artifact"), {}, /ARTIFACT_NOT_FOUND/, 2);
  await refusedBeforeRestore("backups/bk-d3-0001", {}, /UNSAFE_ARTIFACT/, 2);
  await refusedBeforeRestore(`${dir}/`, {}, /UNSAFE_ARTIFACT/, 2);
  const link = path.join(root, "link-to-artifact");
  symlinkSync(dir, link);
  await refusedBeforeRestore(link, {}, /UNSAFE_ARTIFACT.*symbolic link/, 2);
  const linkedParent = path.join(root, "linked-backups");
  symlinkSync(backups, linkedParent);
  await refusedBeforeRestore(path.join(linkedParent, "bk-d3-0001"), {}, /UNSAFE_ARTIFACT/, 2);
  // a symbolic link inside the artifact (archive replaced by a link to a real file) is refused too
  const dir2 = await makeArtifact("bk-d3-0002");
  const real = path.join(root, "elsewhere.gz");
  writeFileSync(real, readFileSync(path.join(dir2, ARCHIVE_NAME)));
  rmSync(path.join(dir2, ARCHIVE_NAME));
  symlinkSync(real, path.join(dir2, ARCHIVE_NAME));
  await refusedBeforeRestore(dir2, {}, /UNSAFE_ARTIFACT/);
});
test("4. an INCOMPLETE marker is refused", async () => {
  const dir = await makeArtifact();
  writeFileSync(path.join(dir, INCOMPLETE_NAME), "{}\n");
  await refusedBeforeRestore(dir, {}, /ARTIFACT_INCOMPLETE/);
});
test("5–6. a missing or invalid manifest is refused", async () => {
  const dir = await makeArtifact();
  rmSync(path.join(dir, MANIFEST_NAME));
  await refusedBeforeRestore(dir, {}, /MISSING_MANIFEST/);
  const dir2 = await makeArtifact("bk-d3-0002");
  writeFileSync(path.join(dir2, MANIFEST_NAME), "{ not json");
  await refusedBeforeRestore(dir2, {}, /MANIFEST_NOT_VALID/);
  const dir3 = await makeArtifact("bk-d3-0003");
  reseal(dir3, (m) => { m.database.collections[0].count = -1; });
  await refusedBeforeRestore(dir3, {}, /MANIFEST_NOT_VALID/);
});
test("7–8. backupCreated false or artifactChecksumsValid false is refused (restoreVerified true is not even valid D2)", async () => {
  const dir = await makeArtifact();
  reseal(dir, (m) => { m.status.backupCreated = false; });
  await refusedBeforeRestore(dir, {}, /STATUS_NOT_VERIFIABLE/);
  const dir2 = await makeArtifact("bk-d3-0002");
  reseal(dir2, (m) => { m.status.artifactChecksumsValid = false; });
  await refusedBeforeRestore(dir2, {}, /STATUS_NOT_VERIFIABLE/);
  const dir3 = await makeArtifact("bk-d3-0003");
  reseal(dir3, (m) => { m.status.restoreVerified = true; });
  await refusedBeforeRestore(dir3, {}, /MANIFEST_NOT_VALID/);
});
test("9–12. a modified, truncated or missing archive and an unexpected file are refused", async () => {
  const cases = [
    ["bk-d3-0009", (d) => { const f = path.join(d, ARCHIVE_NAME); const b = readFileSync(f); b[20] ^= 0xff; writeFileSync(f, b); }, /CHECKSUM_MISMATCH/],
    ["bk-d3-0010", (d) => truncateSync(path.join(d, ARCHIVE_NAME), 100), /TRUNCATED_FILE/],
    ["bk-d3-0011", (d) => rmSync(path.join(d, ARCHIVE_NAME)), /MISSING_FILE/],
    ["bk-d3-0012", (d) => writeFileSync(path.join(d, "notes.txt"), "x"), /EXTRA_FILE/],
    ["bk-d3-0013", (d) => appendFileSync(path.join(d, ARCHIVE_NAME), "x"), /SIZE_MISMATCH|CHECKSUM_MISMATCH/],
  ];
  for (const [id, tamper, pattern] of cases) {
    const dir = await makeArtifact(id);
    tamper(dir);
    const r = await refusedBeforeRestore(dir, {}, pattern);
    assert.match(r.stderr, /ARTIFACT_CHECK_FAILED/);
    assert.deepEqual(events().at(-1), { ...events().at(-1), eventType: "restore.failed", failureCategory: "integrity" });
  }
});
test("13. a manifest edited without a valid seal is refused", async () => {
  const dir = await makeArtifact();
  const f = path.join(dir, MANIFEST_NAME);
  writeFileSync(f, readFileSync(f, "utf8").replace('"count": 7', '"count": 8'));
  await refusedBeforeRestore(dir, {}, /MANIFEST_NOT_VALID/);
});
test("insufficient source identity and non-disposable source classes are refused", async () => {
  const dir = await makeArtifact();
  reseal(dir, (m) => { m.database.topology = "sharded"; });
  await refusedBeforeRestore(dir, {}, /MANIFEST_NOT_VALID|INSUFFICIENT_SOURCE_IDENTITY/, [2, 4]);
  const dir2 = await makeArtifact("bk-d3-0002");
  reseal(dir2, (m) => { m.source.profileClass = "production"; });
  await refusedBeforeRestore(dir2, {}, /MANIFEST_NOT_VALID|UNSUPPORTED_SOURCE/, [2, 4]);
  const dir3 = await makeArtifact("bk-d3-0003");
  reseal(dir3, (m) => { m.database.collections.push({ ...m.database.collections[0] }); });
  await refusedBeforeRestore(dir3, {}, /MANIFEST_NOT_VALID|INSUFFICIENT_SOURCE_IDENTITY/, [2, 4]);
});

/* ----------------------------------------------------------------- target identity (14–21) */
test("14–17. production, staging, managed-cloud and mongodb+srv targets are refused before anything else", async () => {
  const dir = await makeArtifact();
  const cases = [
    ["prod", "mongodb+srv://u:p@cluster0.example.mongodb.net/expresso_d3_verify", /UNSUPPORTED_PROFILE/],
    ["staging", "mongodb://u:p@10.0.0.5:27017/expresso_d3_verify?replicaSet=rsv", /UNSUPPORTED_PROFILE/],
    ["managed", "mongodb://u:p@shard-00.abc.mongodb.net:27017/expresso_d3_verify?replicaSet=rsv", /PRODUCTION_LIKE_TARGET|PROFILE_MISMATCH/],
    ["srv", "mongodb+srv://u:p@verify.example.test/expresso_d3_verify", /PRODUCTION_LIKE_TARGET/],
    ["prodname", "mongodb://u:p@127.0.0.1:27996/expresso_prod?replicaSet=rsv", /PRODUCTION_LIKE_TARGET/],
  ];
  for (const [alias, uri, pattern] of cases) {
    const r = await verify(args(dir, { "--profile": alias }), { env: { LIFECYCLE_TARGET_URI: uri, PATH: "" } });
    assert.equal(r.code, 2, alias);
    assert.match(r.stderr, pattern, alias);
    assert.equal(r.restoreCalls.length + r.opened.length, 0, alias);
  }
});
test("backup permission never implies restore-verify; a profile mismatch is refused", async () => {
  const dir = await makeArtifact();
  const r = await verify(args(dir, { "--profile": "verify-b-backup-only" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /OPERATION_NOT_ALLOWED/);
  const m = await verify(args(dir), { env: { LIFECYCLE_TARGET_URI: TARGET_URI.replace("27996", "27994"), PATH: "" } });
  assert.equal(m.code, 2);
  assert.match(m.stderr, /PROFILE_MISMATCH/);
  assert.equal(r.restoreCalls.length + r.opened.length + m.restoreCalls.length + m.opened.length, 0);
});
test("18. the source database name is refused as the verification database", async () => {
  const dir = await makeArtifact();
  const r = await verify(args(dir, { "--profile": "verify-same-db" }), { env: { LIFECYCLE_TARGET_URI: TARGET_URI.replace(VERIFY_DB, SOURCE_DB), PATH: "" } });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /SAME_DATABASE/);
  assert.equal(r.restoreCalls.length + r.opened.length, 0);
  assert.throws(() => namespaceArgs(SOURCE_DB, SOURCE_DB), (e) => e.code === "SAME_DATABASE");
});
test("19. the source fingerprint and the source server are refused, declared or live", async () => {
  const dir = await makeArtifact();
  const pre = preflightArtifact(dir);
  // same fingerprint (defence in depth: the fingerprint covers hosts, database and replica set)
  assert.throws(() => proveDistinctDeclared({ source: pre.source, identity: { restricted: { database: "other_db" }, fingerprint: pre.source.fingerprint }, profile: { connection: conn(["127.0.0.1:27996"], "other_db", "rsv") } }), (e) => e.code === "SAME_TARGET");
  // same server, different database: refused before connecting
  const r = await verify(args(dir, { "--profile": "verify-same-server" }), { env: { LIFECYCLE_TARGET_URI: `mongodb://u:p@127.0.0.1:27999/${VERIFY_DB}?replicaSet=rs0`, PATH: "" } });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /SAME_SOURCE_SERVER/);
  assert.equal(r.opened.length + r.restoreCalls.length, 0);
  // live: a server reporting the source replica set's members is refused even if the profile spelled it differently
  assert.throws(() => proveDistinctLive({ source: pre.source, hello: { setName: "rs0", hosts: ["127.0.0.1:27999", "127.0.0.1:27990"] } }), (e) => e.code === "SAME_SOURCE_SERVER");
  assert.deepEqual(proveDistinctLive({ source: pre.source, hello: TARGET_HELLO }), { liveServerDiffers: true, liveMemberSetsChecked: 1 });
});
test("20. ambiguous identity is refused: standalone target, too many hosts, no live member list", async () => {
  const dir = await makeArtifact();
  const r = await verify(args(dir, { "--profile": "verify-standalone" }), { env: { LIFECYCLE_TARGET_URI: `mongodb://u:p@127.0.0.1:27995/${VERIFY_DB}`, PATH: "" } });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /SOURCE_TARGET_AMBIGUOUS/);
  assert.equal(r.opened.length + r.restoreCalls.length, 0);
  const pre = preflightArtifact(dir);
  const hosts = Array.from({ length: 8 }, (_, i) => `127.0.0.1:${28000 + i}`);
  assert.throws(() => proveDistinctDeclared({ source: pre.source, identity: { restricted: { database: VERIFY_DB }, fingerprint: "1".repeat(64) }, profile: { connection: conn(hosts, VERIFY_DB, "rsv") } }), (e) => e.code === "SOURCE_TARGET_AMBIGUOUS");
  assert.throws(() => proveDistinctLive({ source: pre.source, hello: { isWritablePrimary: true } }), (e) => e.code === "SOURCE_TARGET_AMBIGUOUS");
  // live standalone where a replica set was declared
  const lone = await verify(args(dir), { target: fakeTarget({ hello: { isWritablePrimary: true } }) });
  assert.equal(lone.code, 2);
  assert.match(lone.stderr, /LIVE_IDENTITY_MISMATCH/);
  assert.equal(lone.restoreCalls.length, 0);
});
test("21. a live replica-set or member mismatch is refused before restore", async () => {
  const dir = await makeArtifact();
  for (const hello of [{ ...TARGET_HELLO, setName: "rs-other" }, { ...TARGET_HELLO, hosts: ["127.0.0.1:27996", "10.0.0.7:27017"] }, { ...TARGET_HELLO, msg: "isdbgrid" }, { ...TARGET_HELLO, isWritablePrimary: false }]) {
    const r = await verify(args(dir), { target: fakeTarget({ hello }) });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /LIVE_IDENTITY_MISMATCH|UNSUPPORTED_TOPOLOGY/);
    assert.equal(r.restoreCalls.length, 0);
    assert.equal(existsSync(vdir()), false);
  }
  const declared = await verify(args(dir, { "--profile": "verify-wrong-rs" }), { env: { LIFECYCLE_TARGET_URI: TARGET_URI.replace("rsv", "rs-other"), PATH: "" } });
  assert.equal(declared.code, 2);
  assert.match(declared.stderr, /LIVE_IDENTITY_MISMATCH/);
});

/* ----------------------------------------------------------------- empty target (22–23) */
test("22–23. a verification database with any collection or data is refused; nothing is dropped or cleared", async () => {
  const dir = await makeArtifact();
  const cases = {
    "empty unrelated collection": [{ name: "other", type: "collection", options: {}, count: 0, indexes: [], hash: "0".repeat(32) }],
    "application collection": [{ name: "customers", type: "collection", options: {}, count: 0, indexes: [], hash: "0".repeat(32) }],
    "one-document collection": [{ name: "zz", type: "collection", options: {}, count: 1, indexes: [], hash: "9".repeat(32) }],
  };
  for (const [label, before] of Object.entries(cases)) {
    const target = fakeTarget({ before });
    const r = await verify(args(dir), { target });
    assert.equal(r.code, 2, label);
    assert.match(r.stderr, /TARGET_NOT_EMPTY/, label);
    assert.equal(r.restoreCalls.length, 0, label);
    assert.equal(target.calls.some((c) => c.startsWith("MUTATION")), false, label);
    assert.equal(existsSync(vdir()), false, label);
  }
});

/* ----------------------------------------------------------------- tooling and restore (24–32) */
test("24. mongorestore unavailable is refused before any connection", async () => {
  const dir = await makeArtifact();
  const { locateTool } = await import("../../src/scripts/lifecycle/backup.js");
  const r = await verify(args(dir, { "--mongorestore": path.join(root, "no-such-mongorestore") }), { locate: (e, p) => locateTool("mongorestore", e, p) });
  assert.equal(r.code, 4);
  assert.match(r.stderr, /TOOL_UNAVAILABLE/);
  assert.equal(r.opened.length + r.restoreCalls.length, 0);
});
test("25. a non-zero mongorestore exit is not verified and is marked; nothing is cleaned up", async () => {
  const dir = await makeArtifact();
  const target = fakeTarget();
  const r = await verify(args(dir), { target, restore: fakeRestore(target, { code: 1 }) });
  assert.equal(r.code, 4);
  assert.match(r.stderr, /RESTORE_FAILED/);
  assert.equal(existsSync(path.join(vdir(), VERIFICATION_NAME)), false);
  const marker = JSON.parse(readFileSync(path.join(vdir(), NOT_VERIFIED_NAME), "utf8"));
  assert.equal(marker.restoreVerified, false);
  assert.equal(marker.restoreStarted, true);
  assert.equal(marker.verificationDatabase, VERIFY_DB);
  assert.equal(events().at(-1).eventType, "restore.failed");
  assert.equal(target.calls.some((c) => c.startsWith("MUTATION")), false);
  for (const s of SECRETS) assert.equal((r.stderr + allText()).includes(s), false);
});
test("26–28. the namespace is remapped exactly from the source database to the verification database, without --drop", async () => {
  const dir = await makeArtifact();
  const target = fakeTarget();
  const restore = fakeRestore(target);
  assert.equal((await verify(args(dir), { target, restore })).code, 0);
  assert.equal(restore.calls.length, 1);
  assert.equal(restore.calls[0].sourceDb, SOURCE_DB);
  assert.equal(restore.calls[0].targetDb, VERIFY_DB);
  assert.equal(restore.calls[0].archivePath, path.join(dir, ARCHIVE_NAME));
  // The restore connection string names no database: --nsTo is the only destination.
  assert.equal(restore.calls[0].uri, `mongodb://${encodeURIComponent(T_USER)}:${encodeURIComponent(T_PASS)}@127.0.0.1:27996/?replicaSet=rsv&authSource=${VERIFY_DB}`);
  const a = mongorestoreArgs({ configPath: "/p/config.yaml", archivePath: "/a/database.archive.gz", sourceDb: SOURCE_DB, targetDb: VERIFY_DB });
  assert.deepEqual(a, ["--config=/p/config.yaml", "--archive=/a/database.archive.gz", "--gzip", `--nsInclude=${SOURCE_DB}.*`, `--nsFrom=${SOURCE_DB}.*`, `--nsTo=${VERIFY_DB}.*`, "--stopOnError", "--quiet"]);
  assert.equal(a.some((x) => /--drop|--db=|-d$|--uri|--oplogReplay|--restoreDbUsersAndRoles|--preserveUUID|--username|--password/.test(x)), false);
  for (const bad of [["a.b", "v"], ["src", "v*"], ["src", "v$x"], ["", "v"], [SOURCE_DB, SOURCE_DB]]) assert.throws(() => namespaceArgs(...bad), bad.join("->"));
  assert.equal(restoreConnectionString(`mongodb://u:p@127.0.0.1:27996/${VERIFY_DB}?replicaSet=rsv&authSource=admin`, VERIFY_DB), "mongodb://u:p@127.0.0.1:27996/?replicaSet=rsv&authSource=admin");
  assert.throws(() => restoreConnectionString(`mongodb://u:p@127.0.0.1:27996/other?replicaSet=rsv`, VERIFY_DB));
});
test("29–32. the real child gets no user name, password or URI in argv and a filtered environment; the URI arrives only through the FIFO", async () => {
  // A stand-in executable records its argv and environment, and only whether its --config held a uri line.
  const bin = path.join(root, "fake-mongorestore");
  const rec = path.join(root, "rec");
  mkdirSync(rec);
  writeFileSync(bin, `#!/bin/sh\nprintf '%s\\n' "$@" > "${rec}/argv"\nenv > "${rec}/env"\ncfg="\${1#--config=}"\nif [ -p "$cfg" ]; then echo fifo > "${rec}/kind"; fi\ngrep -c '^uri: "mongodb://' "$cfg" > "${rec}/uri-lines"\nexit 0\n`);
  chmodSync(bin, 0o700);
  const prev = { ...process.env };
  process.env.LIFECYCLE_TARGET_URI = TARGET_URI;
  process.env.OTHER_MONGO = "mongodb://leak:leak@127.0.0.1:1/x";
  try {
    const res = await runMongorestore({ binary: bin, uri: restoreConnectionString(TARGET_URI, VERIFY_DB), archivePath: "/a/database.archive.gz", sourceDb: SOURCE_DB, targetDb: VERIFY_DB });
    assert.equal(res.code, 0);
  } finally {
    for (const k of ["LIFECYCLE_TARGET_URI", "OTHER_MONGO"]) if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k];
  }
  const argv = readFileSync(path.join(rec, "argv"), "utf8");
  const env = readFileSync(path.join(rec, "env"), "utf8");
  for (const s of SECRETS) {
    assert.equal(argv.includes(s), false, "argv");
    assert.equal(env.includes(s), false, "environment");
  }
  assert.equal(env.includes("LIFECYCLE_TARGET_URI"), false);
  assert.equal(env.includes("OTHER_MONGO"), false);
  assert.match(argv, /^--config=.*\/expresso-lifecycle-[^/]+\/config\.yaml\n--archive=\/a\/database\.archive\.gz\n--gzip\n/);
  assert.equal(readFileSync(path.join(rec, "kind"), "utf8").trim(), "fifo");
  assert.equal(readFileSync(path.join(rec, "uri-lines"), "utf8").trim(), "1");
  // This run's own private pipe directory is gone.
  const configDir = path.dirname(argv.split("\n")[0].slice("--config=".length));
  assert.equal(existsSync(configDir), false);
});

/* ----------------------------------------------------------------- comparison (33–39, 44, 46) */
let mm = 0;
async function mismatch(after, pattern, cols = SOURCE_COLLECTIONS()) {
  mm += 1;
  const id = `rv-unit-mm-${mm}`;
  const dir = await makeArtifact(`bk-d3-mm-${mm}`, cols);
  const target = fakeTarget({ after, sourceCols: cols });
  const r = await verify(args(dir, { "--verification-id": id }), { target });
  assert.equal(r.code, 4, r.stderr);
  assert.match(r.stderr, /CONTENT_NOT_VERIFIED/);
  assert.match(r.stderr, pattern);
  assert.equal(existsSync(path.join(vdir(id), VERIFICATION_NAME)), false, "no verification artifact");
  const marker = JSON.parse(readFileSync(path.join(vdir(id), NOT_VERIFIED_NAME), "utf8"));
  assert.equal(marker.restoreVerified, false);
  assert.ok(marker.problems.length > 0);
  assert.deepEqual(events().at(-1), { ...events().at(-1), eventType: "verification.completed", result: "failed", failureCategory: "integrity" });
  return marker;
}
test("34. a missing collection is detected", async () => {
  const m = await mismatch((c) => c.filter((x) => x.name !== "jobs"), /MISSING_COLLECTION/);
  assert.deepEqual(m.problems.find((p) => p.code === "MISSING_COLLECTION"), { code: "MISSING_COLLECTION", collection: "jobs" });
});
test("35. an unexpected collection is detected (never hidden)", async () => {
  await mismatch((c) => [...c, { name: "intruder", type: "collection", options: {}, count: 1, indexes: [], hash: "9".repeat(32) }], /UNEXPECTED_COLLECTION/);
});
test("36. a count mismatch is detected", async () => {
  await mismatch((c) => c.map((x) => (x.name === "jobs" ? { ...x, count: 6 } : x)), /COUNT_MISMATCH/);
});
test("37. an index mismatch (missing, renamed key or lost uniqueness) is detected", async () => {
  await mismatch((c) => c.map((x) => (x.name === "customers" ? { ...x, indexes: x.indexes.slice(0, 1) } : x)), /INDEX_MISMATCH/);
  await mismatch((c) => c.map((x) => (x.name === "customers" ? { ...x, indexes: [x.indexes[0], { ...x.indexes[1], unique: false }] } : x)), /INDEX_MISMATCH/);
  await mismatch((c) => c.map((x) => (x.name === "jobs" ? { ...x, indexes: [x.indexes[0], { ...x.indexes[1], key: { status: 1, customerId: 1 } }] } : x)), /INDEX_MISMATCH/);
});
test("38. an options or type mismatch is detected (order-sensitive where order matters)", async () => {
  await mismatch((c) => c.map((x) => (x.name === "recent_jobs" ? { ...x, options: { viewOn: "jobs", pipeline: [{ $sort: { b: 1, a: 1 } }] } } : x)), /OPTIONS_MISMATCH/,
    [...SOURCE_COLLECTIONS(), { name: "recent_jobs", type: "view", options: { viewOn: "jobs", pipeline: [{ $sort: { a: 1, b: 1 } }] }, count: 7, indexes: [], hash: null }, { name: "system.views", type: "collection", options: {}, count: 1, indexes: [{ name: "_id_", key: { _id: 1 } }], hash: "e".repeat(32) }]);
  await mismatch((c) => c.map((x) => (x.name === "jobs" ? { ...x, options: {} } : x)), /OPTIONS_MISMATCH/);
  await mismatch((c) => c.map((x) => (x.name === "zz_scratch" ? { ...x, type: "timeseries" } : x)), /TYPE_MISMATCH/);
});
test("39. a content-hash mismatch is detected per collection and for the database", async () => {
  const m = await mismatch((c) => c.map((x) => (x.name === "customers" ? { ...x, hash: "1".repeat(32) } : x)), /CONTENT_MISMATCH/);
  assert.ok(m.problems.some((p) => p.code === "DATABASE_HASH_MISMATCH"));
});
test("46. a partial restore (exit 0, data missing) is not verified", async () => {
  await mismatch((c) => c.map((x) => (x.name === "jobs" ? { ...x, count: 3, hash: "2".repeat(32) } : x)).filter((x) => x.name !== "zz_scratch"), /COUNT_MISMATCH|MISSING_COLLECTION/);
});
test("44. restoreVerified is true only when every comparison passed (validator and comparator)", async () => {
  const dir = await makeArtifact();
  assert.equal((await verify(args(dir))).code, 0);
  const doc = JSON.parse(readFileSync(path.join(vdir(), VERIFICATION_NAME), "utf8"));
  const forged = sealVerification({ ...doc, comparison: { ...doc.comparison, ok: false, problems: [{ code: "COUNT_MISMATCH", collection: "jobs" }] } });
  assert.equal(validateVerification(forged).ok, false);
  const partial = sealVerification({ ...doc, status: { restoreSucceeded: true, contentVerified: false, restoreVerified: true } });
  assert.equal(validateVerification(partial).ok, false);
  const tampered = { ...doc, target: { ...doc.target, verificationDatabase: "x" } };
  assert.equal(validateVerification(tampered).ok, false);
  const d2True = sealVerification({ ...doc, backup: { ...doc.backup, d2Status: { ...doc.backup.d2Status, restoreVerified: true } } });
  assert.equal(validateVerification(d2True).ok, false);
  const pre = preflightArtifact(dir);
  assert.equal(compareRestored(pre.manifest, { collections: [], databaseHash: null }).ok, false);
});

/* ----------------------------------------------------------------- source non-contact (41), artifact change, interrupts (45) */
test("41. the source is never contacted: only the verification target is opened, even when the source no longer exists", async () => {
  const dir = await makeArtifact();
  // Re-seal the artifact as if it came from a source that does not exist (nothing listens on port 1).
  const gone = targetFingerprint({ scheme: "mongodb", hosts: ["127.0.0.1:1"], database: SOURCE_DB, replicaSet: "rs-gone" });
  reseal(dir, (m) => { m.source.fingerprint = gone; });
  const r = await verify(args(dir), { env: { LIFECYCLE_TARGET_URI: TARGET_URI, PATH: "" } });
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.opened, [{ uri: TARGET_URI, db: VERIFY_DB }]);
  assert.equal(JSON.parse(r.stdout).backup.sourceFingerprint, gone);
});
test("the artifact changing during the restore is detected and not verified", async () => {
  const dir = await makeArtifact();
  const target = fakeTarget();
  const restore = fakeRestore(target, { onRun: () => appendFileSync(path.join(dir, ARCHIVE_NAME), "late") });
  const r = await verify(args(dir), { target, restore });
  assert.equal(r.code, 4);
  assert.match(r.stderr, /ARTIFACT_CHANGED/);
  assert.equal(existsSync(path.join(vdir(), VERIFICATION_NAME)), false);
});
test("45. SIGINT during the restore exits 130, is not verified, and is recorded", async () => {
  const dir = await makeArtifact();
  const controller = new AbortController();
  const target = fakeTarget();
  const restore = fakeRestore(target, { code: 1, onRun: () => controller.abort() });
  const r = await verify(args(dir), { target, restore, signal: controller.signal });
  assert.equal(r.code, 130);
  assert.match(r.stderr, /INTERRUPTED/);
  assert.equal(existsSync(path.join(vdir(), VERIFICATION_NAME)), false);
  assert.equal(JSON.parse(readFileSync(path.join(vdir(), NOT_VERIFIED_NAME), "utf8")).category, "interrupted");
  assert.deepEqual(events().at(-1), { ...events().at(-1), eventType: "restore.failed", failureCategory: "interrupted" });
  assert.equal(verifyEvidence(path.join(ev, "lifecycle-evidence.jsonl")).ok, true);
});
test("an existing verification id is never overwritten; output inside the artifact is refused", async () => {
  const dir = await makeArtifact();
  assert.equal((await verify(args(dir))).code, 0);
  const before = readFileSync(path.join(vdir(), VERIFICATION_NAME));
  const again = await verify(args(dir));
  assert.equal(again.code, 2);
  assert.match(again.stderr, /OUTPUT_COLLISION/);
  assert.deepEqual(readFileSync(path.join(vdir(), VERIFICATION_NAME)), before);
  const inside = await verify(args(dir, { "--output": dir, "--verification-id": "rv-unit-0003" }));
  assert.equal(inside.code, 2);
  assert.match(inside.stderr, /UNSAFE_OUTPUT/);
  assert.deepEqual(readdirSync(dir).sort(), [ARCHIVE_NAME, MANIFEST_NAME]);
});

/* ----------------------------------------------------------------- surface (48–49) */
test("48. only db:restore-verify exists; no generic restore, drop or cleanup command or flag", async () => {
  const scripts = JSON.parse(readFileSync(PKG, "utf8")).scripts;
  const db = Object.keys(scripts).filter((k) => k.startsWith("db:")).sort();
  assert.deepEqual(db, ["db:backup", "db:inventory", "db:manifest-check", "db:restore-verify"]);
  assert.equal(scripts["db:restore-verify"], "node src/scripts/lifecycle/restoreverify.js");
  const dir = await makeArtifact();
  for (const flag of ["--force", "--drop-existing", "--allow-production", "--skip-safety", "--yes-really", "--drop", "--target-uri", "--source-uri"]) {
    const r = await verify([...args(dir), flag, "x"]);
    assert.equal(r.code, 2, flag);
    assert.match(r.stderr, /INVALID_ARGS/, flag);
  }
  // The URI is never accepted on the command line (it would be visible in the process list).
  assert.equal(validateProfiles(JSON.parse(readFileSync(profilesFile, "utf8"))).length > 0, true);
  assert.equal(resolveTarget({ profiles: validateProfiles(JSON.parse(readFileSync(profilesFile, "utf8"))), alias: "verify-b", uri: TARGET_URI }).writeCapable, true);
});
test("49. the restore-verification source has no drop, delete, clean-up, reset, repair or migrate capability", () => {
  const code = readFileSync(path.join(SRC_DIR, "restoreverify.js"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
  assert.doesNotMatch(code, /["'`]--drop|dropDatabase|dropCollection|\.drop\(|deleteMany|deleteOne|rmSync|unlinkSync|rmdirSync|--oplogReplay|--restoreDbUsersAndRoles|--preserveUUID|--db=|["'`]--uri|shell:\s*true|execSync|\bexec\(/);
  assert.equal([...code.matchAll(/\bspawn\(/g)].length, 1);
  assert.match(code, /\bspawn\(binary, mongorestoreArgs\(\{ configPath, archivePath, sourceDb, targetDb \}\), \{ stdio: \["ignore", "ignore", "pipe"\], shell: false, env: childEnvironment\(\) \}\)/);
  assert.doesNotMatch(code, /reset|repair|migrate|cleanup/i);
});
