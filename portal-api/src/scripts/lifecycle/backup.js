#!/usr/bin/env node
// R5-D2 — verified backup creation (backup only).
//
//   LIFECYCLE_TARGET_URI='<uri>' node src/scripts/lifecycle/backup.js \
//     --profiles <abs-file> --profile <alias> --output <abs-dir> \
//     --evidence-dir <abs-dir> --operator <id> [--artifact-id <id>] [--mongodump <abs-path>]
//
// Creates ONE MongoDB backup artifact (mongodump archive) of the database a
// D1 profile declares, writes a sealed D1 manifest and appends D1 evidence.
// It proves BACKUP CREATION only: the manifest always records
// restoreVerified = false. Recoverability needs a restore check (R5-D3).
//
// Safety:
//  - The target must pass D1's declared-profile / observed-identity match,
//    list "backup" in its profile, and then pass a live identity check
//    (replica-set name, primary, every reported member on loopback and
//    declared). Staging, production, mongodb+srv and managed-cloud targets
//    are refused by D1; there is no override flag.
//  - The URI comes only from LIFECYCLE_TARGET_URI; never MONGO_URI or .env.
//    It reaches mongodump only through a private FIFO given to mongodump's
//    --config option (secretpipe.js): never argv, the child's environment, a
//    file on disk, output, a manifest, evidence or a file name.
//  - Database access is read-only (mongoread.js); mongodump is run by
//    absolute path with an argument array and no shell.
//  - Writes: one new directory <output>/<artifact-id> (created exclusively),
//    the archive, the manifest (written last, exclusively) or an
//    INCOMPLETE.json marker, and evidence in the explicit evidence directory.
//    Nothing is ever deleted or overwritten.
//
// There is no restore, drop, delete, reset, seed, repair or migrate path.

import { spawn, execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { accessSync, constants, closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readdirSync, readFileSync, readSync, realpathSync, statSync, writeSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { EXIT, LifecycleError, isPlainObject, digestOf, sha256Hex, OPERATION_ID_RE } from "./common.js";
import { validateProfiles, resolveTarget, authorizeOperation, hostCategory, publicIdentity } from "./target.js";
import { loadCatalog, REPO_ROOT } from "./catalog.js";
import { appendEvidence, verifyEvidence, evidencePath } from "./evidence.js";
import { validateManifest, sealManifest, STATUS } from "./manifest.js";
import { gitApplicationInfo, TARGET_URI_ENV } from "./cli.js";
import { openReadOnlyTarget } from "./mongoread.js";
import { withSecretPipe } from "./secretpipe.js";

export const TOOL_VERSION = "r5-d2.1";
export const EXIT_INTERRUPTED = 130;
export const ARCHIVE_NAME = "database.archive.gz";
export const MANIFEST_NAME = "manifest.json";
export const INCOMPLETE_NAME = "INCOMPLETE.json";
const CAPTURE_METHOD = "mongodump-archive-gzip";
const FLAGS = ["--profiles", "--profile", "--output", "--evidence-dir", "--operator", "--artifact-id", "--mongodump"];
const REQUIRED = ["--profiles", "--profile", "--output", "--evidence-dir", "--operator"];
const PRODUCTION_LIKE_SET = /(^|[^a-z0-9])(prod|production|live)([^a-z0-9]|$)|^atlas-/i;

const fail = (code, message, exitCode = EXIT.INVALID_ARGS_OR_IDENTITY, category = "validation") => {
  const e = new LifecycleError(code, message, exitCode);
  e.category = category;
  return e;
};

/* ----------------------------------------------------------------- args */
export function parseBackupArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!FLAGS.includes(flag)) throw fail("INVALID_ARGS", "unknown or unsupported option (R5-D2 provides backup only; there is no override flag)");
    if (Object.hasOwn(opts, flag)) throw fail("INVALID_ARGS", "an option was given twice");
    const value = argv[++i];
    if (value === undefined || value.startsWith("--")) throw fail("INVALID_ARGS", "an option is missing its value");
    opts[flag] = value;
  }
  for (const f of REQUIRED) if (!opts[f]) throw fail(f === "--profiles" || f === "--profile" ? "MISSING_PROFILE" : "INVALID_ARGS", `missing required option ${f}`);
  if (opts["--artifact-id"] !== undefined && !OPERATION_ID_RE.test(opts["--artifact-id"])) throw fail("INVALID_ARGS", "artifact id must be 8–128 safe characters");
  if (!/^[A-Za-z0-9._@-]{1,64}$/.test(opts["--operator"])) throw fail("INVALID_ARGS", "operator identifier is invalid");
  return opts;
}

/** An explicit, absolute, canonical, existing, non-symlink directory outside the repository. */
export function checkOutputRoot(dir) {
  if (typeof dir !== "string" || !path.isAbsolute(dir)) throw fail("UNSAFE_OUTPUT", "output directory must be an explicit absolute path");
  if (path.normalize(dir) !== dir || dir.length > 1 && dir.endsWith(path.sep)) throw fail("UNSAFE_OUTPUT", "output directory must be a canonical path (no '.', '..', duplicate or trailing separators)");
  let st;
  try {
    st = lstatSync(dir);
  } catch {
    throw fail("UNSAFE_OUTPUT", "output directory does not exist");
  }
  if (st.isSymbolicLink()) throw fail("UNSAFE_OUTPUT", "output directory must not be a symbolic link");
  if (!st.isDirectory()) throw fail("UNSAFE_OUTPUT", "output path is not a directory");
  if (realpathSync(dir) !== dir) throw fail("UNSAFE_OUTPUT", "output directory must not pass through symbolic links");
  const repo = realpathSync(REPO_ROOT);
  if (dir === repo || dir.startsWith(repo + path.sep) || repo.startsWith(dir + path.sep)) throw fail("UNSAFE_OUTPUT", "output directory must be outside (and not a parent of) the repository");
  return dir;
}

function readJsonFile(file, label) {
  if (!path.isAbsolute(file)) throw fail("INVALID_ARGS", `${label} path must be absolute`);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw fail("INVALID_ARGS", `the ${label} file could not be read as JSON`);
  }
}

/* ----------------------------------------------------------------- tool */
/**
 * Locate a MongoDB Database Tools binary (`name`): an explicit absolute path,
 * or a controlled PATH lookup (absolute entries only). Never downloads.
 */
export function locateTool(name, explicit, envPath = "") {
  if (!/^mongo[a-z]{2,20}$/.test(String(name))) throw fail("TOOL_UNAVAILABLE", "unsupported tool name", EXIT.VALIDATION_FAILURE, "tooling");
  const usable = (p) => {
    try {
      const st = statSync(p);
      accessSync(p, constants.X_OK);
      return st.isFile();
    } catch {
      return false;
    }
  };
  if (explicit !== undefined) {
    if (!path.isAbsolute(explicit)) throw fail("TOOL_UNAVAILABLE", `--${name} must be an absolute path`, EXIT.VALIDATION_FAILURE, "tooling");
    if (!usable(explicit)) throw fail("TOOL_UNAVAILABLE", `${name} was not found at the given path`, EXIT.VALIDATION_FAILURE, "tooling");
    return explicit;
  }
  for (const dir of String(envPath).split(path.delimiter)) {
    if (!dir || !path.isAbsolute(dir)) continue;
    const p = path.join(dir, name);
    if (usable(p)) return p;
  }
  throw fail("TOOL_UNAVAILABLE", `${name} is not installed (it is never downloaded automatically)`, EXIT.VALIDATION_FAILURE, "tooling");
}
export const locateMongodump = (explicit, envPath = "") => locateTool("mongodump", explicit, envPath);

/** The version a Database Tools binary reports, with the filtered child environment. */
export function toolVersionOf(name, binary) {
  try {
    const out = execFileSync(binary, ["--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 15000, env: childEnvironment() });
    const m = out.match(new RegExp(`^${name} version:\\s*([0-9][0-9A-Za-z.+-]*)`, "m"));
    if (m) return m[1];
  } catch {
    // fall through
  }
  throw fail("TOOL_UNAVAILABLE", `${name} did not report a version`, EXIT.VALIDATION_FAILURE, "tooling");
}
export const mongodumpVersion = (binary) => toolVersionOf("mongodump", binary);

/** The child's environment: ours, minus anything carrying a MongoDB connection string. */
export function childEnvironment(env = process.env) {
  return Object.fromEntries(Object.entries(env).filter(([k, v]) => k !== TARGET_URI_ENV && !/mongodb(\+srv)?:\/\//i.test(String(v))));
}

/**
 * Run mongodump with an argument array (no shell). The whole connection
 * string (user, password, host, database) goes through mongodump's
 * documented --config file, delivered as a private FIFO (secretpipe.js): it
 * is never in argv, never in the child's environment and never on disk.
 * Output is captured for categorisation only and never printed or stored.
 */
export function runMongodump({ binary, uri, archivePath, signal }) {
  return withSecretPipe(`uri: ${JSON.stringify(uri)}\n`, (configPath) => new Promise((resolve) => {
    const child = spawn(binary, [`--config=${configPath}`, `--archive=${archivePath}`, "--gzip", "--quiet"], { stdio: ["ignore", "ignore", "pipe"], shell: false, env: childEnvironment() });
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
/** Category for a failed dump, from its stderr. The text itself is never printed or stored. */
export function dumpFailureCategory(stderr = "") {
  if (/auth|unauthori[sz]ed|not authorized|requires authentication/i.test(stderr)) return "permission";
  if (/server selection|connection|connect|timed? ?out|no reachable/i.test(stderr)) return "connectivity";
  if (/no space|disk|quota/i.test(stderr)) return "capacity";
  return "unknown";
}

/* ----------------------------------------------------------------- files */
export function writeExclusive(file, text) {
  const fd = openSync(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600);
  try {
    writeSync(fd, text);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}
export function fileDigest(file) {
  const hash = createHash("sha256");
  const fd = openSync(file, "r");
  const buf = Buffer.alloc(1 << 20);
  let bytes = 0;
  try {
    for (;;) {
      const n = readSync(fd, buf, 0, buf.length, null);
      if (!n) break;
      hash.update(buf.subarray(0, n));
      bytes += n;
    }
  } finally {
    closeSync(fd);
  }
  return { sha256: hash.digest("hex"), bytes };
}

/**
 * Check an artifact directory against its manifest (read-only). Detects a
 * missing manifest, an INCOMPLETE marker, missing, extra, truncated or
 * modified files and checksum mismatches. Never claims restorability.
 */
export function verifyBackupArtifact(dir) {
  const problems = [];
  const out = (ok) => ({ ok, problems, restoreVerified: false });
  if (existsSync(path.join(dir, INCOMPLETE_NAME))) problems.push({ code: "INCOMPLETE_MARKER", detail: "the run that produced this directory did not complete" });
  const mf = path.join(dir, MANIFEST_NAME);
  if (!existsSync(mf)) {
    problems.push({ code: "MISSING_MANIFEST" });
    return out(false);
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(mf, "utf8"));
  } catch {
    problems.push({ code: "UNREADABLE_MANIFEST" });
    return out(false);
  }
  const v = validateManifest(manifest);
  if (v.status !== STATUS.VALID) problems.push({ code: "MANIFEST_NOT_VALID", detail: v.status });
  if (manifest.status?.backupCreated !== true || manifest.status?.restoreVerified !== false) problems.push({ code: "STATUS_NOT_BACKUP_CREATED" });
  const listed = new Set((manifest.artifacts || []).map((a) => a.path));
  for (const name of readdirSync(dir).sort()) {
    if (name !== MANIFEST_NAME && name !== INCOMPLETE_NAME && !listed.has(name)) problems.push({ code: "EXTRA_FILE", path: name });
  }
  for (const a of manifest.artifacts || []) {
    const p = path.join(dir, a.path);
    if (!existsSync(p)) { problems.push({ code: "MISSING_FILE", path: a.path }); continue; }
    const d = fileDigest(p);
    if (d.bytes < a.bytes) problems.push({ code: "TRUNCATED_FILE", path: a.path });
    else if (d.bytes !== a.bytes) problems.push({ code: "SIZE_MISMATCH", path: a.path });
    if (d.sha256 !== a.sha256) problems.push({ code: "CHECKSUM_MISMATCH", path: a.path });
  }
  return out(problems.length === 0);
}

/* ----------------------------------------------------------------- live identity */
/** Refuse a live server that does not match the declared profile. Returns identity evidence. */
export function checkLiveIdentity(hello, profile) {
  const refuse = (code, msg) => fail(code, msg, EXIT.INVALID_ARGS_OR_IDENTITY, "identity");
  if (!isPlainObject(hello)) throw refuse("LIVE_IDENTITY_UNAVAILABLE", "the server did not report its identity");
  if (hello.msg === "isdbgrid") throw refuse("UNSUPPORTED_TOPOLOGY", "sharded clusters (mongos) are not supported by R5-D2");
  if (hello.isWritablePrimary !== true) throw refuse("UNSUPPORTED_TOPOLOGY", "the connected member is not the primary; R5-D2 backs up from the primary only");
  const declaredSet = profile.connection.replicaSet ?? null;
  const liveSet = typeof hello.setName === "string" ? hello.setName : null;
  if (declaredSet !== liveSet) throw refuse("LIVE_IDENTITY_MISMATCH", "the server's replica-set name does not match the declared profile");
  if (liveSet && PRODUCTION_LIKE_SET.test(liveSet)) throw refuse("PRODUCTION_LIKE_TARGET", "the server's replica-set name looks like production or a managed cluster; refused");
  const declared = new Set(profile.connection.hosts);
  const reported = [...new Set([...(hello.hosts || []), ...(hello.passives || []), ...(hello.arbiters || [])].map((h) => String(h).toLowerCase()))].sort();
  let memberCheck = "not-reported";
  if (liveSet) {
    if (!reported.length || typeof hello.me !== "string") throw refuse("LIVE_IDENTITY_UNAVAILABLE", "the replica set did not report its members");
    const me = hello.me.toLowerCase();
    if (!declared.has(me)) throw refuse("LIVE_IDENTITY_MISMATCH", "the server reports itself under a host the profile does not declare");
    for (const h of reported) {
      if (hostCategory(h.replace(/:\d+$/, "")) !== "loopback") throw refuse("LIVE_IDENTITY_MISMATCH", "the replica set reports a member that is not on loopback (possible tunnel or wrong target)");
    }
    if (![...declared].every((h) => reported.includes(h))) throw refuse("LIVE_IDENTITY_MISMATCH", "a declared host is not a member of the live replica set");
    memberCheck = "all-members-loopback-and-declared";
  }
  return {
    topology: liveSet ? "replica-set" : "standalone",
    replicaSetMatches: true,
    isWritablePrimary: true,
    memberCount: liveSet ? reported.length : 1,
    memberCheck,
  };
}

/* ----------------------------------------------------------------- inventory */
/**
 * Shared D2/D3 read-only inventory. Views have definitions, not stored document
 * counts. system.views cannot be counted/index-inspected with read/readWrite:
 * derive its definition count from listCollections, as D3 already does.
 * dbHash remains read-only evidence, including system.views on the source.
 */
export async function captureState(adapter) {
  const collections = await adapter.listCollections();
  const hash = await adapter.dbHash();
  const viewCount = collections.filter((c) => c.type === "view").length;
  const out = [];
  for (const c of collections) {
    const isViews = c.name === "system.views";
    const isView = c.type === "view";
    const count = isViews ? viewCount : isView ? null : await adapter.countDocuments(c.name);
    const countSemantics = isViews ? "view-definitions" : isView ? "not-applicable" : "documents";
    let indexes = [];
    if (!isView && !isViews) {
      indexes = (await adapter.listIndexes(c.name)).map((ix) => ({ name: ix.name, key: ix.key, unique: ix.unique === true })).sort((a, b) => a.name.localeCompare(b.name));
    }
    const md5 = hash?.collections?.[c.name] ?? null;
    out.push({ name: c.name, type: c.type, options: c.options || {}, count, countSemantics, indexes, indexesInspected: !isViews && !isView, contentHash: md5 });
  }
  return { collections: out, databaseHash: hash?.md5 ?? null };
}
// Preserve object order: compound index keys and pipeline $sort order matter.
// Sort namespace/index lists only; compare types, options and definitions too.
const stateDigest = (s) => sha256Hex(JSON.stringify([...s.collections].sort((a, b) => a.name.localeCompare(b.name))));

/* ----------------------------------------------------------------- run */
/**
 * Run one backup. All side effects come through `deps` so tests can supply
 * fakes. Returns the exit code; prints a sanitized JSON report on success.
 */
export async function runBackup(argv, deps = {}) {
  const d = {
    env: process.env,
    now: () => new Date(),
    randomHex: (n) => randomBytes(n).toString("hex"),
    stdout: (s) => process.stdout.write(s),
    stderr: (s) => process.stderr.write(s),
    openTarget: openReadOnlyTarget,
    locateTool: (explicit, envPath) => locateMongodump(explicit, envPath),
    toolVersion: mongodumpVersion,
    dump: runMongodump,
    loadCatalog: () => loadCatalog(),
    application: () => gitApplicationInfo(),
    lockfileDigest: () => sha256Hex(readFileSync(path.join(REPO_ROOT, "portal-api/package-lock.json"))),
    signal: null,
    ...deps,
  };
  let ctx = { evidence: null, fingerprint: null, operationId: null, artifactDir: null, manifestWritten: false, adapter: null };
  const iso = () => d.now().toISOString();
  const guard = () => {
    if (d.signal?.aborted) throw fail("INTERRUPTED", "the backup was interrupted", EXIT_INTERRUPTED, "interrupted");
  };
  const evidence = (event) => appendEvidence({ dir: ctx.evidence.dir, event: { operationId: ctx.operationId, targetFingerprint: ctx.fingerprint, operator: ctx.evidence.operator, toolVersion: TOOL_VERSION, ...event }, now: d.now });

  try {
    if (argv.length === 1 && (argv[0] === "--help" || argv[0] === "-h")) {
      d.stdout("Usage: LIFECYCLE_TARGET_URI=<uri> backup.js --profiles <abs-file> --profile <alias> --output <abs-dir> --evidence-dir <abs-dir> --operator <id> [--artifact-id <id>] [--mongodump <abs-path>]\nR5-D2: creates a backup artifact only. It never restores.\n");
      return EXIT.OK;
    }
    const opts = parseBackupArgs(argv);
    const outputRoot = checkOutputRoot(opts["--output"]);
    evidencePath(opts["--evidence-dir"]); // absolute, outside the repository (D1 rule)

    // D1 identity: declared profile ↔ observed URI, then the operation.
    const profiles = validateProfiles(readJsonFile(opts["--profiles"], "profiles"));
    const identity = resolveTarget({ profiles, alias: opts["--profile"], uri: d.env[TARGET_URI_ENV], role: "source" });
    authorizeOperation(identity, "backup");
    const profile = profiles.find((p) => p.alias === opts["--profile"]);
    const uri = d.env[TARGET_URI_ENV];

    const application = d.application();
    if (!application.gitCommit) throw fail("APPLICATION_UNKNOWN", "the application commit could not be determined; a backup manifest requires it", EXIT.VALIDATION_FAILURE, "validation");
    const catalog = d.loadCatalog();

    ctx.operationId = opts["--artifact-id"] ?? `bk-${iso().replace(/[-:]/g, "").replace(/\..*$/, "")}-${d.randomHex(4)}`;
    ctx.fingerprint = identity.fingerprint;
    ctx.evidence = { dir: opts["--evidence-dir"], operator: opts["--operator"] };
    evidence({ eventType: "backup.requested", result: "requested" });

    // Tooling before any connection or write.
    const binary = d.locateTool(opts["--mongodump"], d.env.PATH);
    const toolVersion = d.toolVersion(binary);
    guard();

    // Live identity (read-only).
    try {
      ctx.adapter = await d.openTarget(uri, identity.restricted.database, { singleHost: profile.connection.hosts.length === 1 });
    } catch (e) {
      // Only the error's type is inspected; its message (which can name hosts) is never printed.
      if (e?.code === 18 || e?.codeName === "AuthenticationFailed" || e?.name === "MongoAuthenticationError" || e?.cause?.code === 18) {
        throw fail("PERMISSION_DENIED", "the target refused the supplied credentials (details suppressed)", EXIT.VALIDATION_FAILURE, "permission");
      }
      throw fail("TARGET_UNREACHABLE", "could not connect to the declared target (details suppressed)", EXIT.VALIDATION_FAILURE, "connectivity");
    }
    const live = checkLiveIdentity(await ctx.adapter.hello(), profile);
    const serverVersion = String((await ctx.adapter.buildInfo()).version);
    const before = await captureState(ctx.adapter);
    const beforeDigest = stateDigest(before);
    if (!before.collections.length) throw fail("EMPTY_DATABASE", "the declared database has no collections; refusing to back up an empty (possibly wrong) target", EXIT.INVALID_ARGS_OR_IDENTITY, "identity");
    evidence({ eventType: "backup.identity-verified", result: "succeeded", counts: { collections: before.collections.length, members: live.memberCount } });
    guard();

    // Exactly one new artifact directory; never reuse or overwrite.
    ctx.artifactDir = path.join(outputRoot, ctx.operationId);
    try {
      mkdirSync(ctx.artifactDir, { mode: 0o700 });
    } catch (e) {
      ctx.artifactDir = null;
      throw fail(e?.code === "EEXIST" ? "OUTPUT_COLLISION" : "UNSAFE_OUTPUT", e?.code === "EEXIST" ? "an artifact with this id already exists; it is never overwritten" : "could not create the artifact directory", EXIT.INVALID_ARGS_OR_IDENTITY, "validation");
    }

    const startedAt = iso();
    evidence({ eventType: "backup.started", result: "started" });
    const archivePath = path.join(ctx.artifactDir, ARCHIVE_NAME);
    const res = await d.dump({ binary, uri, archivePath, signal: d.signal });
    guard();
    if (res.code !== 0) throw fail("DUMP_FAILED", `mongodump failed (exit ${res.code}); output suppressed`, EXIT.VALIDATION_FAILURE, dumpFailureCategory(res.stderr));
    if (!existsSync(archivePath)) throw fail("DUMP_FAILED", "mongodump produced no archive", EXIT.VALIDATION_FAILURE, "integrity");

    // Consistency: the database must be unchanged across the capture.
    const after = await captureState(ctx.adapter);
    if (beforeDigest !== stateDigest(after) || before.databaseHash !== after.databaseHash) {
      throw fail("SOURCE_CHANGED_DURING_BACKUP", "the database changed during capture; this artifact is not consistent and is not a valid backup", EXIT.VALIDATION_FAILURE, "integrity");
    }
    guard();
    const completedAt = iso();

    const archive = fileDigest(archivePath);
    if (archive.bytes === 0) throw fail("DUMP_FAILED", "the archive is empty", EXIT.VALIDATION_FAILURE, "integrity");
    evidence({ eventType: "backup.artifact-checksummed", result: "succeeded", digests: { backup: archive.sha256 }, counts: { bytes: archive.bytes } });

    const known = new Set(catalog.entries.map((e) => e.collection));
    const manifest = sealManifest({
      schemaVersion: "expresso.lifecycle.manifest/1",
      operationId: ctx.operationId,
      kind: "backup",
      source: { profileAlias: profile.alias, profileClass: profile.class, fingerprint: identity.fingerprint },
      time: { startedAt, completedAt, consistency: { method: "quiescent-verified", clusterTime: null, databaseHashSha256: sha256Hex(String(before.databaseHash)) } },
      application: {
        gitCommit: application.gitCommit,
        dirty: application.dirty === true,
        catalogVersion: catalog.catalogVersion,
        toolVersion: `${TOOL_VERSION}; mongodump ${toolVersion}`,
        lockfiles: [{ path: "portal-api/package-lock.json", sha256: d.lockfileDigest() }],
      },
      database: {
        name: identity.restricted.database,
        topology: live.topology,
        serverVersion,
        collections: before.collections.map((c) => ({
          name: c.name,
          type: c.type,
          options: c.options,
          count: c.count,
          countSemantics: c.countSemantics,
          fingerprint: digestOf({ contentHash: c.contentHash, count: c.count }),
          indexes: c.indexes,
          indexesInspected: c.indexesInspected,
          knownToRepository: known.has(c.name),
        })),
      },
      objectStorage: { stores: [] },
      artifacts: [{ path: ARCHIVE_NAME, bytes: archive.bytes, sha256: archive.sha256, component: "database", encryption: null }],
      completion: {
        requiredComponents: ["database", "application-metadata", "object-storage-public", "object-storage-private"],
        completedComponents: ["database", "application-metadata"],
        exclusions: [
          { component: "object-storage-public", reason: "object storage is outside R5-D2 (database backup only)" },
          { component: "object-storage-private", reason: "object storage is outside R5-D2 (database backup only)" },
        ],
        failures: [],
        captureMethod: CAPTURE_METHOD,
        state: "complete",
      },
      status: { backupCreated: true, artifactChecksumsValid: true, restoreVerified: false },
    });
    guard();
    const check = validateManifest(manifest);
    if (check.status !== STATUS.VALID) throw fail("MANIFEST_INVALID", "the manifest did not validate; no manifest was written", EXIT.VALIDATION_FAILURE, "validation");

    writeExclusive(path.join(ctx.artifactDir, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`);
    ctx.manifestWritten = true;
    const artifactCheck = verifyBackupArtifact(ctx.artifactDir);
    if (!artifactCheck.ok) throw fail("ARTIFACT_CHECK_FAILED", "the written artifact did not verify against its manifest", EXIT.VALIDATION_FAILURE, "integrity");
    evidence({ eventType: "backup.manifest-written", result: "succeeded", digests: { manifest: manifest.seal.digest } });
    const documents = before.collections.filter((c) => c.countSemantics === "documents").reduce((n, c) => n + c.count, 0);
    evidence({ eventType: "backup.completed", result: "succeeded", digests: { manifest: manifest.seal.digest, backup: archive.sha256 }, counts: { collections: before.collections.length, documents } });
    const chain = verifyEvidence(evidencePath(ctx.evidence.dir));
    if (!chain.ok) throw fail("EVIDENCE_INVALID", "the evidence chain did not verify", EXIT.VALIDATION_FAILURE, "integrity");

    d.stdout(`${JSON.stringify({
      result: "BACKUP_CREATED",
      restoreVerified: false,
      note: "Backup creation only. Recoverability is not established until a restore is verified (R5-D3).",
      artifactId: ctx.operationId,
      artifactDirectory: ctx.artifactDir,
      manifestDigest: manifest.seal.digest,
      archive: { file: ARCHIVE_NAME, bytes: archive.bytes, sha256: archive.sha256 },
      consistency: "quiescent-verified (matching before/after hashes, types, options, view definitions, counts and inspectable indexes; not an atomic snapshot)",
      tool: { name: "mongodump", version: toolVersion },
      target: publicIdentity(identity),
      live,
      collections: { total: before.collections.length, documents, unknownToRepository: before.collections.filter((c) => !known.has(c.name)).map((c) => c.name) },
      manifestWarnings: check.warnings,
      evidenceRecords: chain.records,
    }, null, 2)}\n`);
    return EXIT.OK;
  } catch (e) {
    const err = e instanceof LifecycleError ? e : fail("INTERNAL_ERROR", "unexpected failure (details suppressed)", EXIT.VALIDATION_FAILURE, "unknown");
    const category = err.category ?? (err.exitCode === EXIT.INVALID_ARGS_OR_IDENTITY ? "identity" : "validation");
    // A started run that did not finish is marked; nothing is deleted.
    if (ctx.artifactDir) {
      try {
        writeExclusive(path.join(ctx.artifactDir, INCOMPLETE_NAME), `${JSON.stringify({ status: "INCOMPLETE", artifactId: ctx.operationId, code: err.code, category, at: iso(), note: "Not a valid backup. Preserved for diagnosis; never restore from it." }, null, 2)}\n`);
      } catch {
        // the marker may already exist; the manifest (if any) is then still accompanied by it
      }
    }
    if (ctx.evidence && ctx.fingerprint) {
      try {
        evidence({ eventType: "backup.failed", result: "failed", failureCategory: category });
      } catch {
        d.stderr("backup: EVIDENCE_FAILED: the failure could not be recorded as evidence\n");
      }
    }
    d.stderr(`backup: ${err.code}: ${err.message}\n`);
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
  runBackup(process.argv.slice(2), { signal: controller.signal }).then((code) => {
    process.exitCode = code;
  });
}
