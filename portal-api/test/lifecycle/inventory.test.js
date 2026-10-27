import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCatalog, loadCatalog, unknownCollectionEntry } from "../../src/scripts/lifecycle/catalog.js";
import { runInventory, snapshotAdapter, readOnlyAdapter, validateSnapshot, READ_METHODS } from "../../src/scripts/lifecycle/inventory.js";
import { validateProfiles, resolveTarget, publicIdentity } from "../../src/scripts/lifecycle/target.js";
import { LOCAL_URI_WITH_CREDS, profilesDoc, miniInventory, miniClassification, snapshotFor, FIXED_NOW } from "./fixtures.js";

const catalog = buildCatalog({ inventory: miniInventory(), classification: miniClassification() });
const identity = resolveTarget({ profiles: validateProfiles(profilesDoc()), alias: "local-fixture", uri: LOCAL_URI_WITH_CREDS });

const MUTATIONS = ["insertOne", "insertMany", "updateOne", "updateMany", "replaceOne", "deleteOne", "deleteMany", "drop", "dropDatabase", "dropCollection", "createIndex", "createIndexes", "dropIndex", "dropIndexes", "syncIndexes", "bulkWrite", "create", "save", "rename", "createCollection"];

/** A spy adapter with every read method AND every mutation method; mutations throw. */
function spyAdapter(doc) {
  const base = snapshotAdapter(doc);
  const calls = [];
  const a = { ...base };
  for (const m of READ_METHODS) a[m] = (...args) => (calls.push(m), base[m](...args));
  for (const m of MUTATIONS) a[m] = () => {
    calls.push(m);
    throw new Error(`mutation ${m} called`);
  };
  return { adapter: a, calls };
}

const snapshot = () =>
  snapshotFor(identity.fingerprint, [
    { name: "users", count: 4, options: {}, indexes: [{ name: "_id_", key: { _id: 1 } }, { name: "email_1", key: { email: 1 }, unique: true }] },
    { name: "invites", count: 1, indexes: [{ name: "tokenHash_1", key: { tokenHash: 1 } }] },
    { name: "media", count: 12 },
    { name: "legacy_imports", count: 7 },
  ]);

test("known present, known absent and unknown collections are distinguished", async () => {
  const { adapter } = spyAdapter(snapshot());
  const r = await runInventory({ catalog, identity: publicIdentity(identity), adapter, now: FIXED_NOW });
  const by = Object.fromEntries(r.collections.map((c) => [c.collection, c]));
  assert.equal(by.users.status, "present");
  assert.equal(by.users.count, 4);
  assert.deepEqual(by.users.indexes.map((i) => i.name), ["_id_", "email_1"]);
  assert.equal(by.teams.status, "known-absent");
  assert.equal(by.legacy_imports.status, "unknown");
  assert.deepEqual(r.summary, { known: 22, present: 3, knownAbsent: 19, unknown: 1, notObserved: 0 });
  assert.equal(r.generatedAt, "2026-10-27T09:00:00.000Z");
  assert.equal(r.readOnly, true);
  assert.ok(r.warnings.some((w) => /not known to the repository/.test(w)));
});

test("unknown collections default to protected and read-only", async () => {
  const { adapter } = spyAdapter(snapshot());
  const r = await runInventory({ catalog, identity: publicIdentity(identity), adapter, now: FIXED_NOW });
  const u = r.collections.find((c) => c.collection === "legacy_imports");
  assert.equal(u.lifecycleClassName, "UNCLASSIFIED");
  assert.deepEqual(
    { p: u.protection.protected, r: u.protection.resetEligible, o: u.protection.requiresOwnerDecision, w: u.protection.writable },
    { p: true, r: false, o: true, w: false }
  );
  assert.deepEqual(unknownCollectionEntry("x").protection.protected, true);
});

test("classification output: classes A–F and protection flags; nothing is reset-eligible", () => {
  const by = catalog.byCollection;
  assert.equal(by.get("users").lifecycleClass, "A");
  assert.equal(by.get("teams").lifecycleClass, "B");
  assert.equal(by.get("solutions").lifecycleClass, "C");
  assert.equal(by.get("invoices").lifecycleClass, "D");
  assert.equal(by.get("audits").lifecycleClass, "D");
  assert.equal(by.get("files").lifecycleClass, "F");
  assert.equal(by.get("media").lifecycleClass, "F");
  assert.equal(by.get("users").protection.containsCredentials, true);
  assert.equal(by.get("invoices").protection.containsBusinessHistory, true);
  assert.equal(by.get("jobapplications").protection.containsFileReferences, true);
  for (const e of catalog.entries) {
    assert.equal(e.protection.protected, true, e.collection);
    assert.equal(e.protection.resetEligible, false, e.collection);
    assert.equal(e.protection.writable, false, e.collection);
  }
  assert.ok(catalog.entries.every((e) => e.lifecycleClass !== "E"), "no collection is test-only (class E is row-level)");
});

test("the real repository catalog loads from the existing inventory and classification", () => {
  const real = loadCatalog();
  assert.equal(real.entries.length, 45);
  assert.match(real.catalogVersion, /^[0-9a-f]{64}$/);
  assert.equal(real.byCollection.get("counters").lifecycleClass, "A");
  assert.equal(real.byCollection.get("productions").lifecycleClass, "C");
  assert.ok(real.entries.every((e) => e.protection.protected && !e.protection.resetEligible));
});

test("catalog drift is refused rather than guessed", () => {
  const cls = miniClassification();
  delete cls.Team;
  assert.throws(() => buildCatalog({ inventory: miniInventory(), classification: cls }), /does not cover exactly/);
  const inv = miniInventory();
  inv.models = inv.models.filter((m) => m.collection !== "files");
  const cls2 = miniClassification();
  delete cls2.File;
  assert.throws(() => buildCatalog({ inventory: inv, classification: cls2 }), /lifecycle metadata names a collection/);
});

test("inventory uses only read methods; mutation methods are never reached", async () => {
  const { adapter, calls } = spyAdapter(snapshot());
  await runInventory({ catalog, identity: publicIdentity(identity), adapter, now: FIXED_NOW });
  assert.ok(calls.length > 0);
  assert.ok(calls.every((c) => READ_METHODS.includes(c)), `unexpected calls: ${calls.filter((c) => !READ_METHODS.includes(c))}`);
  const facade = readOnlyAdapter(adapter);
  assert.deepEqual(Object.keys(facade).sort(), [...READ_METHODS].sort());
  assert.ok(Object.isFrozen(facade));
  for (const m of MUTATIONS) assert.equal(facade[m], undefined, m);
});

test("the report carries a sanitized identity only", async () => {
  const { adapter } = spyAdapter(snapshot());
  const r = await runInventory({ catalog, identity: publicIdentity(identity), adapter, now: FIXED_NOW });
  const text = JSON.stringify(r);
  assert.doesNotMatch(text, /fixture_user|fixture-pass-123|mongodb:\/\/|127\.0\.0\.1|expresso_lifecycle_fixture/);
  assert.equal(r.target.fingerprint, identity.fingerprint);
});

test("catalog-only inventory needs no target and observes nothing", async () => {
  const r = await runInventory({ catalog, now: FIXED_NOW });
  assert.equal(r.mode, "catalog-only");
  assert.equal(r.target, null);
  assert.ok(r.collections.every((c) => c.status === "not-observed"));
  await assert.rejects(() => runInventory({ catalog, adapter: snapshotAdapter(snapshot()), now: FIXED_NOW }), /resolved target identity/);
});

test("snapshots are validated: version, duplicates and secrets", () => {
  assert.throws(() => validateSnapshot({ ...snapshot(), schemaVersion: "x" }), (e) => e.exitCode === 5);
  const dup = snapshot();
  dup.collections.push({ name: "users", count: 1 });
  assert.throws(() => validateSnapshot(dup), /twice/);
  const secret = snapshot();
  secret.collections[0].options = { note: "mongodb://u:p@db/x" };
  assert.throws(() => validateSnapshot(secret), /secret-like/);
});
