// R5-D1 lifecycle safety foundation — shared, dependency-free helpers.
//
// Pure functions only: no database, storage, network or environment access.

import { createHash } from "node:crypto";
import path from "node:path";

/** Exit codes shared by the lifecycle CLI. */
export const EXIT = Object.freeze({
  OK: 0,
  INVALID_ARGS_OR_IDENTITY: 2,
  VALIDATION_FAILURE: 4,
  UNSUPPORTED_VERSION: 5,
  WARNINGS: 10,
});

/** An error whose message is safe to print (never contains input values). */
export class LifecycleError extends Error {
  constructor(code, message, exitCode = EXIT.INVALID_ARGS_OR_IDENTITY) {
    super(message);
    this.name = "LifecycleError";
    this.code = code;
    this.exitCode = exitCode;
  }
}

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
export { isPlainObject };

/** JSON with object keys sorted at every level; the basis of every digest. */
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isPlainObject(value)) {
    const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
  }
  if (typeof value === "number" && !Number.isFinite(value)) throw new LifecycleError("NON_FINITE", "non-finite number in canonical JSON");
  return JSON.stringify(value);
}

export const sha256Hex = (input) => createHash("sha256").update(input).digest("hex");
export const digestOf = (value) => sha256Hex(canonicalJson(value));

export const SHA256_RE = /^[0-9a-f]{64}$/;
export const isSha256 = (v) => typeof v === "string" && SHA256_RE.test(v);
export const GIT_COMMIT_RE = /^[0-9a-f]{40}$/;
export const OPERATION_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/;
export const ALIAS_RE = /^[a-z0-9][a-z0-9_-]{1,62}$/;

/** Strict UTC timestamp: 2026-10-27T12:00:00Z or with milliseconds. */
const UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
export function isUtcTimestamp(v) {
  if (typeof v !== "string" || !UTC_RE.test(v)) return false;
  const t = Date.parse(v);
  if (!Number.isFinite(t)) return false;
  // Reject calendar rollovers such as 2026-02-31 (Date.parse would accept them).
  return new Date(t).toISOString().slice(0, 19) === v.slice(0, 19);
}

/**
 * A relative POSIX path that stays inside its root: no absolute paths, no
 * drive letters, no backslashes, no "." / ".." segments, no empty segments,
 * no control characters.
 */
export function isSafeRelativePath(p) {
  if (typeof p !== "string" || p.length === 0 || p.length > 512) return false;
  if (/[\u0000-\u001f\\]/.test(p)) return false;
  if (p.startsWith("/") || /^[A-Za-z]:/.test(p)) return false;
  const parts = p.split("/");
  return parts.every((s) => s.length > 0 && s !== "." && s !== "..");
}

/** Resolve `name` inside `root`; throws if the result escapes `root`. */
export function resolveInside(root, name) {
  if (!isSafeRelativePath(name)) throw new LifecycleError("PATH_TRAVERSAL", "path must be a safe relative path");
  const base = path.resolve(root);
  const full = path.resolve(base, name);
  if (full !== base && !full.startsWith(base + path.sep)) throw new LifecycleError("PATH_TRAVERSAL", "path escapes its root");
  return full;
}

// Secret detection. Used to refuse (never to "clean") records that would
// carry credentials. Key names and value shapes are checked separately.
// Names that hold secrets wherever the word appears…
const SECRET_KEY_ANYWHERE_RE = /(password|passwd|secret|credential|private[-_]?key|connection[-_]?string|mongo[-_]?uri)/i;
// …and names that hold secrets when they end with the word ("tokenHash" or
// "keyRef" are references/digests, not secrets).
const SECRET_KEY_SUFFIX_RE = /(pass|token|api[-_]?key|access[-_]?key|authorization|cookie|session[-_]?id|signature)$/i;
const isSecretKey = (k) => SECRET_KEY_ANYWHERE_RE.test(k) || SECRET_KEY_SUFFIX_RE.test(k);
const SECRET_VALUE_PATTERNS = [
  ["connection string with credentials", /\b[a-z][a-z0-9+.-]*:\/\/[^\s/@:]+:[^\s/@]*@/i],
  ["mongodb connection string", /\bmongodb(\+srv)?:\/\//i],
  ["AWS access key id", /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["signed URL", /X-Amz-(Signature|Credential|Security-Token)=/i],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["bearer token", /\bBearer\s+[A-Za-z0-9._~+/-]{8,}/],
  ["JSON web token", /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/],
  ["environment assignment", /\b(JWT_SECRET|AWS_SECRET_ACCESS_KEY|SMTP_PASS(WORD)?|MONGO_URI|SUPER_ADMIN_PASSWORD)\s*=/],
];

/**
 * Walk a JSON value and report secret-like keys or values as JSON paths.
 * Findings never include the offending value. `allowKeys` lists key names
 * that are known to be safe in context (e.g. "keyRef").
 */
export function findSecrets(value, { allowKeys = [] } = {}) {
  const allow = new Set(allowKeys);
  const findings = [];
  const walk = (v, at) => {
    if (typeof v === "string") {
      for (const [label, re] of SECRET_VALUE_PATTERNS) {
        if (re.test(v)) {
          findings.push({ path: at, reason: label });
          break;
        }
      }
    } else if (Array.isArray(v)) {
      v.forEach((x, i) => walk(x, `${at}[${i}]`));
    } else if (isPlainObject(v)) {
      for (const [k, x] of Object.entries(v)) {
        const p = at ? `${at}.${k}` : k;
        if (!allow.has(k) && isSecretKey(k)) findings.push({ path: p, reason: "secret-like field name" });
        walk(x, p);
      }
    }
  };
  walk(value, "");
  return findings;
}

/** Collect duplicate values from a list. */
export function duplicates(list) {
  const seen = new Set();
  const dup = new Set();
  for (const x of list) (seen.has(x) ? dup : seen).add(x);
  return [...dup];
}
