// R5-D1 — versioned lifecycle manifest model and offline validation.
//
// R5-D1 does NOT create backups. This module only defines the metadata a
// future backup (R5-D2) must record and checks a manifest document offline:
// no MongoDB, S3, network or application startup. A VALID result means the
// document is well formed and internally consistent; it never means the
// backup it describes exists, is complete on disk, or restores.

import {
  isPlainObject, isSha256, isUtcTimestamp, isSafeRelativePath, findSecrets, duplicates, digestOf,
  GIT_COMMIT_RE, OPERATION_ID_RE, ALIAS_RE,
} from "./common.js";

export const MANIFEST_SCHEMA_VERSION = "expresso.lifecycle.manifest/1";
export const SUPPORTED_MANIFEST_VERSIONS = Object.freeze([MANIFEST_SCHEMA_VERSION]);

export const STATUS = Object.freeze({
  VALID: "VALID",
  INVALID: "INVALID",
  UNSUPPORTED_VERSION: "UNSUPPORTED_VERSION",
  INCOMPLETE: "INCOMPLETE",
});

export const MANIFEST_KINDS = Object.freeze(["backup"]);
export const COMPONENTS = Object.freeze(["database", "object-storage-public", "object-storage-private", "application-metadata"]);
export const COMPLETION_STATES = Object.freeze(["complete", "incomplete", "failed"]);
export const FAILURE_CATEGORIES = Object.freeze(["identity", "validation", "connectivity", "permission", "capacity", "integrity", "timeout", "interrupted", "tooling", "unknown"]);
const TOPOLOGIES = ["standalone", "replica-set", "sharded"];
// "quiescent-verified" (R5-D2): the database's per-collection dbHash was
// identical before and after capture, so no write changed it during the dump.
const CONSISTENCY = ["point-in-time-snapshot", "oplog-consistent", "quiescent-verified", "best-effort", "none"];
const PROFILE_CLASS_NAMES = ["local", "disposable", "shared-development", "staging", "production"];

const TOP_LEVEL = ["schemaVersion", "operationId", "kind", "source", "time", "application", "database", "objectStorage", "artifacts", "completion", "seal"];
// Optional (R5-D2): what the producing run established. restoreVerified can
// never be true in this schema version: only a successful restore check (R5-D3)
// may establish recoverability.
const OPTIONAL_TOP_LEVEL = ["status"];
const STATUS_KEYS = ["backupCreated", "artifactChecksumsValid", "restoreVerified"];

/** The digest a manifest is sealed with: everything except `seal`. */
export function computeSeal(manifest) {
  const { seal, ...body } = manifest;
  return digestOf(body);
}

/** Return a copy of `manifest` with a correct seal (for tooling and tests). */
export function sealManifest(manifest) {
  const { seal, ...body } = manifest;
  return { ...body, seal: { algorithm: "sha256", digest: digestOf(body) } };
}

// Index key objects name fields, not values; they are excluded from the
// secret-name scan (e.g. an index on "tokenHash" is not a secret).
function withoutIndexKeys(manifest) {
  const copy = structuredClone(manifest);
  for (const c of copy?.database?.collections ?? []) for (const ix of c?.indexes ?? []) if (ix && typeof ix === "object") delete ix.key;
  return copy;
}

/**
 * Validate a parsed manifest. Returns
 * { status, errors[], warnings[], verified: false, digest? }.
 * Errors name JSON paths and rules; they never echo values.
 */
export function validateManifest(manifest) {
  const errors = [];
  const warnings = [];
  const err = (p, rule) => errors.push({ path: p, rule });
  const result = (status, extra = {}) => ({ status, errors, warnings, verified: false, ...extra });

  if (!isPlainObject(manifest)) {
    err("", "manifest must be a JSON object");
    return result(STATUS.INVALID);
  }
  if (typeof manifest.schemaVersion !== "string") {
    err("schemaVersion", "required");
    return result(STATUS.INVALID);
  }
  if (!SUPPORTED_MANIFEST_VERSIONS.includes(manifest.schemaVersion)) {
    err("schemaVersion", "unsupported manifest schema version");
    return result(STATUS.UNSUPPORTED_VERSION);
  }

  for (const k of Object.keys(manifest)) if (!TOP_LEVEL.includes(k) && !OPTIONAL_TOP_LEVEL.includes(k)) err(k, "unknown field");
  if ("status" in manifest) {
    const st = manifest.status;
    if (!isPlainObject(st) || Object.keys(st).some((k) => !STATUS_KEYS.includes(k)) || STATUS_KEYS.some((k) => typeof st[k] !== "boolean")) err("status", "must be { backupCreated, artifactChecksumsValid, restoreVerified } booleans");
    else if (st.restoreVerified !== false) err("status.restoreVerified", "cannot be true: restore verification is not established by this schema version (R5-D3)");
  }
  for (const k of TOP_LEVEL) if (!(k in manifest)) err(k, "required");

  for (const f of findSecrets(withoutIndexKeys(manifest), { allowKeys: ["keyRef"] })) err(f.path, `prohibited secret-like content (${f.reason})`);

  // IDENTITY
  if (!OPERATION_ID_RE.test(String(manifest.operationId ?? ""))) err("operationId", "must be an identifier of 8–128 safe characters");
  if (!MANIFEST_KINDS.includes(manifest.kind)) err("kind", "unsupported manifest kind");
  const src = manifest.source;
  if (!isPlainObject(src)) err("source", "must be an object");
  else {
    if (!ALIAS_RE.test(String(src.profileAlias ?? ""))) err("source.profileAlias", "invalid profile alias");
    if (!PROFILE_CLASS_NAMES.includes(src.profileClass)) err("source.profileClass", "unknown profile class");
    if (!isSha256(src.fingerprint)) err("source.fingerprint", "must be a lowercase sha256 hex digest");
  }

  // TIME
  const t = manifest.time;
  if (!isPlainObject(t)) err("time", "must be an object");
  else {
    if (!isUtcTimestamp(t.startedAt)) err("time.startedAt", "must be a UTC ISO-8601 timestamp");
    if (t.completedAt !== null && !isUtcTimestamp(t.completedAt)) err("time.completedAt", "must be a UTC ISO-8601 timestamp or null");
    if (isUtcTimestamp(t.startedAt) && isUtcTimestamp(t.completedAt) && Date.parse(t.completedAt) < Date.parse(t.startedAt)) err("time.completedAt", "is before time.startedAt");
    if (!isPlainObject(t.consistency) || !CONSISTENCY.includes(t.consistency.method)) err("time.consistency.method", "unknown consistency method");
    else if (t.consistency.clusterTime !== undefined && t.consistency.clusterTime !== null && typeof t.consistency.clusterTime !== "string") err("time.consistency.clusterTime", "must be a string or null");
  }

  // APPLICATION
  const app = manifest.application;
  if (!isPlainObject(app)) err("application", "must be an object");
  else {
    if (!GIT_COMMIT_RE.test(String(app.gitCommit ?? ""))) err("application.gitCommit", "must be a full 40-character commit id");
    if (typeof app.dirty !== "boolean") err("application.dirty", "must be a boolean");
    if (!isSha256(app.catalogVersion)) err("application.catalogVersion", "must be a sha256 hex digest");
    if (typeof app.toolVersion !== "string" || !app.toolVersion) err("application.toolVersion", "required");
    if (!Array.isArray(app.lockfiles)) err("application.lockfiles", "must be an array");
    else {
      app.lockfiles.forEach((l, i) => {
        if (!isPlainObject(l) || !isSafeRelativePath(l.path)) err(`application.lockfiles[${i}].path`, "must be a safe relative path");
        if (!isSha256(l?.sha256)) err(`application.lockfiles[${i}].sha256`, "must be a sha256 hex digest");
      });
      if (duplicates(app.lockfiles.map((l) => l?.path)).length) err("application.lockfiles", "duplicate path");
    }
    if (app.dirty === true) warnings.push({ path: "application.dirty", rule: "captured from a working tree with uncommitted changes" });
  }

  // DATABASE
  const db = manifest.database;
  if (!isPlainObject(db)) err("database", "must be an object");
  else {
    if (typeof db.name !== "string" || !/^[A-Za-z0-9_-]{1,63}$/.test(db.name)) err("database.name", "invalid database name");
    if (!TOPOLOGIES.includes(db.topology)) err("database.topology", "unknown topology");
    if (typeof db.serverVersion !== "string" || !/^\d+\.\d+(\.\d+)?/.test(db.serverVersion)) err("database.serverVersion", "must be a server version string");
    if (!Array.isArray(db.collections)) err("database.collections", "must be an array");
    else {
      db.collections.forEach((c, i) => {
        const at = `database.collections[${i}]`;
        if (!isPlainObject(c)) return err(at, "must be an object");
        if (typeof c.name !== "string" || !/^[A-Za-z0-9_.-]{1,120}$/.test(c.name)) err(`${at}.name`, "invalid collection name");
        if (!isPlainObject(c.options)) err(`${at}.options`, "must be an object");
        if (!Number.isInteger(c.count) || c.count < 0) err(`${at}.count`, "must be a non-negative integer");
        if (c.fingerprint !== undefined && c.fingerprint !== null && !isSha256(c.fingerprint)) err(`${at}.fingerprint`, "must be a sha256 hex digest");
        if (!Array.isArray(c.indexes)) err(`${at}.indexes`, "must be an array");
        else {
          c.indexes.forEach((ix, j) => {
            if (!isPlainObject(ix) || typeof ix.name !== "string" || !ix.name) err(`${at}.indexes[${j}].name`, "required");
            if (!isPlainObject(ix?.key) || Object.keys(ix.key).length === 0) err(`${at}.indexes[${j}].key`, "must be a non-empty object");
          });
          if (duplicates(c.indexes.map((ix) => ix?.name)).length) err(`${at}.indexes`, "duplicate index name");
        }
      });
      if (duplicates(db.collections.map((c) => c?.name)).length) err("database.collections", "duplicate collection name");
    }
  }

  // OBJECT STORAGE
  const os = manifest.objectStorage;
  if (!isPlainObject(os) || !Array.isArray(os.stores)) err("objectStorage.stores", "must be an array");
  else {
    os.stores.forEach((s, i) => {
      const at = `objectStorage.stores[${i}]`;
      if (!isPlainObject(s)) return err(at, "must be an object");
      if (!["public", "private"].includes(s.store)) err(`${at}.store`, "must be public or private");
      if (!["s3", "local"].includes(s.provider)) err(`${at}.provider`, "must be s3 or local");
      if (typeof s.namespace !== "string" || !/^[A-Za-z0-9._/-]{1,200}$/.test(s.namespace)) err(`${at}.namespace`, "invalid namespace");
      if (!Array.isArray(s.objects)) err(`${at}.objects`, "must be an array");
      else {
        s.objects.forEach((o, j) => {
          const oat = `${at}.objects[${j}]`;
          if (!isPlainObject(o) || !isSafeRelativePath(o.key)) err(`${oat}.key`, "must be a relative object key without traversal");
          if (!Number.isInteger(o?.bytes) || o.bytes < 0) err(`${oat}.bytes`, "must be a non-negative integer");
          if (o?.sha256 !== undefined && o.sha256 !== null && !isSha256(o.sha256)) err(`${oat}.sha256`, "must be a sha256 hex digest");
          if (o?.versionId !== undefined && o.versionId !== null && (typeof o.versionId !== "string" || !o.versionId)) err(`${oat}.versionId`, "must be a non-empty string or null");
        });
        if (duplicates(s.objects.map((o) => o?.key)).length) err(`${at}.objects`, "duplicate object key");
      }
    });
    if (duplicates(os.stores.map((s) => s?.store)).length) err("objectStorage.stores", "duplicate store");
  }

  // ARTIFACTS
  const arts = manifest.artifacts;
  if (!Array.isArray(arts)) err("artifacts", "must be an array");
  else {
    arts.forEach((a, i) => {
      const at = `artifacts[${i}]`;
      if (!isPlainObject(a)) return err(at, "must be an object");
      if (!isSafeRelativePath(a.path)) err(`${at}.path`, "must be a relative path inside the backup (no traversal)");
      if (!Number.isInteger(a.bytes) || a.bytes < 0) err(`${at}.bytes`, "must be a non-negative integer");
      if (!isSha256(a.sha256)) err(`${at}.sha256`, "must be a sha256 hex digest");
      if (!COMPONENTS.includes(a.component)) err(`${at}.component`, "unknown component");
      if (a.encryption !== null) {
        if (!isPlainObject(a.encryption) || typeof a.encryption.scheme !== "string" || typeof a.encryption.keyRef !== "string" || !/^[A-Za-z0-9._:/-]{1,200}$/.test(a.encryption.keyRef)) {
          err(`${at}.encryption`, "must be null or { scheme, keyRef } (a key reference, never key material)");
        }
      }
    });
    if (duplicates(arts.map((a) => a?.path)).length) err("artifacts", "duplicate artifact path");
  }

  // COMPLETION
  const c = manifest.completion;
  let incomplete = false;
  if (!isPlainObject(c)) err("completion", "must be an object");
  else {
    const list = (k) => (Array.isArray(c[k]) ? c[k] : (err(`completion.${k}`, "must be an array"), []));
    const required = list("requiredComponents");
    const completed = list("completedComponents");
    const exclusions = list("exclusions");
    const failures = list("failures");
    for (const [k, arr] of [["requiredComponents", required], ["completedComponents", completed]]) {
      if (arr.some((x) => !COMPONENTS.includes(x))) err(`completion.${k}`, "unknown component");
      if (duplicates(arr).length) err(`completion.${k}`, "duplicate component");
    }
    if (required.length === 0) err("completion.requiredComponents", "must name at least one component");
    exclusions.forEach((e, i) => {
      if (!isPlainObject(e) || !COMPONENTS.includes(e.component)) err(`completion.exclusions[${i}].component`, "unknown component");
      if (typeof e?.reason !== "string" || !e.reason.trim()) err(`completion.exclusions[${i}].reason`, "required");
    });
    failures.forEach((f, i) => {
      if (!isPlainObject(f) || !COMPONENTS.includes(f.component)) err(`completion.failures[${i}].component`, "unknown component");
      if (!FAILURE_CATEGORIES.includes(f?.category)) err(`completion.failures[${i}].category`, "unknown failure category");
    });
    if (typeof c.captureMethod !== "string" || !/^[a-z0-9][a-z0-9.+_-]{1,63}$/.test(c.captureMethod)) err("completion.captureMethod", "required");
    if (!COMPLETION_STATES.includes(c.state)) err("completion.state", "unknown completion state");

    const excluded = exclusions.map((e) => e?.component);
    const failed = failures.map((f) => f?.component);
    // Impossible states.
    if (completed.some((x) => !required.includes(x))) err("completion.completedComponents", "lists a component that is not required");
    if (excluded.some((x) => !required.includes(x))) err("completion.exclusions", "excludes a component that is not required");
    if (completed.some((x) => excluded.includes(x))) err("completion", "a component is both completed and excluded");
    if (completed.some((x) => failed.includes(x))) err("completion", "a component is both completed and failed");
    const artComponents = Array.isArray(arts) ? arts.map((a) => a?.component) : [];
    if (completed.some((x) => x !== "application-metadata" && !artComponents.includes(x))) err("completion.completedComponents", "a completed component has no artifact");
    const allDone = required.every((x) => completed.includes(x) || excluded.includes(x));
    if (c.state === "complete") {
      if (!allDone) err("completion.state", "complete, but required components are missing");
      if (failures.length) err("completion.state", "complete, but failures are recorded");
      if (t && t.completedAt === null) err("time.completedAt", "complete, but no completion time");
    }
    if (c.state === "failed" && failures.length === 0) err("completion.state", "failed, but no failure is recorded");
    if (c.state !== "complete") incomplete = true;
    if (excluded.length) warnings.push({ path: "completion.exclusions", rule: "some required components were deliberately excluded" });
  }

  // SEAL
  const seal = manifest.seal;
  let digest;
  if (!isPlainObject(seal) || seal.algorithm !== "sha256" || !isSha256(seal.digest)) err("seal", "must be { algorithm: \"sha256\", digest }");
  else {
    digest = computeSeal(manifest);
    if (seal.digest !== digest) err("seal.digest", "does not match the manifest contents (altered or unsealed)");
  }

  if (errors.length) return result(STATUS.INVALID);
  if (incomplete) return result(STATUS.INCOMPLETE, { digest });
  return result(STATUS.VALID, { digest });
}
