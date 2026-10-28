// R5-D1 — target identity and profile validation.
//
// A lifecycle command never trusts NODE_ENV, DB_ENVIRONMENT, a database name
// containing "test", or a localhost address on its own: a tunnel or alias can
// point anywhere. Every target needs
//   1. a DECLARED profile (an explicit, registered alias with an expected
//      connection identity and the operation classes it allows), and
//   2. an OBSERVED identity parsed from the connection string,
// and the two must match exactly. Anything missing, malformed, ambiguous,
// mismatched or unsupported is refused. Pure functions: nothing here
// connects to a database or reads the environment by itself.

import { ALIAS_RE, LifecycleError, digestOf, sha256Hex, isPlainObject, duplicates, findSecrets } from "./common.js";

export const PROFILES_SCHEMA_VERSION = "expresso.lifecycle.profiles/1";
export const TARGET_FINGERPRINT_VERSION = "expresso.lifecycle.target/1";

// Profile classes. D1 recognises all of them but supports only the
// nonproduction local/disposable classes, and only for read operations.
export const PROFILE_CLASSES = Object.freeze({
  local: { supportedInD1: true, nonproduction: true, loopbackOnly: true },
  disposable: { supportedInD1: true, nonproduction: true, loopbackOnly: true },
  "shared-development": { supportedInD1: false, nonproduction: true },
  staging: { supportedInD1: false, nonproduction: true },
  production: { supportedInD1: false, nonproduction: false },
});

// Operation classes for this and later phases. D1 permits only "read".
export const OPERATION_CLASSES = Object.freeze(["read", "write-nonproduction", "destructive-nonproduction"]);
export const D1_ALLOWED_OPERATION_CLASSES = Object.freeze(["read"]);
// Operations a profile may list, and the class each belongs to. "backup"
// (R5-D2) only reads the database; its writes are local artifact files.
// "restore-verify" (R5-D3) is the only write operation: it restores a
// verified D2 artifact into a NEW, EMPTY verification database on a
// local/disposable target and checks it. It is never implied by "backup".
// A profile must list an operation explicitly before it can run.
export const OPERATIONS = Object.freeze({ inventory: "read", backup: "read", "restore-verify": "write-nonproduction" });
// Write operations exist only by name; no operation class is opened as a whole.
export const NAMED_WRITE_OPERATIONS = Object.freeze(["restore-verify"]);
const permittedOperation = (op) => D1_ALLOWED_OPERATION_CLASSES.includes(OPERATIONS[op]) || NAMED_WRITE_OPERATIONS.includes(op);

const DEFAULT_PORT = 27017;
const SUPPORTED_SCHEMES = new Set(["mongodb", "mongodb+srv"]);
const PRODUCTION_NAME_RE = /(^|[^a-z0-9])(prod|production|live)([^a-z0-9]|$)/i;
const MANAGED_HOST_RE = /\.(mongodb\.net|mongodb-dev\.net|documents\.azure\.com|docdb\.amazonaws\.com)$/i;
const DB_NAME_RE = /^[A-Za-z0-9_-]{1,63}$/;

function fail(code, message) {
  throw new LifecycleError(code, message);
}

/** "localhost", 127.0.0.0/8 and ::1 are loopback. Nothing else is. */
export function hostCategory(host) {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "localhost" || h === "::1" || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return "loopback";
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return "private-network";
  if (MANAGED_HOST_RE.test(h)) return "managed-cloud";
  return "remote";
}

function normaliseHost(raw, scheme) {
  const s = String(raw).trim().toLowerCase();
  if (!s) fail("MALFORMED_TARGET", "connection string has an empty host");
  if (s.includes("%2f") || s.includes("/") || s.endsWith(".sock")) fail("UNSUPPORTED_CONNECTION", "unix-socket connections are not supported");
  let host = s;
  let port = null;
  const v6 = s.match(/^\[([0-9a-f:]+)\](?::(\d+))?$/);
  if (v6) {
    host = `[${v6[1]}]`;
    port = v6[2] ?? null;
  } else {
    const m = s.match(/^([a-z0-9.-]+)(?::(\d+))?$/);
    if (!m) fail("MALFORMED_TARGET", "connection string has a malformed host");
    host = m[1];
    port = m[2] ?? null;
  }
  if (scheme === "mongodb+srv") {
    if (port !== null) fail("MALFORMED_TARGET", "mongodb+srv connection strings cannot name a port");
    return host;
  }
  const n = port === null ? DEFAULT_PORT : Number(port);
  if (!Number.isInteger(n) || n < 1 || n > 65535) fail("MALFORMED_TARGET", "connection string has an invalid port");
  return `${host}:${n}`;
}

/**
 * Parse a MongoDB connection string into an observed identity WITHOUT
 * credentials. Only `credentialsPresent` (a boolean) records whether the
 * string carried any. Error messages never include the input.
 */
export function parseConnectionString(uri) {
  if (typeof uri !== "string" || uri.trim() === "") fail("MISSING_TARGET", "no target connection string was supplied");
  const text = uri.trim();
  if (/\s/.test(text)) fail("MALFORMED_TARGET", "connection string contains whitespace");
  const m = text.match(/^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i);
  if (!m) fail("MALFORMED_TARGET", "connection string is not a valid URI");
  const scheme = m[1].toLowerCase();
  if (!SUPPORTED_SCHEMES.has(scheme)) fail("UNSUPPORTED_CONNECTION", "only mongodb:// and mongodb+srv:// connection strings are supported");
  if (m[5]) fail("MALFORMED_TARGET", "connection string must not contain a fragment");

  let authority = m[2];
  const at = authority.lastIndexOf("@");
  const credentialsPresent = at !== -1;
  if (credentialsPresent) authority = authority.slice(at + 1);
  if (!authority) fail("MALFORMED_TARGET", "connection string has no host");

  const hosts = authority.split(",").map((h) => normaliseHost(h, scheme));
  if (scheme === "mongodb+srv" && hosts.length !== 1) fail("MALFORMED_TARGET", "mongodb+srv connection strings name exactly one host");
  if (duplicates(hosts).length) fail("AMBIGUOUS_TARGET", "connection string lists the same host more than once");

  const pathPart = (m[3] || "").replace(/^\//, "");
  if (!pathPart) fail("AMBIGUOUS_TARGET", "connection string does not name a database (the driver would silently use a default)");
  let database;
  try {
    database = decodeURIComponent(pathPart);
  } catch {
    fail("MALFORMED_TARGET", "connection string database name is not valid");
  }
  if (!DB_NAME_RE.test(database)) fail("MALFORMED_TARGET", "connection string database name is not valid");

  const params = new URLSearchParams((m[4] || "").replace(/^\?/, ""));
  const keys = [...params.keys()].map((k) => k.toLowerCase());
  if (duplicates(keys).length) fail("AMBIGUOUS_TARGET", "connection string repeats an option");
  const replicaSet = params.get("replicaSet") ?? params.get("replicaset") ?? null;
  if (replicaSet !== null && !/^[A-Za-z0-9_.-]{1,64}$/.test(replicaSet)) fail("MALFORMED_TARGET", "connection string replica set name is not valid");
  const directConnection = (params.get("directConnection") ?? params.get("directconnection") ?? "").toLowerCase() === "true";
  if (directConnection && hosts.length > 1) fail("AMBIGUOUS_TARGET", "directConnection cannot be used with several hosts");

  let topologyHint = "standalone-or-unknown";
  if (scheme === "mongodb+srv") topologyHint = "dns-seedlist";
  else if (replicaSet) topologyHint = "replica-set";
  else if (hosts.length > 1) topologyHint = "multi-host";

  return {
    scheme,
    hosts: [...hosts].sort(),
    database,
    replicaSet,
    topologyHint,
    credentialsPresent,
  };
}

/** Deterministic fingerprint of a connection identity (never of credentials). */
export function targetFingerprint({ scheme, hosts, database, replicaSet }) {
  return digestOf({ v: TARGET_FINGERPRINT_VERSION, scheme, hosts: [...hosts].sort(), database, replicaSet: replicaSet ?? null });
}

const shortFp = (s) => sha256Hex(`${TARGET_FINGERPRINT_VERSION}:${s}`).slice(0, 12);

/** Signals that a target looks like production, whatever it is declared as. */
export function productionSignals(observed) {
  const signals = [];
  if (observed.scheme === "mongodb+srv") signals.push("dns-seedlist connection (typical of managed clusters)");
  if (observed.hosts.some((h) => hostCategory(h.replace(/:\d+$/, "")) === "managed-cloud")) signals.push("managed cloud database host");
  if (PRODUCTION_NAME_RE.test(observed.database)) signals.push("database name looks like production");
  if (observed.replicaSet && PRODUCTION_NAME_RE.test(observed.replicaSet)) signals.push("replica set name looks like production");
  return signals;
}

/** Validate a profiles registry document. Profiles never hold credentials. */
export function validateProfiles(doc) {
  if (!isPlainObject(doc)) fail("INVALID_PROFILES", "profiles registry must be a JSON object");
  if (doc.schemaVersion !== PROFILES_SCHEMA_VERSION) fail("INVALID_PROFILES", `profiles registry schemaVersion must be "${PROFILES_SCHEMA_VERSION}"`);
  if (!Array.isArray(doc.profiles) || doc.profiles.length === 0) fail("INVALID_PROFILES", "profiles registry has no profiles");
  if (findSecrets(doc).length) fail("INVALID_PROFILES", "profiles registry must not contain credentials or connection strings");
  const aliases = [];
  const profiles = doc.profiles.map((p, i) => {
    const where = `profile #${i + 1}`;
    if (!isPlainObject(p)) fail("INVALID_PROFILES", `${where} must be an object`);
    const extra = Object.keys(p).filter((k) => !["alias", "class", "connection", "operations", "description"].includes(k));
    if (extra.length) fail("INVALID_PROFILES", `${where} has unsupported fields`);
    if (typeof p.alias !== "string" || !ALIAS_RE.test(p.alias)) fail("INVALID_PROFILES", `${where} has an invalid alias`);
    if (!Object.hasOwn(PROFILE_CLASSES, p.class)) fail("INVALID_PROFILES", `${where} has an unknown class`);
    const c = p.connection;
    if (!isPlainObject(c)) fail("INVALID_PROFILES", `${where} has no expected connection identity`);
    if (!SUPPORTED_SCHEMES.has(c.scheme)) fail("INVALID_PROFILES", `${where} has an unsupported scheme`);
    if (!Array.isArray(c.hosts) || c.hosts.length === 0) fail("INVALID_PROFILES", `${where} must list its hosts`);
    const hosts = c.hosts.map((h) => normaliseHost(h, c.scheme));
    if (duplicates(hosts).length) fail("INVALID_PROFILES", `${where} lists a host twice`);
    if (typeof c.database !== "string" || !DB_NAME_RE.test(c.database)) fail("INVALID_PROFILES", `${where} must name its database`);
    const replicaSet = c.replicaSet ?? null;
    if (replicaSet !== null && (typeof replicaSet !== "string" || !/^[A-Za-z0-9_.-]{1,64}$/.test(replicaSet))) fail("INVALID_PROFILES", `${where} has an invalid replica set`);
    const ops = p.operations ?? [];
    if (!Array.isArray(ops) || ops.some((o) => !Object.hasOwn(OPERATIONS, o))) fail("INVALID_PROFILES", `${where} lists an unknown operation`);
    aliases.push(p.alias);
    return { alias: p.alias, class: p.class, connection: { scheme: c.scheme, hosts: [...hosts].sort(), database: c.database, replicaSet }, operations: [...new Set(ops)] };
  });
  if (duplicates(aliases).length) fail("INVALID_PROFILES", "profiles registry repeats an alias");
  return profiles;
}

/**
 * Resolve the declared profile against the observed connection identity.
 * Returns a sanitized identity object, or throws a LifecycleError.
 */
export function resolveTarget({ profiles, alias, uri, role = "target" }) {
  if (!alias) fail("MISSING_PROFILE", "no target profile was declared (--profile)");
  if (!Array.isArray(profiles)) fail("MISSING_PROFILE", "no profiles registry was supplied (--profiles)");
  const profile = profiles.find((p) => p.alias === alias);
  if (!profile) fail("UNKNOWN_PROFILE", "the declared profile is not in the profiles registry");
  const cls = PROFILE_CLASSES[profile.class];
  if (!cls.supportedInD1) {
    fail(
      "UNSUPPORTED_PROFILE",
      profile.class === "production"
        ? "production profiles are never eligible for lifecycle operations in R5-D1"
        : `profile class "${profile.class}" is not supported in R5-D1 (only local and disposable)`
    );
  }

  const observed = parseConnectionString(uri);
  const expected = profile.connection;
  const mismatches = [];
  if (observed.scheme !== expected.scheme) mismatches.push("scheme");
  if (observed.hosts.join(",") !== expected.hosts.join(",")) mismatches.push("hosts");
  if (observed.database !== expected.database) mismatches.push("database");
  if ((observed.replicaSet ?? null) !== (expected.replicaSet ?? null)) mismatches.push("replicaSet");
  if (mismatches.length) fail("PROFILE_MISMATCH", `the connection does not match the declared profile (${mismatches.join(", ")})`);

  const signals = productionSignals(observed);
  if (signals.length) fail("PRODUCTION_LIKE_TARGET", `the target looks like production (${signals.join("; ")}); refused`);
  if (cls.loopbackOnly && observed.hosts.some((h) => hostCategory(h.replace(/:\d+$/, "")) !== "loopback")) {
    fail("PROFILE_MISMATCH", `a ${profile.class} profile must point only at loopback hosts`);
  }

  const fingerprint = targetFingerprint(observed);
  return {
    role,
    profile: { alias: profile.alias, class: profile.class },
    observed: {
      scheme: observed.scheme,
      topologyHint: observed.topologyHint,
      hostCount: observed.hosts.length,
      hosts: observed.hosts.map((h) => ({ category: hostCategory(h.replace(/:\d+$/, "")), fingerprint: shortFp(h) })),
      databaseFingerprint: shortFp(`db:${observed.database}`),
      replicaSetDeclared: observed.replicaSet !== null,
      credentialsPresent: observed.credentialsPresent,
    },
    // Kept off the default output; printed only when explicitly requested.
    restricted: { database: observed.database },
    fingerprint,
    allowedOperations: profile.operations.filter(permittedOperation),
    writeCapable: profile.operations.some((o) => permittedOperation(o) && OPERATIONS[o] !== "read"),
  };
}

/** Refuse any operation the lifecycle tooling does not provide. */
export function authorizeOperation(identity, operation) {
  const opClass = OPERATIONS[operation];
  if (!opClass) fail("UNSUPPORTED_OPERATION", "operation is not provided by the lifecycle tooling");
  if (!permittedOperation(operation)) fail("UNSUPPORTED_OPERATION", "only read operations and the named restore-verify operation exist");
  if (!identity || !identity.fingerprint) fail("MISSING_TARGET", "operation needs a resolved target identity");
  if (!identity.allowedOperations.includes(operation)) fail("OPERATION_NOT_ALLOWED", "the declared profile does not allow this operation");
  return true;
}

/** For later phases (source/destination): true when both are the same target. */
export const sameTarget = (a, b) => Boolean(a?.fingerprint) && a.fingerprint === b?.fingerprint;

/** The identity without restricted fields, for printing. */
export function publicIdentity(identity, { includeDatabaseName = false } = {}) {
  const { restricted, ...rest } = identity;
  return includeDatabaseName ? { ...rest, database: restricted.database } : rest;
}
