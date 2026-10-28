// R5-D3 — live D2 -> D3 end-to-end proof on two explicitly started, disposable
// local replica sets: source A (where D2 backs up a synthetic database) and a
// separate verification target B (authentication enabled).
//
// Opt-in: runs only when all of these are set (loopback hosts only):
//   LIFECYCLE_D2_TEST_HOST / LIFECYCLE_D2_TEST_RS      source replica set A
//   LIFECYCLE_D3_TARGET_HOST / LIFECYCLE_D3_TARGET_RS  verification replica set B
//   LIFECYCLE_D3_TARGET_ADMIN_URI                      administrator on B, used by the
//        test harness only (create/drop its own users and verification databases)
//   LIFECYCLE_MONGODUMP / LIFECYCLE_MONGORESTORE       absolute tool paths
// Synthetic data only. The harness drops only what it created.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { verifyBackupArtifact, MANIFEST_NAME, ARCHIVE_NAME } from "../../src/scripts/lifecycle/backup.js";
import { validateVerification, VERIFICATION_NAME, NOT_VERIFIED_NAME } from "../../src/scripts/lifecycle/restoreverify.js";
import { sealManifest } from "../../src/scripts/lifecycle/manifest.js";
import { verifyEvidence } from "../../src/scripts/lifecycle/evidence.js";
import { hostCategory, targetFingerprint } from "../../src/scripts/lifecycle/target.js";
import { sha256Hex } from "../../src/scripts/lifecycle/common.js";

const E = process.env;
const A_HOST = E.LIFECYCLE_D2_TEST_HOST;
const A_RS = E.LIFECYCLE_D2_TEST_RS;
const B_HOST = E.LIFECYCLE_D3_TARGET_HOST;
const B_RS = E.LIFECYCLE_D3_TARGET_RS;
const B_ADMIN = E.LIFECYCLE_D3_TARGET_ADMIN_URI;
const DUMP = E.LIFECYCLE_MONGODUMP;
const RESTORE = E.LIFECYCLE_MONGORESTORE;
const loop = (h) => hostCategory(String(h).replace(/:\d+$/, "")) === "loopback";
const enabled = Boolean(A_HOST && A_RS && B_HOST && B_RS && B_ADMIN && DUMP && RESTORE) && loop(A_HOST) && loop(B_HOST) && A_HOST !== B_HOST;
const skip = enabled ? false : "LIFECYCLE_D2_TEST_HOST/_RS, LIFECYCLE_D3_TARGET_HOST/_RS/_ADMIN_URI, LIFECYCLE_MONGODUMP, LIFECYCLE_MONGORESTORE not set (needs two disposable local replica sets)";
const LIFECYCLE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/scripts/lifecycle");

const tag = randomBytes(4).toString("hex");
const SRC_VIEWS = `expresso_d3_src_${tag}`;
const SRC_PLAIN = `expresso_d3_plain_${tag}`;
const V = (n) => `expresso_d3_v${n}_${tag}`;
const USER = `d3:v@r/${tag}#?`;
const PASS = `p@ss:w/rd#?%&=+ é-${randomBytes(6).toString("hex")}`;
const NEEDLES = [PASS, encodeURIComponent(PASS), USER, encodeURIComponent(USER), "mongodb://"];

let a;
let b;
let root;
const sourceState = {};
const created = new Set();

async function stateOf(db) {
  const hash = await db.command({ dbHash: 1 });
  const cols = (await db.listCollections().toArray()).map((c) => ({ name: c.name, type: c.type, options: c.options })).sort((x, y) => x.name.localeCompare(y.name));
  const counts = {};
  const indexes = {};
  for (const c of cols) {
    // system.views cannot be read directly even by root on an auth-enabled server: one document per view.
    if (c.name === "system.views") {
      counts[c.name] = cols.filter((x) => x.type === "view").length;
      continue;
    }
    counts[c.name] = await db.collection(c.name).countDocuments({});
    if (c.type !== "view") indexes[c.name] = (await db.collection(c.name).listIndexes().toArray()).map((i) => ({ name: i.name, key: i.key, unique: i.unique === true })).sort((x, y) => x.name.localeCompare(y.name));
  }
  return { md5: hash.md5, collections: hash.collections, cols, counts, indexes };
}

const profilesFile = (name, profiles) => {
  const f = path.join(root, `profiles-${name}.json`);
  writeFileSync(f, JSON.stringify({ schemaVersion: "expresso.lifecycle.profiles/1", profiles }));
  return f;
};
const srcProfile = (db) => ({ alias: "src-a", class: "disposable", connection: { scheme: "mongodb", hosts: [A_HOST], database: db, replicaSet: A_RS }, operations: ["backup"] });
const vProfile = (db, { host = B_HOST, rs = B_RS } = {}) => ({ alias: "verify-b", class: "disposable", connection: { scheme: "mongodb", hosts: [host], database: db, replicaSet: rs }, operations: ["restore-verify"] });
const vUri = (db, { host = B_HOST, rs = B_RS } = {}) => `mongodb://${encodeURIComponent(USER)}:${encodeURIComponent(PASS)}@${host}/${db}?replicaSet=${rs}`;

function d2Backup(db, id) {
  const r = spawnSync(process.execPath, [path.join(LIFECYCLE, "backup.js"), "--profiles", profilesFile(`src-${db}`, [srcProfile(db)]), "--profile", "src-a", "--output", path.join(root, "backups"), "--evidence-dir", path.join(root, "evidence-d2"), "--operator", "d3-it", "--artifact-id", id, "--mongodump", DUMP], {
    encoding: "utf8", env: { PATH: E.PATH, LIFECYCLE_TARGET_URI: `mongodb://${A_HOST}/${db}?replicaSet=${A_RS}` }, timeout: 180000,
  });
  assert.equal(r.status, 0, r.stderr);
  return path.join(root, "backups", id);
}
function d3(artifact, profile, uri, id) {
  return spawnSync(process.execPath, [path.join(LIFECYCLE, "restoreverify.js"), "--artifact", artifact, "--profiles", profilesFile(`v-${id}`, [profile]), "--profile", profile.alias, "--output", path.join(root, "verifications"), "--evidence-dir", path.join(root, "evidence-d3"), "--operator", "d3-it", "--verification-id", id, "--mongorestore", RESTORE], {
    encoding: "utf8", env: { PATH: E.PATH, LIFECYCLE_TARGET_URI: uri }, timeout: 180000,
  });
}
async function verifyUser(db) {
  created.add(db);
  await b.db(db).command({ createUser: USER, pwd: PASS, roles: [{ role: "readWrite", db }] });
}
const lastEvents = (n) => readFileSync(path.join(root, "evidence-d3", "lifecycle-evidence.jsonl"), "utf8").trim().split("\n").slice(-n).map((l) => JSON.parse(l).eventType);
const databasesOn = async (client) => (await client.db("admin").admin().listDatabases()).databases.map((d) => d.name);
const clean = (r) => NEEDLES.every((n) => !(r.stdout + r.stderr).includes(n));

before(async () => {
  if (!enabled) return;
  a = new mongoose.mongo.MongoClient(`mongodb://${A_HOST}/?directConnection=true`, { serverSelectionTimeoutMS: 8000 });
  b = new mongoose.mongo.MongoClient(B_ADMIN, { directConnection: true, serverSelectionTimeoutMS: 8000 });
  await a.connect();
  await b.connect();
  // Synthetic source with views, a capped and a validated collection and an unknown collection.
  const s = a.db(SRC_VIEWS);
  const customers = Array.from({ length: 40 }, (_, i) => ({ _id: new mongoose.Types.ObjectId(), companyName: `Synthetic Co ${i}`, primaryEmail: `c${i}@example.test` }));
  await s.collection("customers").insertMany(customers);
  await s.collection("customers").createIndex({ primaryEmail: 1 }, { unique: true });
  await s.collection("jobs").insertMany(Array.from({ length: 120 }, (_, i) => ({ customerId: customers[i % 40]._id, status: i % 3 ? "brief" : "done", seq: i })));
  await s.collection("jobs").createIndex({ customerId: 1, status: 1 });
  await s.collection("jobs").createIndex({ status: 1, seq: -1 }, { name: "status_seq_desc" });
  await s.createCollection("audit_capped", { capped: true, size: 65536, max: 50 });
  await s.collection("audit_capped").insertMany([{ e: 1 }, { e: 2 }, { e: 3 }]);
  await s.createCollection("settings", { validator: { $jsonSchema: { bsonType: "object", required: ["key"] } } });
  await s.collection("settings").insertOne({ key: "synthetic" });
  await s.createCollection("brief_jobs", { viewOn: "jobs", pipeline: [{ $match: { status: "brief" } }, { $sort: { seq: 1 } }] });
  await s.collection("zz_scratch").insertMany([{ n: 1 }, { n: 2 }]);
  const p = a.db(SRC_PLAIN);
  await p.collection("media").insertMany(Array.from({ length: 25 }, (_, i) => ({ key: `synthetic/${i}.jpg` })));
  await p.collection("media").createIndex({ key: 1 }, { unique: true });
  await p.collection("zz_other").insertOne({ x: 1 });
  sourceState[SRC_VIEWS] = await stateOf(s);
  sourceState[SRC_PLAIN] = await stateOf(p);
  root = realpathSync(mkdtempSync(path.join(tmpdir(), "d3-it-")));
  for (const d of ["backups", "verifications"]) mkdirSync(path.join(root, d));
});

after(async () => {
  if (!enabled) return;
  // Harness cleanup on the disposable servers only: what this test created.
  for (const db of created) {
    try {
      await b.db(db).command({ dropAllUsersFromDatabase: 1 });
    } catch {
      // none
    }
    await b.db(db).dropDatabase();
  }
  await a.db(SRC_VIEWS).dropDatabase();
  await a.db(SRC_PLAIN).dropDatabase();
  await a.close();
  await b.close();
  rmSync(root, { recursive: true, force: true });
});

let artifactViews;
let artifactPlain;

test("D3 live: a real D2 artifact (views, capped, validated, unknown collection) restores into a fresh database on B and verifies", { skip }, async () => {
  artifactViews = d2Backup(SRC_VIEWS, "bk-d3-it-views");
  artifactPlain = d2Backup(SRC_PLAIN, "bk-d3-it-plain");
  const manifestBefore = readFileSync(path.join(artifactViews, MANIFEST_NAME));
  await verifyUser(V(1));
  assert.deepEqual(await b.db(V(1)).listCollections().toArray(), [], "verification database empty before");

  const r = d3(artifactViews, vProfile(V(1)), vUri(V(1)), "rv-it-0001");
  assert.equal(r.status, 0, r.stderr);
  assert.ok(clean(r), "no credential or URI in output");
  const report = JSON.parse(r.stdout);
  assert.equal(report.result, "RESTORE_VERIFIED");
  assert.equal(report.comparison.databaseHash, "not-comparable");
  assert.ok(report.comparison.unknownToRepository.includes("zz_scratch"), "the collection unknown to the repository is restored and verified");

  const doc = JSON.parse(readFileSync(path.join(root, "verifications", "rv-it-0001", VERIFICATION_NAME), "utf8"));
  assert.deepEqual(validateVerification(doc), { ok: true, problems: [] });
  assert.deepEqual(doc.status, { restoreSucceeded: true, contentVerified: true, restoreVerified: true });
  assert.notEqual(doc.backup.sourceDatabase, doc.target.verificationDatabase);
  assert.equal(doc.tool.mongorestore, "100.13.0");

  // Independent check by the harness: B's restored database equals A's source state.
  const restored = await stateOf(b.db(V(1)));
  const src = sourceState[SRC_VIEWS];
  assert.deepEqual(restored.cols, src.cols, "collections, types and options");
  assert.deepEqual(restored.counts, src.counts, "counts");
  assert.deepEqual(restored.indexes, src.indexes, "indexes");
  for (const [name, h] of Object.entries(src.collections)) {
    if (name === "system.views") assert.notEqual(restored.collections[name], h, "system.views hash depends on the database name");
    else assert.equal(restored.collections[name], h, name);
  }
  // Namespace remapping: nothing was restored under the source name on B.
  assert.equal((await databasesOn(b)).includes(SRC_VIEWS), false);
  // Source A unchanged; D2 manifest byte-for-byte unchanged; artifact still verifies.
  assert.deepEqual(await stateOf(a.db(SRC_VIEWS)), src);
  assert.deepEqual(readFileSync(path.join(artifactViews, MANIFEST_NAME)), manifestBefore);
  assert.equal(JSON.parse(manifestBefore).status.restoreVerified, false);
  assert.equal(verifyBackupArtifact(artifactViews).ok, true);
  assert.deepEqual(readdirSync(artifactViews).sort(), [ARCHIVE_NAME, MANIFEST_NAME]);
  assert.equal(verifyEvidence(path.join(root, "evidence-d3", "lifecycle-evidence.jsonl")).ok, true);
  assert.deepEqual(lastEvents(5), ["restore.requested", "restore.identity-verified", "restore.started", "restore.completed", "verification.completed"]);
});

test("D3 live: without views the database-level dbHash is compared and equal", { skip }, async () => {
  await verifyUser(V(2));
  const r = d3(artifactPlain, vProfile(V(2)), vUri(V(2)), "rv-it-0002");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).comparison.databaseHash, "equal");
  assert.equal((await stateOf(b.db(V(2)))).md5, sourceState[SRC_PLAIN].md5);
});

test("D3 live: the source is not needed — an artifact whose recorded source does not exist still verifies", { skip }, async () => {
  const copy = path.join(root, "backups", "bk-d3-it-gone");
  cpSync(artifactPlain, copy, { recursive: true });
  const f = path.join(copy, MANIFEST_NAME);
  const m = JSON.parse(readFileSync(f, "utf8"));
  m.operationId = "bk-d3-it-gone";
  m.source.fingerprint = targetFingerprint({ scheme: "mongodb", hosts: ["127.0.0.1:1"], database: m.database.name, replicaSet: "rs-gone" });
  writeFileSync(f, `${JSON.stringify(sealManifest(m), null, 2)}\n`);
  await verifyUser(V(3));
  const r = d3(copy, vProfile(V(3)), vUri(V(3)), "rv-it-0003");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).backup.sourceFingerprint, m.source.fingerprint);
});

test("D3 live: a tampered archive is refused before mongorestore starts", { skip }, async () => {
  const copy = path.join(root, "backups", "bk-d3-it-tamper");
  cpSync(artifactPlain, copy, { recursive: true });
  const f = path.join(copy, ARCHIVE_NAME);
  const buf = readFileSync(f);
  buf[Math.floor(buf.length / 2)] ^= 0xff;
  writeFileSync(f, buf);
  await verifyUser(V(4));
  const r = d3(copy, vProfile(V(4)), vUri(V(4)), "rv-it-0004");
  assert.equal(r.status, 4, r.stderr);
  assert.match(r.stderr, /ARTIFACT_CHECK_FAILED.*CHECKSUM_MISMATCH/);
  assert.deepEqual(await b.db(V(4)).listCollections().toArray(), [], "nothing restored");
  assert.deepEqual(lastEvents(2), ["restore.requested", "restore.failed"], "restore.started never recorded");
  assert.equal(existsSync(path.join(root, "verifications", "rv-it-0004")), false);
});

test("D3 live: a non-empty verification database is refused and left exactly as it was", { skip }, async () => {
  await verifyUser(V(5));
  await b.db(V(5)).collection("preexisting").insertOne({ keep: true });
  const r = d3(artifactPlain, vProfile(V(5)), vUri(V(5)), "rv-it-0005");
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /TARGET_NOT_EMPTY/);
  const cols = (await b.db(V(5)).listCollections().toArray()).map((c) => c.name);
  assert.deepEqual(cols, ["preexisting"]);
  assert.equal(await b.db(V(5)).collection("preexisting").countDocuments({}), 1);
  assert.equal(existsSync(path.join(root, "verifications", "rv-it-0005")), false);
});

test("D3 live: the source server, the source database name and a replica-set mismatch are refused", { skip }, async () => {
  // Source server A as the target (different database name): refused before connecting.
  const sameServer = d3(artifactPlain, vProfile(V(6), { host: A_HOST, rs: A_RS }), vUri(V(6), { host: A_HOST, rs: A_RS }), "rv-it-0006");
  assert.equal(sameServer.status, 2, sameServer.stderr);
  assert.match(sameServer.stderr, /SAME_SOURCE_SERVER/);
  assert.equal((await databasesOn(a)).includes(V(6)), false);
  // The source database name on B.
  const sameDb = d3(artifactPlain, vProfile(SRC_PLAIN), vUri(SRC_PLAIN), "rv-it-0007");
  assert.equal(sameDb.status, 2, sameDb.stderr);
  assert.match(sameDb.stderr, /SAME_DATABASE/);
  assert.equal((await databasesOn(b)).includes(SRC_PLAIN), false);
  // A declared replica-set name B does not have.
  await verifyUser(V(8));
  const wrongRs = d3(artifactPlain, vProfile(V(8), { rs: "rs-wrong" }), vUri(V(8), { rs: "rs-wrong" }), "rv-it-0008");
  assert.equal(wrongRs.status, 2, wrongRs.stderr);
  assert.match(wrongRs.stderr, /LIVE_IDENTITY_MISMATCH/);
  assert.deepEqual(await b.db(V(8)).listCollections().toArray(), []);
  for (const r of [sameServer, sameDb, wrongRs]) assert.ok(clean(r));
  // Neither source changed.
  assert.deepEqual(await stateOf(a.db(SRC_PLAIN)), sourceState[SRC_PLAIN]);
  assert.equal(sha256Hex(readFileSync(path.join(artifactPlain, MANIFEST_NAME))).length, 64);
});

test("D3 live: no restore-verification or NOT-VERIFIED file exists for refused runs; verified runs have exactly one", { skip }, async () => {
  const dirs = readdirSync(path.join(root, "verifications")).sort();
  assert.deepEqual(dirs, ["rv-it-0001", "rv-it-0002", "rv-it-0003"]);
  for (const d of dirs) assert.deepEqual(readdirSync(path.join(root, "verifications", d)), [VERIFICATION_NAME]);
  assert.equal(dirs.some((d) => existsSync(path.join(root, "verifications", d, NOT_VERIFIED_NAME))), false);
});
