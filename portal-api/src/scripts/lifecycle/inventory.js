// R5-D1 — read-only database inventory.
//
// Compares what the repository knows (the lifecycle catalog) with what a
// target is observed to contain, through a READ-ONLY adapter:
//   listCollections() → [{ name, type, options }]
//   countDocuments(name) → integer
//   listIndexes(name) → [{ name, key, ... }]
//   serverInfo() → { version, topology }
// The inventory calls nothing else. `readOnlyAdapter` wraps any adapter in
// a frozen facade that exposes only those four functions, so a mutation
// method on the underlying object can never be reached from here.
//
// R5-D1 ships one adapter: a captured snapshot file (`snapshotAdapter`).
// It does not connect to MongoDB. A live read-only adapter is later work.

import { LifecycleError, EXIT, isPlainObject, isSha256, isUtcTimestamp, findSecrets, duplicates } from "./common.js";
import { unknownCollectionEntry } from "./catalog.js";

export const REPORT_VERSION = "expresso.lifecycle.inventory/1";
export const SNAPSHOT_SCHEMA_VERSION = "expresso.lifecycle.observed/1";
export const READ_METHODS = Object.freeze(["listCollections", "countDocuments", "listIndexes", "serverInfo"]);

/** Expose only the read methods of `adapter`, bound and frozen. */
export function readOnlyAdapter(adapter) {
  if (!adapter || typeof adapter !== "object") throw new LifecycleError("NO_ADAPTER", "no inventory adapter was supplied");
  const facade = {};
  for (const m of READ_METHODS) {
    if (typeof adapter[m] !== "function") throw new LifecycleError("NO_ADAPTER", `inventory adapter lacks ${m}()`);
    facade[m] = (...args) => adapter[m](...args);
  }
  return Object.freeze(facade);
}

/** Validate a captured snapshot document (offline, no secrets). */
export function validateSnapshot(doc) {
  const bad = (msg, code = EXIT.VALIDATION_FAILURE) => {
    throw new LifecycleError("INVALID_SNAPSHOT", msg, code);
  };
  if (!isPlainObject(doc)) bad("observed snapshot must be a JSON object");
  if (doc.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) bad("observed snapshot has an unsupported schema version", EXIT.UNSUPPORTED_VERSION);
  if (!isSha256(doc.targetFingerprint)) bad("observed snapshot has no target fingerprint");
  if (!isUtcTimestamp(doc.capturedAt)) bad("observed snapshot capturedAt must be a UTC timestamp");
  if (!isPlainObject(doc.server) || typeof doc.server.version !== "string" || typeof doc.server.topology !== "string") bad("observed snapshot server info is missing");
  if (!Array.isArray(doc.collections)) bad("observed snapshot has no collections list");
  doc.collections.forEach((c) => {
    if (!isPlainObject(c) || typeof c.name !== "string" || !c.name) bad("observed snapshot has a collection without a name");
    if (!Number.isInteger(c.count) || c.count < 0) bad("observed snapshot has an invalid count");
    if (c.options !== undefined && !isPlainObject(c.options)) bad("observed snapshot has invalid collection options");
    if (c.indexes !== undefined && !Array.isArray(c.indexes)) bad("observed snapshot has invalid indexes");
  });
  if (duplicates(doc.collections.map((c) => c.name)).length) bad("observed snapshot lists a collection twice");
  const scan = structuredClone(doc);
  for (const c of scan.collections) for (const ix of c.indexes ?? []) if (isPlainObject(ix)) delete ix.key;
  if (findSecrets(scan).length) bad("observed snapshot contains secret-like content");
  return doc;
}

/** An adapter over a validated snapshot. Read methods only. */
export function snapshotAdapter(doc) {
  const snap = validateSnapshot(doc);
  const byName = new Map(snap.collections.map((c) => [c.name, c]));
  return {
    targetFingerprint: snap.targetFingerprint,
    capturedAt: snap.capturedAt,
    listCollections: async () => snap.collections.map((c) => ({ name: c.name, type: c.type ?? "collection", options: c.options ?? {} })),
    countDocuments: async (name) => byName.get(name)?.count ?? 0,
    listIndexes: async (name) => (byName.get(name)?.indexes ?? []).map((ix) => ({ name: ix.name, key: ix.key, unique: ix.unique === true })),
    serverInfo: async () => ({ version: snap.server.version, topology: snap.server.topology }),
  };
}

const summariseIndexes = (list) => list.map((ix) => ({ name: ix.name, key: ix.key, unique: ix.unique === true })).sort((a, b) => a.name.localeCompare(b.name));

/**
 * Build the inventory report. `adapter` may be null for a catalog-only
 * report (nothing observed). Never writes anything anywhere.
 */
export async function runInventory({ catalog, identity = null, adapter = null, application = null, now }) {
  if (!catalog) throw new LifecycleError("NO_CATALOG", "no catalog");
  const generatedAt = (now ? now() : new Date()).toISOString();
  const warnings = [];
  const rows = [];

  let observed = null;
  let server = null;
  if (adapter) {
    if (!identity) throw new LifecycleError("MISSING_TARGET", "an observed inventory needs a resolved target identity");
    const ro = readOnlyAdapter(adapter);
    server = await ro.serverInfo();
    const list = await ro.listCollections();
    observed = new Map();
    for (const c of list) {
      observed.set(c.name, {
        type: c.type ?? "collection",
        options: c.options ?? {},
        count: await ro.countDocuments(c.name),
        indexes: summariseIndexes(await ro.listIndexes(c.name)),
      });
    }
  }

  for (const e of catalog.entries) {
    const o = observed?.get(e.collection);
    rows.push({
      ...e,
      status: observed ? (o ? "present" : "known-absent") : "not-observed",
      count: o ? o.count : null,
      indexes: o ? o.indexes : null,
      options: o ? o.options : null,
    });
  }
  const unknown = observed ? [...observed.keys()].filter((n) => !catalog.byCollection.has(n)).sort() : [];
  for (const name of unknown) {
    const o = observed.get(name);
    rows.push({ ...unknownCollectionEntry(name), status: "unknown", type: o.type, count: o.count, indexes: o.indexes, options: o.options });
  }

  if (unknown.length) warnings.push(`${unknown.length} collection(s) are not known to the repository; they are treated as protected and read-only`);
  if (application?.dirty) warnings.push("the application working tree has uncommitted changes");
  if (application && !application.gitCommit) warnings.push("the application commit could not be determined");

  const summary = {
    known: catalog.entries.length,
    present: rows.filter((r) => r.status === "present").length,
    knownAbsent: rows.filter((r) => r.status === "known-absent").length,
    unknown: unknown.length,
    notObserved: rows.filter((r) => r.status === "not-observed").length,
  };

  return {
    reportVersion: REPORT_VERSION,
    mode: observed ? "observed-snapshot" : "catalog-only",
    readOnly: true,
    generatedAt,
    target: identity,
    observation: adapter ? { source: "snapshot", capturedAt: adapter.capturedAt ?? null, server } : null,
    application,
    catalogVersion: catalog.catalogVersion,
    summary,
    collections: rows,
    evidence: { backup: null, verification: null, note: "R5-D1 has no backup or verification evidence to report" },
    warnings,
  };
}
