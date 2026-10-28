// R5-D2 — backup against an explicitly created, disposable local replica set.
//
// Opt-in: runs only when LIFECYCLE_D2_TEST_HOST (e.g. 127.0.0.1:27999),
// LIFECYCLE_D2_TEST_RS (replica-set name) and LIFECYCLE_MONGODUMP (absolute
// path) are set. It seeds a uniquely named synthetic database, backs it up
// through the real CLI and real mongodump, verifies the artifact, manifest,
// evidence and source integrity, then drops only that synthetic database.
// It never restores. Never point it at anything but a disposable local server.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, realpathSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { verifyBackupArtifact, MANIFEST_NAME } from "../../src/scripts/lifecycle/backup.js";
import { validateManifest } from "../../src/scripts/lifecycle/manifest.js";
import { verifyEvidence } from "../../src/scripts/lifecycle/evidence.js";
import { hostCategory } from "../../src/scripts/lifecycle/target.js";

const HOST = process.env.LIFECYCLE_D2_TEST_HOST;
const RS = process.env.LIFECYCLE_D2_TEST_RS;
const DUMP = process.env.LIFECYCLE_MONGODUMP;
const enabled = Boolean(HOST && RS && DUMP) && hostCategory(String(HOST).replace(/:\d+$/, "")) === "loopback";
const skip = enabled ? false : "LIFECYCLE_D2_TEST_HOST / _RS / LIFECYCLE_MONGODUMP not set (needs a disposable local replica set)";
const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/scripts/lifecycle/backup.js");

const DB = `expresso_d2_it_${randomBytes(4).toString("hex")}`;
const uri = (db) => `mongodb://${HOST}/${db}?replicaSet=${RS}`;
let client;
let root;
let source;

async function sourceState(db) {
  const hash = await db.command({ dbHash: 1 });
  const cols = (await db.listCollections().toArray()).map((c) => c.name).sort();
  const counts = {};
  const indexes = {};
  for (const c of cols) {
    counts[c] = await db.collection(c).countDocuments({});
    indexes[c] = (await db.collection(c).listIndexes().toArray()).map((i) => i.name).sort();
  }
  return { md5: hash.md5, collections: hash.collections, counts, indexes };
}

before(async () => {
  if (!enabled) return;
  client = new mongoose.mongo.MongoClient(uri(DB), { directConnection: true, serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(DB);
  // Synthetic data only: no real client or user data.
  const customers = Array.from({ length: 5 }, (_, i) => ({ _id: new mongoose.Types.ObjectId(), companyName: `Synthetic Co ${i}`, primaryEmail: `c${i}@example.test` }));
  const projects = customers.slice(0, 4).map((c, i) => ({ _id: new mongoose.Types.ObjectId(), name: `Project ${i}`, customerId: c._id }));
  const media = Array.from({ length: 3 }, (_, i) => ({ _id: new mongoose.Types.ObjectId(), key: `synthetic/${i}.jpg` }));
  const jobs = Array.from({ length: 12 }, (_, i) => ({ customerId: projects[i % 4].customerId, projectId: projects[i % 4]._id, media: [media[i % 3]._id], status: i % 2 ? "brief" : "done" }));
  await db.collection("customers").insertMany(customers);
  await db.collection("projects").insertMany(projects);
  await db.collection("media").insertMany(media);
  await db.collection("jobs").insertMany(jobs);
  await db.collection("zz_scratch").insertMany([{ n: 1 }, { n: 2 }]);
  await db.collection("customers").createIndex({ primaryEmail: 1 }, { unique: true });
  await db.collection("jobs").createIndex({ customerId: 1, status: 1 });
  await db.collection("projects").createIndex({ customerId: 1 });
  source = await sourceState(db);
  root = realpathSync(mkdtempSync(path.join(tmpdir(), "d2-integration-")));
  mkdirSync(path.join(root, "backups"));
});

after(async () => {
  if (!enabled) return;
  // Test cleanup on the disposable server only: the synthetic database this test created.
  await client.db(DB).dropDatabase();
  await client.close();
  rmSync(root, { recursive: true, force: true });
});

const profiles = (rs = RS, ops = ["backup"]) => {
  const f = path.join(root, `profiles-${rs}-${ops.join("-")}.json`);
  writeFileSync(f, JSON.stringify({ schemaVersion: "expresso.lifecycle.profiles/1", profiles: [{ alias: "local-d2-it", class: "disposable", connection: { scheme: "mongodb", hosts: [HOST], database: DB, replicaSet: rs }, operations: ops }] }));
  return f;
};
const backup = (profilesFile, id, targetUri = uri(DB)) => spawnSync(process.execPath, [CLI, "--profiles", profilesFile, "--profile", "local-d2-it", "--output", path.join(root, "backups"), "--evidence-dir", path.join(root, "evidence"), "--operator", "d2-integration", "--artifact-id", id, "--mongodump", DUMP], {
  encoding: "utf8",
  env: { PATH: process.env.PATH, LIFECYCLE_TARGET_URI: targetUri },
  timeout: 120000,
});

test("D2 live: backup of the disposable replica set is created, checksummed, manifested and evidenced", { skip }, async () => {
  const r = backup(profiles(), "bk-it-0001");
  assert.equal(r.status, 0, r.stderr);
  const report = JSON.parse(r.stdout);
  assert.equal(report.result, "BACKUP_CREATED");
  assert.equal(report.restoreVerified, false);
  assert.equal(report.live.memberCheck, "all-members-loopback-and-declared");

  const dir = path.join(root, "backups", "bk-it-0001");
  const check = verifyBackupArtifact(dir);
  assert.equal(check.ok, true, JSON.stringify(check.problems));
  assert.equal(check.restoreVerified, false);
  const m = JSON.parse(readFileSync(path.join(dir, MANIFEST_NAME), "utf8"));
  assert.equal(validateManifest(m).status, "VALID");
  assert.deepEqual(m.status, { backupCreated: true, artifactChecksumsValid: true, restoreVerified: false });
  assert.equal(m.time.consistency.method, "quiescent-verified");
  assert.equal(m.database.topology, "replica-set");

  // Collections, counts and indexes match the source.
  const by = Object.fromEntries(m.database.collections.map((c) => [c.name, c]));
  assert.deepEqual(Object.keys(by).sort(), Object.keys(source.counts));
  for (const [name, count] of Object.entries(source.counts)) {
    assert.equal(by[name].count, count, name);
    assert.deepEqual(by[name].indexes.map((i) => i.name).sort(), source.indexes[name], name);
  }
  assert.equal(by.zz_scratch.knownToRepository, false);

  assert.equal(verifyEvidence(path.join(root, "evidence", "lifecycle-evidence.jsonl")).ok, true);

  // The source is unchanged by the backup.
  const now = await sourceState(client.db(DB));
  assert.deepEqual(now, source);
  assert.doesNotMatch(r.stdout + r.stderr, /mongodb:\/\//);
});

test("D2 live: a declared replica-set name the server does not have is refused before any artifact", { skip }, async () => {
  const r = backup(profiles("rs-wrong"), "bk-it-0002", `mongodb://${HOST}/${DB}?replicaSet=rs-wrong`);
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /LIVE_IDENTITY_MISMATCH/);
  assert.deepEqual(JSON.parse(JSON.stringify((await import("node:fs")).readdirSync(path.join(root, "backups")))).includes("bk-it-0002"), false);
  assert.deepEqual(await sourceState(client.db(DB)), source);
});
