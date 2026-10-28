// Authenticated D2-with-view -> D3 regression on disposable loopback servers.
// Same opt-in auth-source / D3-target variables as the process-list suites.
// Only the harness creates a synthetic read user and mutates its own view.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { runBackup, runMongodump, verifyBackupArtifact, MANIFEST_NAME, INCOMPLETE_NAME } from "../../src/scripts/lifecycle/backup.js";
import { validateVerification, VERIFICATION_NAME } from "../../src/scripts/lifecycle/restoreverify.js";
import { validateManifest } from "../../src/scripts/lifecycle/manifest.js";
import { hostCategory } from "../../src/scripts/lifecycle/target.js";

const E = process.env;
const A_HOST = E.LIFECYCLE_D2_AUTH_HOST;
const B_HOST = E.LIFECYCLE_D3_TARGET_HOST;
const B_RS = E.LIFECYCLE_D3_TARGET_RS;
const loop = (h) => hostCategory(String(h).replace(/:\d+$/, "")) === "loopback";
const enabled = Boolean(A_HOST && E.LIFECYCLE_D2_AUTH_ADMIN_URI && B_HOST && B_RS && E.LIFECYCLE_D3_TARGET_ADMIN_URI && E.LIFECYCLE_MONGODUMP && E.LIFECYCLE_MONGORESTORE) && loop(A_HOST) && loop(B_HOST) && A_HOST !== B_HOST;
const skip = enabled ? false : "needs disposable auth source and separate D3 replica set (D2_AUTH and D3_TARGET variables)";
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/scripts/lifecycle");
const tag = randomBytes(4).toString("hex");
const SRC = `expresso_d2_view_${tag}`;
const DST = `expresso_d3_view_${tag}`;
const USER = `view:reader@${tag}`;
const PASS = `synthetic:p@ss/#? é-${tag}`;
const SOURCE_URI = `mongodb://${encodeURIComponent(USER)}:${encodeURIComponent(PASS)}@${A_HOST}/${SRC}`;
const TARGET_URI = `mongodb://${encodeURIComponent(USER)}:${encodeURIComponent(PASS)}@${B_HOST}/${DST}?replicaSet=${B_RS}`;
const DEFINITION = { viewOn: "jobs", pipeline: [{ $match: { status: "brief" } }, { $sort: { owner: 1, seq: -1 } }], collation: { locale: "simple" } };
let a;
let b;
let reader;
let root;
let profiles;
let source;

// Independent harness inspection: definitions only for views; full ordinary counts/indexes/hashes.
async function state(db) {
  const hash = await db.command({ dbHash: 1 });
  const cols = (await db.listCollections().toArray()).map((c) => ({ name: c.name, type: c.type, options: c.options })).sort((x, y) => x.name.localeCompare(y.name));
  const counts = {};
  const indexes = {};
  for (const c of cols) {
    if (c.type === "view" || c.name === "system.views") continue;
    counts[c.name] = await db.collection(c.name).countDocuments({});
    indexes[c.name] = (await db.collection(c.name).listIndexes().toArray()).map((ix) => ({ name: ix.name, key: ix.key, unique: ix.unique === true })).sort((x, y) => x.name.localeCompare(y.name));
  }
  return { cols, counts, indexes, hashes: hash.collections, databaseHash: hash.md5 };
}
const backupArgs = (id) => ["--profiles", profiles, "--profile", "view-source", "--output", path.join(root, "backups"), "--evidence-dir", path.join(root, "evidence-d2"), "--operator", "view-regression", "--artifact-id", id, "--mongodump", E.LIFECYCLE_MONGODUMP];

before(async () => {
  if (!enabled) return;
  a = new mongoose.mongo.MongoClient(E.LIFECYCLE_D2_AUTH_ADMIN_URI, { directConnection: true });
  b = new mongoose.mongo.MongoClient(E.LIFECYCLE_D3_TARGET_ADMIN_URI, { directConnection: true });
  await a.connect();
  await b.connect();
  const s = a.db(SRC);
  await s.collection("jobs").insertMany([{ owner: "a", seq: 1, status: "brief" }, { owner: "a", seq: 2, status: "done" }, { owner: "b", seq: 3, status: "brief" }]);
  await s.collection("jobs").createIndex({ owner: 1, seq: -1 }, { name: "owner_seq" });
  await s.collection("zz_view_unknown").insertMany([{ n: 1 }, { n: 2 }]);
  await s.createCollection("brief_jobs", DEFINITION);
  await s.command({ createUser: USER, pwd: PASS, roles: [{ role: "read", db: SRC }] });
  await b.db(DST).command({ createUser: USER, pwd: PASS, roles: [{ role: "readWrite", db: DST }] });
  reader = new mongoose.mongo.MongoClient(SOURCE_URI, { directConnection: true });
  await reader.connect();
  source = await state(s);
  root = realpathSync(mkdtempSync(path.join(tmpdir(), "d2-view-regression-")));
  for (const dir of ["backups", "verifications"]) mkdirSync(path.join(root, dir));
  profiles = path.join(root, "profiles.json");
  writeFileSync(profiles, JSON.stringify({ schemaVersion: "expresso.lifecycle.profiles/1", profiles: [
    { alias: "view-source", class: "disposable", connection: { scheme: "mongodb", hosts: [A_HOST], database: SRC }, operations: ["backup"] },
    { alias: "view-target", class: "disposable", connection: { scheme: "mongodb", hosts: [B_HOST], database: DST, replicaSet: B_RS }, operations: ["restore-verify"] },
  ] }));
});
after(async () => {
  if (!enabled) return;
  await reader?.close();
  // Exact synthetic namespaces/users only; no lifecycle cleanup capability.
  await a.db(SRC).command({ dropUser: USER });
  await b.db(DST).command({ dropUser: USER });
  await a.db(SRC).dropDatabase();
  await b.db(DST).dropDatabase();
  await a.close();
  await b.close();
  if (root) rmSync(root, { recursive: true, force: true });
});

test("D2 authenticated view: built-in read only; exact artifact restores and verifies in D3; source and D2 manifest unchanged", { skip }, async () => {
  const rolesBefore = (await reader.db(SRC).command({ connectionStatus: 1 })).authInfo.authenticatedUserRoles;
  assert.deepEqual(rolesBefore, [{ role: "read", db: SRC }]);
  await assert.rejects(reader.db(SRC).collection("system.views").countDocuments({}), (e) => e.codeName === "Unauthorized");
  await assert.rejects(reader.db(SRC).collection("system.views").listIndexes().toArray(), (e) => e.codeName === "Unauthorized");
  const r = spawnSync(process.execPath, [path.join(DIR, "backup.js"), ...backupArgs("bk-auth-view-01")], { encoding: "utf8", env: { PATH: E.PATH, LIFECYCLE_TARGET_URI: SOURCE_URI }, timeout: 120000 });
  assert.equal(r.status, 0, r.stderr);
  const artifact = path.join(root, "backups", "bk-auth-view-01");
  const manifestBytes = readFileSync(path.join(artifact, MANIFEST_NAME));
  const m = JSON.parse(manifestBytes);
  assert.equal(validateManifest(m).status, "VALID");
  assert.equal(verifyBackupArtifact(artifact).ok, true);
  assert.deepEqual(m.status, { backupCreated: true, artifactChecksumsValid: true, restoreVerified: false });
  const by = Object.fromEntries(m.database.collections.map((c) => [c.name, c]));
  assert.equal(by.jobs.count, 3);
  assert.equal(by.jobs.countSemantics, "documents");
  assert.equal(by.brief_jobs.type, "view");
  assert.equal(by.brief_jobs.count, null);
  assert.equal(by.brief_jobs.countSemantics, "not-applicable");
  assert.deepEqual(by.brief_jobs.options, source.cols.find((c) => c.name === "brief_jobs").options);
  assert.equal(by["system.views"].count, 1);
  assert.equal(by["system.views"].countSemantics, "view-definitions");
  assert.equal(by["system.views"].indexesInspected, false);
  assert.equal(by.zz_view_unknown.knownToRepository, false);
  assert.equal(JSON.parse(r.stdout).collections.documents, 5);
  assert.deepEqual(await state(a.db(SRC)), source);
  assert.deepEqual(await b.db(DST).listCollections().toArray(), []);
  const restored = spawnSync(process.execPath, [path.join(DIR, "restoreverify.js"), "--artifact", artifact, "--profiles", profiles, "--profile", "view-target", "--output", path.join(root, "verifications"), "--evidence-dir", path.join(root, "evidence-d3"), "--operator", "view-regression", "--verification-id", "rv-auth-view-01", "--mongorestore", E.LIFECYCLE_MONGORESTORE], { encoding: "utf8", env: { PATH: E.PATH, LIFECYCLE_TARGET_URI: TARGET_URI }, timeout: 120000 });
  assert.equal(restored.status, 0, restored.stderr);
  const v = JSON.parse(readFileSync(path.join(root, "verifications", "rv-auth-view-01", VERIFICATION_NAME)));
  assert.deepEqual(validateVerification(v), { ok: true, problems: [] });
  assert.deepEqual(v.status, { restoreSucceeded: true, contentVerified: true, restoreVerified: true });
  const actual = await state(b.db(DST));
  assert.deepEqual(actual.cols, source.cols, "view type and exact definition/options restored");
  assert.deepEqual(actual.counts, source.counts);
  assert.deepEqual(actual.indexes, source.indexes);
  for (const [name, hash] of Object.entries(source.hashes)) if (name !== "system.views") assert.equal(actual.hashes[name], hash);
  assert.deepEqual(await state(a.db(SRC)), source, "source unchanged after D3");
  assert.deepEqual(readFileSync(path.join(artifact, MANIFEST_NAME)), manifestBytes);
  assert.deepEqual((await reader.db(SRC).command({ connectionStatus: 1 })).authInfo.authenticatedUserRoles, rolesBefore);
  for (const output of [r.stdout + r.stderr, restored.stdout + restored.stderr, JSON.stringify(m), JSON.stringify(v)]) {
    assert.equal([PASS, encodeURIComponent(PASS), "mongodb://"].some((secret) => output.includes(secret)), false);
  }
  // Optional retained, credential-free review artifacts, outside the repository.
  if (E.LIFECYCLE_VIEW_REVIEW_OUTPUT) {
    assert.ok(path.isAbsolute(E.LIFECYCLE_VIEW_REVIEW_OUTPUT));
    const dest = path.join(E.LIFECYCLE_VIEW_REVIEW_OUTPUT, `auth-view-${tag}`);
    mkdirSync(dest);
    cpSync(artifact, path.join(dest, "d2"), { recursive: true });
    cpSync(path.join(root, "verifications", "rv-auth-view-01"), path.join(dest, "d3"), { recursive: true });
  }
});

test("D2 authenticated view: a definition changed during capture is refused without escalating the read user's privileges", { skip }, async () => {
  let stderr = "";
  const code = await runBackup(backupArgs("bk-auth-view-change"), {
    env: { PATH: E.PATH, LIFECYCLE_TARGET_URI: SOURCE_URI },
    stdout: () => {}, stderr: (s) => (stderr += s),
    dump: async (opts) => {
      const result = await runMongodump(opts);
      assert.equal(result.code, 0);
      await a.db(SRC).command({ collMod: "brief_jobs", viewOn: "jobs", pipeline: [{ $match: { status: "done" } }] });
      return result;
    },
  });
  assert.equal(code, 4);
  assert.match(stderr, /SOURCE_CHANGED_DURING_BACKUP/);
  const dir = path.join(root, "backups", "bk-auth-view-change");
  assert.equal(existsSync(path.join(dir, MANIFEST_NAME)), false);
  assert.equal(existsSync(path.join(dir, INCOMPLETE_NAME)), true);
  assert.deepEqual((await reader.db(SRC).command({ connectionStatus: 1 })).authInfo.authenticatedUserRoles, [{ role: "read", db: SRC }]);
});
