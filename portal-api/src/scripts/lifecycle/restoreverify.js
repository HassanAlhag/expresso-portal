#!/usr/bin/env node
// R5-D3 — restore VERIFICATION of one R5-D2 backup artifact.
//
//   LIFECYCLE_TARGET_URI='<verification target uri>' node src/scripts/lifecycle/restoreverify.js \
//     --artifact <abs D2 artifact dir> --profiles <abs-file> --profile <alias> \
//     --output <abs-dir> --evidence-dir <abs-dir> --operator <id> \
//     [--verification-id <id>] [--mongorestore <abs-path>]
//
// Proves BACKUP ARTIFACT -> RESTORE -> VERIFIED DATABASE for one artifact, on a
// local/disposable target only. It is not an operator restore facility:
//  - the only write is mongorestore into a NEW, EMPTY verification database
//    whose name differs from the backup's source database; the archive's
//    source namespace is remapped explicitly (--nsInclude/--nsFrom/--nsTo of
//    that one database). There is no --drop, no clearing, no overwrite and no
//    way to restore under the original database name;
//  - the artifact is checked completely (paths, files, manifest, seal, status,
//    size, SHA-256) before any database connection, and again after restore;
//  - the source database is never contacted: the D2 manifest is enough;
//  - the target must pass D1's declared-profile / observed-identity match,
//    list "restore-verify" explicitly (never implied by "backup"), be a
//    loopback replica set whose live identity matches the profile, and be
//    provably not the server the backup came from;
//  - the URI comes only from LIFECYCLE_TARGET_URI and reaches mongorestore
//    only through the private FIFO given to --config (secretpipe.js);
//  - the D2 artifact is never modified; the result is a separate sealed
//    restore-verification.json, written only when every comparison passes.
//    Any failure leaves a NOT-VERIFIED.json marker instead and the
//    verification database as it is (never dropped by this command).
// There is no drop, delete, clean-up, reset, seed, repair or migrate path.

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { EXIT, LifecycleError, isPlainObject, digestOf, sha256Hex, findSecrets, isSha256, isUtcTimestamp, OPERATION_ID_RE } from "./common.js";
import { validateProfiles, resolveTarget, authorizeOperation, targetFingerprint, publicIdentity } from "./target.js";
import { appendEvidence, verifyEvidence, evidencePath, DEFAULT_EVIDENCE_FILE } from "./evidence.js";
import { validateManifest, STATUS } from "./manifest.js";
import { TARGET_URI_ENV } from "./cli.js";
import { openReadOnlyTarget } from "./mongoread.js";
import { withSecretPipe } from "./secretpipe.js";
import {
  verifyBackupArtifact, checkLiveIdentity, checkOutputRoot, childEnvironment, captureState, fileDigest, locateTool, toolVersionOf,
  dumpFailureCategory, writeExclusive, ARCHIVE_NAME, MANIFEST_NAME, INCOMPLETE_NAME, EXIT_INTERRUPTED,
} from "./backup.js";

export const TOOL_VERSION = "r5-d3.1";
export const OPERATION = "restore-verify";
export const VERIFICATION_NAME = "restore-verification.json";
export const NOT_VERIFIED_NAME = "NOT-VERIFIED.json";
export const VERIFICATION_SCHEMA_VERSION = "expresso.lifecycle.restore-verification/1";
const TOOL = "mongorestore";
const D2_CAPTURE_METHOD = "mongodump-archive-gzip";
const MAX_MANIFEST_BYTES = 8 * 1024 * 1024;
// Same rule as D1 database names; it also guarantees the names contain no
// namespace-pattern characters (* $ \ .), so the mapping below is exact.
const DB_NAME_RE = /^[A-Za-z0-9_-]{1,63}$/;
const MAX_SUBSET_HOSTS = 7;
const FLAGS = ["--artifact", "--profiles", "--profile", "--output", "--evidence-dir", "--operator", "--verification-id", "--mongorestore"];
const REQUIRED = ["--artifact", "--profiles", "--profile", "--output", "--evidence-dir", "--operator"];

const fail = (code, message, exitCode = EXIT.INVALID_ARGS_OR_IDENTITY, category = "validation") => {
  const e = new LifecycleError(code, message, exitCode);
  e.category = category;
  return e;
};
const integrity = (code, message) => fail(code, message, EXIT.VALIDATION_FAILURE, "integrity");
const identityRefusal = (code, message) => fail(code, message, EXIT.INVALID_ARGS_OR_IDENTITY, "identity");

/* ----------------------------------------------------------------- args */
export function parseRestoreVerifyArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!FLAGS.includes(flag)) throw fail("INVALID_ARGS", "unknown or unsupported option (R5-D3 verifies one backup artifact; there is no override flag)");
    if (Object.hasOwn(opts, flag)) throw fail("INVALID_ARGS", "an option was given twice");
    const value = argv[++i];
    if (value === undefined || value.startsWith("--")) throw fail("INVALID_ARGS", "an option is missing its value");
    opts[flag] = value;
  }
  for (const f of REQUIRED) if (!opts[f]) throw fail(f === "--profiles" || f === "--profile" ? "MISSING_PROFILE" : "INVALID_ARGS", `missing required option ${f}`);
  if (opts["--verification-id"] !== undefined && !OPERATION_ID_RE.test(opts["--verification-id"])) throw fail("INVALID_ARGS", "verification id must be 8–128 safe characters");
  if (!/^[A-Za-z0-9._@-]{1,64}$/.test(opts["--operator"])) throw fail("INVALID_ARGS", "operator identifier is invalid");
  return opts;
}

function readJsonFile(file, label) {
  if (!path.isAbsolute(file)) throw fail("INVALID_ARGS", `${label} path must be absolute`);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw fail("INVALID_ARGS", `the ${label} file could not be read as JSON`);
  }
}

const inside = (child, parent) => child === parent || child.startsWith(parent + path.sep);

/* ----------------------------------------------------------------- artifact preflight */
/**
 * Check ONE explicitly named D2 artifact directory completely, offline and
 * read-only. Returns the manifest and the sanitized source identity it
 * records. Throws before any database connection on any problem.
 */
export function preflightArtifact(dir) {
  if (typeof dir !== "string" || !path.isAbsolute(dir)) throw fail("UNSAFE_ARTIFACT", "--artifact must be an explicit absolute path");
  if (path.normalize(dir) !== dir || (dir.length > 1 && dir.endsWith(path.sep))) throw fail("UNSAFE_ARTIFACT", "--artifact must be a canonical path (no '.', '..', duplicate or trailing separators)");
  let st;
  try {
    st = lstatSync(dir);
  } catch {
    throw fail("ARTIFACT_NOT_FOUND", "the artifact directory does not exist");
  }
  if (st.isSymbolicLink()) throw fail("UNSAFE_ARTIFACT", "the artifact directory must not be a symbolic link");
  if (!st.isDirectory()) throw fail("UNSAFE_ARTIFACT", "the artifact path is not a directory");
  if (realpathSync(dir) !== dir) throw fail("UNSAFE_ARTIFACT", "the artifact directory must not be reached through symbolic links");

  const entries = readdirSync(dir).sort();
  if (entries.includes(INCOMPLETE_NAME)) throw integrity("ARTIFACT_INCOMPLETE", "the artifact carries an INCOMPLETE marker; it is not a valid backup");
  for (const name of entries) {
    if (!lstatSync(path.join(dir, name)).isFile()) throw integrity("UNSAFE_ARTIFACT", "the artifact directory may hold regular files only (no links, directories or special files)");
  }
  if (!entries.includes(MANIFEST_NAME)) throw integrity("MISSING_MANIFEST", "the artifact has no manifest");
  const manifestPath = path.join(dir, MANIFEST_NAME);
  if (lstatSync(manifestPath).size > MAX_MANIFEST_BYTES) throw integrity("MANIFEST_NOT_VALID", "the manifest is implausibly large");
  const manifestBytes = readFileSync(manifestPath);
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString("utf8"));
  } catch {
    throw integrity("MANIFEST_NOT_VALID", "the manifest is not readable JSON");
  }
  const v = validateManifest(manifest);
  if (v.status !== STATUS.VALID) throw integrity("MANIFEST_NOT_VALID", `the manifest does not validate (${v.status}); a modified or unsealed manifest is never trusted`);
  if (manifest.kind !== "backup") throw integrity("NOT_A_D2_BACKUP", "the manifest does not describe a backup");
  const s = manifest.status;
  if (!isPlainObject(s) || s.backupCreated !== true || s.artifactChecksumsValid !== true || s.restoreVerified !== false) {
    throw integrity("STATUS_NOT_VERIFIABLE", "the manifest status must be backupCreated true, artifactChecksumsValid true and restoreVerified false");
  }
  if (manifest.completion?.state !== "complete" || manifest.completion?.captureMethod !== D2_CAPTURE_METHOD) throw integrity("NOT_A_D2_BACKUP", "the manifest does not describe a complete R5-D2 mongodump archive");
  const arts = manifest.artifacts;
  if (!Array.isArray(arts) || arts.length !== 1 || arts[0].path !== ARCHIVE_NAME || arts[0].component !== "database") throw integrity("NOT_A_D2_BACKUP", "the manifest must list exactly one database archive");
  const consistency = manifest.time?.consistency;
  if (consistency?.method !== "quiescent-verified" || !isSha256(consistency?.databaseHashSha256)) throw integrity("NOT_A_D2_BACKUP", "the manifest does not record a quiescent-verified database hash");

  const check = verifyBackupArtifact(dir);
  if (!check.ok) {
    const codes = [...new Set(check.problems.map((p) => p.code))].sort();
    throw integrity("ARTIFACT_CHECK_FAILED", `the artifact does not match its manifest (${codes.join(", ")})`);
  }

  // Sanitized source identity, from the manifest only (the source is never contacted).
  const src = manifest.source;
  const db = manifest.database;
  const names = Array.isArray(db?.collections) ? db.collections.map((c) => c?.name) : [];
  if (!isSha256(src?.fingerprint) || typeof db?.name !== "string" || !DB_NAME_RE.test(db.name) || !["replica-set", "standalone"].includes(db?.topology) || names.length === 0 || new Set(names).size !== names.length || names.some((n) => typeof n !== "string" || !n)) {
    throw identityRefusal("INSUFFICIENT_SOURCE_IDENTITY", "the manifest does not record enough source identity to prove the verification target is different");
  }
  if (!["local", "disposable"].includes(src.profileClass)) throw identityRefusal("UNSUPPORTED_SOURCE", "only backups of local or disposable sources are verified by R5-D3");
  return {
    manifest,
    manifestFileSha256: sha256Hex(manifestBytes),
    sealDigest: manifest.seal.digest,
    archive: { path: ARCHIVE_NAME, bytes: arts[0].bytes, sha256: arts[0].sha256 },
    archivePath: path.join(dir, ARCHIVE_NAME),
    source: { fingerprint: src.fingerprint, profileClass: src.profileClass, database: db.name, topology: db.topology },
  };
}

/** The artifact must be byte-for-byte what preflight saw (re-checked after restore). */
export function artifactUnchanged(dir, pre) {
  try {
    const now = sha256Hex(readFileSync(path.join(dir, MANIFEST_NAME)));
    const archive = fileDigest(pre.archivePath);
    return now === pre.manifestFileSha256 && archive.sha256 === pre.archive.sha256 && archive.bytes === pre.archive.bytes && verifyBackupArtifact(dir).ok;
  } catch {
    return false;
  }
}

/* ----------------------------------------------------------------- source != target */
function hostSubsets(hosts) {
  const h = [...new Set(hosts.map((x) => String(x).toLowerCase()))].sort();
  if (h.length === 0 || h.length > MAX_SUBSET_HOSTS) return null;
  const out = [];
  for (let m = 1; m < 1 << h.length; m++) out.push(h.filter((_, i) => m & (1 << i)));
  return out;
}
/** Would any (hosts, replicaSet) combination identify the source server? */
function matchesSourceServer(source, scheme, subsets, setNames) {
  for (const hosts of subsets) {
    for (const replicaSet of setNames) {
      if (targetFingerprint({ scheme, hosts, database: source.database, replicaSet }) === source.fingerprint) return true;
    }
  }
  return false;
}

/**
 * Before connecting: prove from the declared profile that the verification
 * target is neither the source database nor the source server. The D2
 * fingerprint covers scheme, hosts, database and replica set, so the target's
 * declared server is re-fingerprinted with the SOURCE database name, for every
 * subset of its hosts, with and without its replica-set name.
 */
export function proveDistinctDeclared({ source, identity, profile }) {
  const target = identity.restricted.database;
  if (target === source.database) throw identityRefusal("SAME_DATABASE", "the verification database has the backup's source database name; a restore is never made under that name");
  if (identity.fingerprint === source.fingerprint) throw identityRefusal("SAME_TARGET", "the verification target has the backup source's fingerprint");
  if (!profile.connection.replicaSet) throw identityRefusal("SOURCE_TARGET_AMBIGUOUS", "a standalone verification target cannot be proven distinct from the backup source; use a dedicated disposable replica set");
  const subsets = hostSubsets(profile.connection.hosts);
  if (!subsets) throw identityRefusal("SOURCE_TARGET_AMBIGUOUS", "the verification target declares too many hosts to prove it is not the backup source");
  if (matchesSourceServer(source, profile.connection.scheme, subsets, [profile.connection.replicaSet, null])) {
    throw identityRefusal("SAME_SOURCE_SERVER", "the verification target is the server the backup was taken from; use a separate disposable server");
  }
  return { databaseNameDiffers: true, fingerprintDiffers: true, declaredServerDiffers: true, declaredHostSetsChecked: subsets.length };
}

/**
 * After connecting (read-only): repeat the server check with the members and
 * replica-set name the live server reports. R5-D2 accepts a replica-set
 * source only under these canonical member names, so a backup of this same
 * replica set would match here even if the profile spelled hosts differently.
 */
export function proveDistinctLive({ source, hello, scheme = "mongodb" }) {
  const members = [...(hello?.hosts || []), ...(hello?.passives || []), ...(hello?.arbiters || [])];
  const subsets = hostSubsets(members);
  if (!subsets || typeof hello?.setName !== "string") throw identityRefusal("SOURCE_TARGET_AMBIGUOUS", "the live target did not report a member list that can be compared with the backup source");
  if (matchesSourceServer(source, scheme, subsets, [hello.setName, null])) {
    throw identityRefusal("SAME_SOURCE_SERVER", "the live verification target reports itself as the server the backup was taken from");
  }
  return { liveServerDiffers: true, liveMemberSetsChecked: subsets.length };
}

/* ----------------------------------------------------------------- mongorestore */
/**
 * The connection string mongorestore receives: the D1-verified target URI
 * with its database path removed and, unless the URI already names one,
 * authSource set to that database (the driver's own default). The database is
 * then named only by --nsTo, so there is a single, explicit destination.
 */
export function restoreConnectionString(uri, database) {
  const m = String(uri).match(/^(mongodb:\/\/[^/?#]+)\/([^?#]*)(\?[^#]*)?$/);
  let named = null;
  try {
    named = m ? decodeURIComponent(m[2]) : null;
  } catch {
    named = null;
  }
  if (!m || named !== database || !DB_NAME_RE.test(database)) throw fail("MALFORMED_TARGET", "the verification target connection string could not be prepared for restore");
  const params = (m[3] || "").replace(/^\?/, "").split("&").filter(Boolean);
  if (!params.some((p) => /^authsource=/i.test(p))) params.push(`authSource=${database}`);
  return `${m[1]}/?${params.join("&")}`;
}

/** Exact single-database namespace mapping: <source>.* -> <verification>.* and nothing else. */
export function namespaceArgs(sourceDb, targetDb) {
  if (!DB_NAME_RE.test(String(sourceDb)) || !DB_NAME_RE.test(String(targetDb))) throw fail("INVALID_NAMESPACE", "database names must be plain names before they are used in a namespace mapping");
  if (sourceDb === targetDb) throw identityRefusal("SAME_DATABASE", "a restore is never made under the source database name");
  return [`--nsInclude=${sourceDb}.*`, `--nsFrom=${sourceDb}.*`, `--nsTo=${targetDb}.*`];
}

/** The complete mongorestore argument list. No --drop, no URI, no credentials. */
export function mongorestoreArgs({ configPath, archivePath, sourceDb, targetDb }) {
  return [`--config=${configPath}`, `--archive=${archivePath}`, "--gzip", ...namespaceArgs(sourceDb, targetDb), "--stopOnError", "--quiet"];
}

/** Run mongorestore with an argument array (no shell); the URI goes only through the FIFO. */
export function runMongorestore({ binary, uri, archivePath, sourceDb, targetDb, signal }) {
  return withSecretPipe(`uri: ${JSON.stringify(uri)}\n`, (configPath) => new Promise((resolve) => {
    const child = spawn(binary, mongorestoreArgs({ configPath, archivePath, sourceDb, targetDb }), { stdio: ["ignore", "ignore", "pipe"], shell: false, env: childEnvironment() });
    let stderr = "";
    child.stderr.on("data", (d) => {
      if (stderr.length < 65536) stderr += d.toString();
    });
    const onAbort = () => child.kill("SIGTERM");
    signal?.addEventListener("abort", onAbort, { once: true });
    child.on("error", () => resolve({ code: -1, stderr: "" }));
    child.on("close", (code, sig) => {
      signal?.removeEventListener("abort", onAbort);
      resolve({ code: code ?? -1, signal: sig, stderr });
    });
  })).catch((e) => {
    if (e instanceof LifecycleError) throw e;
    throw fail("TOOL_UNAVAILABLE", e?.code === "MKFIFO_UNAVAILABLE" ? "mkfifo is not available; credentials are never passed another way" : "could not prepare the private configuration pipe", EXIT.VALIDATION_FAILURE, "tooling");
  });
}

/* ----------------------------------------------------------------- comparison */
// Order-sensitive: a compound index key {a:1, b:1} is not {b:1, a:1}, and a
// view pipeline's $sort order matters. (canonicalJson sorts keys, so it is
// not used for these comparisons.) Restored options and index keys come back
// in the stored order, so equal definitions compare equal.
const ordered = (v) => JSON.stringify(v ?? null);
const indexShape = (list) => (list || []).map((ix) => ({ name: ix.name, key: Object.entries(ix.key ?? {}), unique: ix.unique === true })).sort((a, b) => a.name.localeCompare(b.name));
const VIEWS_COLLECTION = "system.views";

/**
 * Use D2's shared metadata-based view inventory. Only legacy manifests that
 * recorded a numeric view result count require evaluating that view for
 * backward compatibility; corrected D2 artifacts never query view data.
 */
export async function restoredState(adapter, manifest) {
  const state = await captureState(adapter);
  for (const c of state.collections) {
    const legacy = manifest?.database.collections.find((e) => e.name === c.name && e.type === "view" && e.countSemantics === undefined && Number.isInteger(e.count));
    if (c.type === "view" && legacy) c.count = await adapter.countDocuments(c.name);
  }
  return state;
}

/**
 * Compare the restored database with the D2 manifest. Every collection in the
 * manifest must exist and nothing else may: type, options, document count,
 * indexes (name, key, unique) and content must match.
 *
 * Content: D2 recorded, per collection, a digest of {dbHash md5, count}.
 * dbHash hashes a collection's documents, not its namespace, so it is
 * comparable after the database is renamed (verified with MongoDB 8.3.7 and
 * mongorestore 100.13.0) — except `system.views`, whose documents' _id is
 * "<database>.<view>". Its content is compared through every view's
 * definition (the view's options: viewOn, pipeline, collation) and its count.
 * The database-level dbHash folds in system.views, so it is compared only
 * when the backup has no views.
 */
export function compareRestored(manifest, restored) {
  const problems = [];
  const results = [];
  const expected = new Map(manifest.database.collections.map((c) => [c.name, c]));
  const actual = new Map(restored.collections.map((c) => [c.name, c]));
  for (const name of [...expected.keys()].filter((n) => !actual.has(n)).sort()) problems.push({ code: "MISSING_COLLECTION", collection: name });
  for (const name of [...actual.keys()].filter((n) => !expected.has(n)).sort()) problems.push({ code: "UNEXPECTED_COLLECTION", collection: name });
  for (const name of [...expected.keys()].sort()) {
    const e = expected.get(name);
    const a = actual.get(name);
    if (!a) continue;
    const r = { name, type: e.type, knownToRepository: e.knownToRepository === true, checks: {} };
    const check = (field, ok, code) => {
      r.checks[field] = ok ? "equal" : "MISMATCH";
      if (!ok) problems.push({ code, collection: name });
    };
    check("type", a.type === e.type, "TYPE_MISMATCH");
    check("options", ordered(a.options ?? {}) === ordered(e.options ?? {}), "OPTIONS_MISMATCH");
    check("count", a.count === e.count, "COUNT_MISMATCH");
    if (e.type === "view" && e.count === null && a.count === null) r.checks.count = "not-applicable (view; no stored documents)";
    if (name === VIEWS_COLLECTION && a.indexesInspected === false) {
      // New manifests record no inspection; legacy ones recorded the server's
      // default _id index. Reject any other claim that cannot be verified.
      const defaultOnly = ordered(indexShape(e.indexes)) === ordered(indexShape([{ name: "_id_", key: { _id: 1 } }]));
      const metadataOnly = e.name === VIEWS_COLLECTION && e.indexesInspected === false && e.indexes.length === 0;
      r.checks.indexes = metadataOnly || defaultOnly ? "server-managed (not inspected; not readable with read/readWrite)" : "MISMATCH";
      if (!metadataOnly && !defaultOnly) problems.push({ code: "INDEX_NOT_VERIFIABLE", collection: name });
    } else {
      check("indexes", ordered(indexShape(a.indexes)) === ordered(indexShape(e.indexes)), "INDEX_MISMATCH");
      if (e.type === "view" && r.checks.indexes === "equal") r.checks.indexes = "not-applicable (view; no stored indexes)";
    }
    if (name === VIEWS_COLLECTION) {
      r.content = "view-definitions";
      const views = [...expected.values()].filter((c) => c.type === "view");
      const ok = a.count === e.count && views.length === e.count && views.every((v) => actual.get(v.name)?.type === "view" && ordered(actual.get(v.name).options ?? {}) === ordered(v.options ?? {}));
      check("content", ok, "CONTENT_MISMATCH");
    } else {
      r.content = e.type === "view" ? "view (no stored documents; definition compared as options)" : "dbHash";
      check("content", digestOf({ contentHash: a.contentHash ?? null, count: a.count }) === e.fingerprint, "CONTENT_MISMATCH");
    }
    results.push(r);
  }
  let databaseHash;
  if (expected.has(VIEWS_COLLECTION)) {
    databaseHash = { result: "not-comparable", reason: "system.views stores namespace-qualified _id values, so the database-level dbHash depends on the database name; every collection is compared individually instead" };
  } else {
    const ok = typeof restored.databaseHash === "string" && sha256Hex(restored.databaseHash) === manifest.time.consistency.databaseHashSha256;
    databaseHash = { result: ok ? "equal" : "MISMATCH" };
    if (!ok) problems.push({ code: "DATABASE_HASH_MISMATCH" });
  }
  return { ok: problems.length === 0, problems, results, databaseHash };
}

/* ----------------------------------------------------------------- verification artifact */
const STATUS_KEYS = ["restoreSucceeded", "contentVerified", "restoreVerified"];
const TOP_LEVEL = ["schemaVersion", "kind", "verificationId", "backup", "target", "tool", "time", "namespaceMapping", "comparison", "evidence", "provesAndLimits", "status", "seal"];

export function sealVerification(doc) {
  const { seal, ...body } = doc;
  return { ...body, seal: { algorithm: "sha256", digest: digestOf(body) } };
}

/** Validate a restore-verification document (offline). */
export function validateVerification(doc) {
  const problems = [];
  const err = (p) => problems.push(p);
  if (!isPlainObject(doc)) return { ok: false, problems: ["not an object"] };
  for (const k of Object.keys(doc)) if (!TOP_LEVEL.includes(k)) err(`unknown field ${k}`);
  for (const k of TOP_LEVEL) if (!(k in doc)) err(`missing ${k}`);
  if (doc.schemaVersion !== VERIFICATION_SCHEMA_VERSION) err("unsupported schemaVersion");
  if (doc.kind !== "restore-verification") err("kind must be restore-verification");
  if (!OPERATION_ID_RE.test(String(doc.verificationId ?? ""))) err("verificationId invalid");
  const b = doc.backup;
  if (!isPlainObject(b) || !isSha256(b.manifestSealDigest) || !isSha256(b.manifestFileSha256) || !isSha256(b.archive?.sha256) || !isSha256(b.sourceFingerprint)) err("backup references invalid");
  if (b?.d2Status?.restoreVerified !== false) err("the D2 manifest status is historical and must still say restoreVerified false");
  if (!isPlainObject(doc.target) || !isSha256(doc.target.fingerprint) || doc.target.fingerprint === b?.sourceFingerprint) err("target invalid or equal to the source");
  if (!isPlainObject(doc.time) || !["startedAt", "restoreCompletedAt", "completedAt"].every((k) => isUtcTimestamp(doc.time[k]))) err("time invalid");
  const st = doc.status;
  if (!isPlainObject(st) || Object.keys(st).length !== STATUS_KEYS.length || STATUS_KEYS.some((k) => typeof st[k] !== "boolean")) err("status must be { restoreSucceeded, contentVerified, restoreVerified }");
  else if (st.restoreVerified !== (st.restoreSucceeded && st.contentVerified && doc.comparison?.ok === true && (doc.comparison?.problems || []).length === 0)) err("restoreVerified must be true only when the restore succeeded and every comparison passed");
  if (findSecrets(doc).length) err("contains secret-like content");
  if (!isPlainObject(doc.seal) || doc.seal.algorithm !== "sha256" || doc.seal.digest !== digestOf((({ seal, ...body }) => body)(doc))) err("seal does not match (altered or unsealed)");
  return { ok: problems.length === 0, problems };
}

/* ----------------------------------------------------------------- run */
/**
 * Verify one backup artifact by restoring it into an empty verification
 * database. Side effects come through `deps` so tests can supply fakes.
 */
export async function runRestoreVerify(argv, deps = {}) {
  const d = {
    env: process.env,
    now: () => new Date(),
    randomHex: (n) => randomBytes(n).toString("hex"),
    stdout: (s) => process.stdout.write(s),
    stderr: (s) => process.stderr.write(s),
    openTarget: openReadOnlyTarget,
    locateTool: (explicit, envPath) => locateTool(TOOL, explicit, envPath),
    toolVersion: (binary) => toolVersionOf(TOOL, binary),
    restore: runMongorestore,
    signal: null,
    ...deps,
  };
  const ctx = { evidence: null, fingerprint: null, operationId: null, outDir: null, adapter: null, refs: [], restoreStarted: false, recorded: false, verificationDatabase: null };
  const iso = () => d.now().toISOString();
  const guard = () => {
    if (d.signal?.aborted) throw fail("INTERRUPTED", "restore verification was interrupted", EXIT_INTERRUPTED, "interrupted");
  };
  const evidence = (event) => {
    const rec = appendEvidence({ dir: ctx.evidence.dir, event: { operationId: ctx.operationId, targetFingerprint: ctx.fingerprint, operator: ctx.evidence.operator, toolVersion: TOOL_VERSION, ...event }, now: d.now });
    ctx.refs.push({ eventType: rec.eventType, sequence: rec.sequence, digest: rec.digest });
    return rec;
  };

  try {
    if (argv.length === 1 && (argv[0] === "--help" || argv[0] === "-h")) {
      d.stdout("Usage: LIFECYCLE_TARGET_URI=<uri> restoreverify.js --artifact <abs-dir> --profiles <abs-file> --profile <alias> --output <abs-dir> --evidence-dir <abs-dir> --operator <id> [--verification-id <id>] [--mongorestore <abs-path>]\nR5-D3: restores ONE R5-D2 artifact into a new, empty, disposable verification database and verifies it. It is not an operator restore command.\n");
      return EXIT.OK;
    }
    const opts = parseRestoreVerifyArgs(argv);
    const outputRoot = checkOutputRoot(opts["--output"]);
    const evFile = evidencePath(opts["--evidence-dir"]);
    const artifactDir = opts["--artifact"];
    if (path.isAbsolute(artifactDir) && (inside(outputRoot, artifactDir) || inside(path.dirname(evFile), artifactDir))) {
      throw fail("UNSAFE_OUTPUT", "output and evidence must be outside the backup artifact (it is never modified)");
    }

    // D1 identity of the verification target, then the named operation.
    const profiles = validateProfiles(readJsonFile(opts["--profiles"], "profiles"));
    const identity = resolveTarget({ profiles, alias: opts["--profile"], uri: d.env[TARGET_URI_ENV], role: "verification-target" });
    authorizeOperation(identity, OPERATION);
    const profile = profiles.find((p) => p.alias === opts["--profile"]);
    const uri = d.env[TARGET_URI_ENV];
    ctx.verificationDatabase = identity.restricted.database;

    ctx.operationId = opts["--verification-id"] ?? `rv-${iso().replace(/[-:]/g, "").replace(/\..*$/, "")}-${d.randomHex(4)}`;
    ctx.fingerprint = identity.fingerprint;
    ctx.evidence = { dir: opts["--evidence-dir"], operator: opts["--operator"] };
    evidence({ eventType: "restore.requested", result: "requested" });

    // Artifact, offline, before any connection.
    const pre = preflightArtifact(artifactDir);
    const declared = proveDistinctDeclared({ source: pre.source, identity, profile });
    namespaceArgs(pre.source.database, identity.restricted.database);
    const restoreUri = restoreConnectionString(uri, identity.restricted.database);

    // Tooling.
    const binary = d.locateTool(opts["--mongorestore"], d.env.PATH);
    const toolVersion = d.toolVersion(binary);
    guard();

    // Live identity of the verification target (read-only).
    try {
      ctx.adapter = await d.openTarget(uri, identity.restricted.database, { singleHost: profile.connection.hosts.length === 1 });
    } catch (e) {
      if (e?.code === 18 || e?.codeName === "AuthenticationFailed" || e?.name === "MongoAuthenticationError" || e?.cause?.code === 18) {
        throw fail("PERMISSION_DENIED", "the verification target refused the supplied credentials (details suppressed)", EXIT.VALIDATION_FAILURE, "permission");
      }
      throw fail("TARGET_UNREACHABLE", "could not connect to the declared verification target (details suppressed)", EXIT.VALIDATION_FAILURE, "connectivity");
    }
    const hello = await ctx.adapter.hello();
    const live = checkLiveIdentity(hello, profile);
    if (live.topology !== "replica-set") throw identityRefusal("SOURCE_TARGET_AMBIGUOUS", "the verification target must be a replica set");
    const liveDistinct = proveDistinctLive({ source: pre.source, hello, scheme: profile.connection.scheme });
    const serverVersion = String((await ctx.adapter.buildInfo()).version);

    // The verification database must be new or empty. Nothing is dropped or cleared.
    const existing = await ctx.adapter.listCollections();
    if (existing.length) throw fail("TARGET_NOT_EMPTY", "the verification database already has collections; it must be new and empty (nothing is dropped, cleared or overwritten)", EXIT.INVALID_ARGS_OR_IDENTITY, "validation");
    evidence({ eventType: "restore.identity-verified", result: "succeeded", digests: { manifest: pre.sealDigest, backup: pre.archive.sha256 }, counts: { members: live.memberCount, collectionsBefore: 0 } });
    guard();

    // One new verification directory; never reuse or overwrite.
    const outDir = path.join(outputRoot, ctx.operationId);
    try {
      mkdirSync(outDir, { mode: 0o700 });
    } catch (e) {
      throw fail(e?.code === "EEXIST" ? "OUTPUT_COLLISION" : "UNSAFE_OUTPUT", e?.code === "EEXIST" ? "a verification with this id already exists; it is never overwritten" : "could not create the verification directory", EXIT.INVALID_ARGS_OR_IDENTITY, "validation");
    }
    ctx.outDir = outDir;

    const startedAt = iso();
    evidence({ eventType: "restore.started", result: "started" });
    ctx.restoreStarted = true;
    const res = await d.restore({ binary, uri: restoreUri, archivePath: pre.archivePath, sourceDb: pre.source.database, targetDb: identity.restricted.database, signal: d.signal });
    guard();
    if (res.code !== 0) throw fail("RESTORE_FAILED", `mongorestore failed (exit ${res.code}); output suppressed`, EXIT.VALIDATION_FAILURE, dumpFailureCategory(res.stderr));
    const restoreCompletedAt = iso();
    evidence({ eventType: "restore.completed", result: "succeeded", digests: { manifest: pre.sealDigest, backup: pre.archive.sha256 } });

    // The artifact must be exactly what was checked before the restore.
    if (!artifactUnchanged(artifactDir, pre)) throw integrity("ARTIFACT_CHANGED", "the backup artifact changed during verification; the result cannot be trusted");

    // Inspect the restored database (read-only) and compare with the manifest.
    const restored = await restoredState(ctx.adapter, pre.manifest);
    guard();
    const comparison = compareRestored(pre.manifest, restored);
    if (!comparison.ok) {
      const codes = [...new Set(comparison.problems.map((p) => p.code))].sort();
      const e = integrity("CONTENT_NOT_VERIFIED", `the restored database does not match the backup manifest (${codes.join(", ")})`);
      e.problems = comparison.problems;
      throw e;
    }
    const completedAt = iso();
    const documents = restored.collections.filter((c) => c.countSemantics === "documents").reduce((n, c) => n + c.count, 0);
    const doc = sealVerification({
      schemaVersion: VERIFICATION_SCHEMA_VERSION,
      kind: "restore-verification",
      verificationId: ctx.operationId,
      backup: {
        artifactId: pre.manifest.operationId,
        manifestSealDigest: pre.sealDigest,
        manifestFileSha256: pre.manifestFileSha256,
        manifestUnchanged: true,
        archive: pre.archive,
        sourceFingerprint: pre.source.fingerprint,
        sourceProfileClass: pre.source.profileClass,
        sourceDatabase: pre.source.database,
        sourceTopology: pre.source.topology,
        d2Status: pre.manifest.status,
      },
      target: {
        profileAlias: profile.alias,
        profileClass: profile.class,
        fingerprint: identity.fingerprint,
        verificationDatabase: identity.restricted.database,
        topology: live.topology,
        memberCheck: live.memberCheck,
        serverVersion,
        emptyBeforeRestore: true,
        distinctFromSource: { ...declared, ...liveDistinct },
      },
      tool: { lifecycle: TOOL_VERSION, mongorestore: toolVersion, method: "mongorestore-archive-gzip-namespace-remap", options: ["--gzip", "--nsInclude", "--nsFrom", "--nsTo", "--stopOnError", "--quiet"] },
      time: { startedAt, restoreCompletedAt, completedAt },
      namespaceMapping: { from: `${pre.source.database}.*`, to: `${identity.restricted.database}.*`, include: `${pre.source.database}.*` },
      comparison: { ok: true, problems: [], collections: comparison.results.length, documents, databaseHash: comparison.databaseHash, results: comparison.results, unknownToRepository: comparison.results.filter((r) => !r.knownToRepository).map((r) => r.name) },
      evidence: { file: DEFAULT_EVIDENCE_FILE, records: ctx.refs.slice() },
      provesAndLimits: {
        proves: "this backup artifact restored, under the tested conditions, into an empty disposable database whose collections, types, options, counts, indexes (name, key, unique) and content hashes match the backup manifest",
        doesNotProve: ["production restore procedures", "production RTO or RPO", "infrastructure recovery", "object storage (S3) recovery", "external service recovery", "index properties beyond name, key and uniqueness", "users and roles (not part of a D2 backup)"],
      },
      status: { restoreSucceeded: true, contentVerified: true, restoreVerified: true },
    });
    const valid = validateVerification(doc);
    if (!valid.ok) throw integrity("VERIFICATION_INVALID", "the verification document did not validate; it was not written");
    guard();
    writeExclusive(path.join(outDir, VERIFICATION_NAME), `${JSON.stringify(doc, null, 2)}\n`);
    evidence({ eventType: "verification.completed", result: "succeeded", digests: { verification: doc.seal.digest, manifest: pre.sealDigest, backup: pre.archive.sha256 }, counts: { collections: comparison.results.length, documents } });
    ctx.recorded = true;
    const chain = verifyEvidence(evFile);
    if (!chain.ok) throw integrity("EVIDENCE_INVALID", "the evidence chain did not verify");

    d.stdout(`${JSON.stringify({
      result: "RESTORE_VERIFIED",
      restoreVerified: true,
      note: "Verified on a disposable target under the tested conditions. Not a production restore procedure, RTO/RPO, infrastructure or object-storage proof.",
      verificationId: ctx.operationId,
      verificationFile: path.join(outDir, VERIFICATION_NAME),
      verificationDigest: doc.seal.digest,
      backup: { artifactId: pre.manifest.operationId, manifestDigest: pre.sealDigest, archiveSha256: pre.archive.sha256, sourceFingerprint: pre.source.fingerprint, manifestUnchanged: true, d2RestoreVerified: false },
      tool: { name: TOOL, version: toolVersion },
      target: publicIdentity(identity),
      verificationDatabase: identity.restricted.database,
      live,
      comparison: { collections: comparison.results.length, documents, databaseHash: comparison.databaseHash.result, unknownToRepository: doc.comparison.unknownToRepository },
      evidenceRecords: chain.records,
    }, null, 2)}\n`);
    return EXIT.OK;
  } catch (e) {
    const err = e instanceof LifecycleError ? e : fail("INTERNAL_ERROR", "unexpected failure (details suppressed)", EXIT.VALIDATION_FAILURE, "unknown");
    const category = err.category ?? (err.exitCode === EXIT.INVALID_ARGS_OR_IDENTITY ? "identity" : "validation");
    // A started run that did not verify is marked NOT VERIFIED; the
    // verification database is left as it is for diagnosis (never dropped here).
    if (ctx.outDir) {
      try {
        writeExclusive(path.join(ctx.outDir, NOT_VERIFIED_NAME), `${JSON.stringify({
          status: "NOT_VERIFIED",
          restoreVerified: false,
          verificationId: ctx.operationId,
          code: err.code,
          category,
          restoreStarted: ctx.restoreStarted,
          problems: Array.isArray(err.problems) ? err.problems : [],
          verificationDatabase: ctx.verificationDatabase,
          at: iso(),
          note: "Not a verified restore. The verification database may hold a partial restore; this command never drops it. Review, then drop that disposable database manually.",
        }, null, 2)}\n`);
      } catch {
        // marker may already exist
      }
    }
    if (ctx.evidence && ctx.fingerprint && !ctx.recorded) {
      try {
        if (err.code === "CONTENT_NOT_VERIFIED") evidence({ eventType: "verification.completed", result: "failed", failureCategory: "integrity" });
        else evidence({ eventType: "restore.failed", result: "failed", failureCategory: category });
      } catch {
        d.stderr("restore-verify: EVIDENCE_FAILED: the failure could not be recorded as evidence\n");
      }
    }
    d.stderr(`restore-verify: ${err.code}: ${err.message}\n`);
    return err.exitCode;
  } finally {
    if (ctx.adapter) {
      try {
        await ctx.adapter.close();
      } catch {
        // ignore
      }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  runRestoreVerify(process.argv.slice(2), { signal: controller.signal }).then((code) => {
    process.exitCode = code;
  });
}
