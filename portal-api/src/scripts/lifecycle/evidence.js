// R5-D1 — append-only lifecycle evidence (format + safe append only).
//
// Lifecycle evidence is NOT the application's Audit collection and never
// lives in the database being operated on: it is a JSON-lines file in an
// explicit, operator-chosen directory outside it. R5-D1 executes no backup,
// restore, reset or seed; it only defines the record format and the safe
// append mechanism later phases will use.
//
// Each record carries `prevDigest` (the previous record's digest) and its own
// `digest`, forming a hash chain. The chain is TAMPER EVIDENCE only: it lets
// a reader detect edited, removed or reordered records. It does not make the
// file immutable; filesystem permissions and off-host copies are separate.

import { mkdirSync, openSync, writeSync, closeSync, fsyncSync, lstatSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { constants } from "node:fs";
import {
  LifecycleError, EXIT, isPlainObject, isSha256, isUtcTimestamp, findSecrets, digestOf, resolveInside, OPERATION_ID_RE,
} from "./common.js";
import { FAILURE_CATEGORIES } from "./manifest.js";
import { REPO_ROOT } from "./catalog.js";

export const EVIDENCE_SCHEMA_VERSION = "expresso.lifecycle.evidence/1";
export const DEFAULT_EVIDENCE_FILE = "lifecycle-evidence.jsonl";

// Event type → allowed results.
export const EVENT_TYPES = Object.freeze({
  "backup.started": ["started"],
  "backup.completed": ["succeeded"],
  "backup.failed": ["failed"],
  "restore.started": ["started"],
  "restore.completed": ["succeeded"],
  "restore.failed": ["failed"],
  "verification.completed": ["succeeded", "failed"],
  "reset.planned": ["planned"],
  "reset.executed": ["succeeded"],
  "reset.failed": ["failed"],
  "seed.planned": ["planned"],
  "seed.executed": ["succeeded"],
  "seed.failed": ["failed"],
});

const EVENT_FIELDS = ["operationId", "eventType", "targetFingerprint", "digests", "operator", "toolVersion", "result", "counts", "failureCategory"];
const DIGEST_KINDS = ["manifest", "backup", "plan"];

const bad = (msg) => {
  throw new LifecycleError("INVALID_EVENT", msg, EXIT.VALIDATION_FAILURE);
};

/** Validate an event supplied by a caller (before timestamp/chain fields). */
export function validateEvent(event) {
  if (!isPlainObject(event)) bad("event must be an object");
  for (const k of Object.keys(event)) if (!EVENT_FIELDS.includes(k)) bad(`event has an unsupported field (${k})`);
  if (findSecrets(event).length) bad("event contains secret-like content; secrets are never recorded");
  if (!OPERATION_ID_RE.test(String(event.operationId ?? ""))) bad("event operationId is invalid");
  if (!Object.hasOwn(EVENT_TYPES, event.eventType)) bad("event type is not supported");
  if (!isSha256(event.targetFingerprint)) bad("event targetFingerprint must be a sha256 hex digest");
  if (event.digests !== undefined) {
    if (!isPlainObject(event.digests)) bad("event digests must be an object");
    for (const [k, v] of Object.entries(event.digests)) {
      if (!DIGEST_KINDS.includes(k)) bad("event digests has an unsupported kind");
      if (!isSha256(v)) bad("event digests must be sha256 hex digests");
    }
  }
  if (typeof event.operator !== "string" || !/^[A-Za-z0-9._@-]{1,64}$/.test(event.operator)) bad("event operator identifier is invalid");
  if (typeof event.toolVersion !== "string" || !/^[A-Za-z0-9._+-]{1,64}$/.test(event.toolVersion)) bad("event toolVersion is invalid");
  if (!EVENT_TYPES[event.eventType].includes(event.result)) bad("event result does not fit the event type");
  if (event.counts !== undefined) {
    if (!isPlainObject(event.counts)) bad("event counts must be an object");
    for (const [k, v] of Object.entries(event.counts)) {
      if (!/^[A-Za-z0-9_.-]{1,120}$/.test(k) || !Number.isInteger(v) || v < 0) bad("event counts must map names to non-negative integers");
    }
  }
  const failed = event.result === "failed";
  if (failed && !FAILURE_CATEGORIES.includes(event.failureCategory)) bad("a failed event needs a sanitized failureCategory");
  if (!failed && event.failureCategory !== undefined) bad("only failed events carry a failureCategory");
  return event;
}

/** Resolve the evidence file: an absolute directory plus a plain file name. */
export function evidencePath(dir, file = DEFAULT_EVIDENCE_FILE) {
  if (typeof dir !== "string" || !path.isAbsolute(dir)) throw new LifecycleError("PATH_TRAVERSAL", "evidence directory must be an explicit absolute path");
  if (typeof file !== "string" || !/^[a-z0-9][a-z0-9._-]{0,100}\.jsonl$/.test(file)) throw new LifecycleError("PATH_TRAVERSAL", "evidence file must be a plain .jsonl file name");
  const resolvedDir = path.resolve(dir);
  // Keep evidence out of the repository so it is never committed by accident.
  if (resolvedDir === REPO_ROOT || resolvedDir.startsWith(REPO_ROOT + path.sep)) {
    throw new LifecycleError("EVIDENCE_UNSAFE", "evidence directory must be outside the repository", EXIT.VALIDATION_FAILURE);
  }
  return resolveInside(resolvedDir, file);
}

function readRecords(file) {
  if (!existsSync(file)) return [];
  const text = readFileSync(file, "utf8");
  if (text.length && !text.endsWith("\n")) throw new LifecycleError("EVIDENCE_CORRUPT", "evidence file does not end with a complete record", EXIT.VALIDATION_FAILURE);
  return text.split("\n").filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      throw new LifecycleError("EVIDENCE_CORRUPT", "evidence file contains an unreadable record", EXIT.VALIDATION_FAILURE);
    }
  });
}

/** Check the hash chain of an evidence file. Returns { records, ok, problems }. */
export function verifyEvidence(file) {
  const records = readRecords(file);
  const problems = [];
  let prev = null;
  records.forEach((r, i) => {
    const { digest, ...body } = r;
    if (r.schemaVersion !== EVIDENCE_SCHEMA_VERSION) problems.push({ index: i, problem: "unsupported schema version" });
    if (r.sequence !== i + 1) problems.push({ index: i, problem: "sequence gap or reorder" });
    if (r.prevDigest !== prev) problems.push({ index: i, problem: "chain break (prevDigest)" });
    if (digest !== digestOf(body)) problems.push({ index: i, problem: "record digest mismatch (edited record)" });
    prev = digest;
  });
  return { records: records.length, ok: problems.length === 0, problems, lastDigest: prev };
}

/**
 * Append one validated event. Creates the directory (0700) and file (0600)
 * when missing, refuses symlinks, refuses to append to a file whose chain
 * does not verify, and never rewrites earlier records.
 * `now` is injectable for deterministic tests.
 */
export function appendEvidence({ dir, file = DEFAULT_EVIDENCE_FILE, event, now = () => new Date() }) {
  validateEvent(event);
  const target = evidencePath(dir, file);
  mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  for (const p of [path.dirname(target), target]) {
    if (existsSync(p) && lstatSync(p).isSymbolicLink()) throw new LifecycleError("EVIDENCE_UNSAFE", "evidence paths must not be symbolic links", EXIT.VALIDATION_FAILURE);
  }
  const state = verifyEvidence(target);
  if (!state.ok) throw new LifecycleError("EVIDENCE_TAMPERED", "existing evidence does not verify; refusing to append", EXIT.VALIDATION_FAILURE);

  const timestamp = now().toISOString();
  if (!isUtcTimestamp(timestamp)) bad("clock produced an invalid timestamp");
  const body = { schemaVersion: EVIDENCE_SCHEMA_VERSION, sequence: state.records + 1, timestamp, ...event, prevDigest: state.lastDigest };
  const record = { ...body, digest: digestOf(body) };

  // O_APPEND: the write always goes to the end; earlier bytes are never touched.
  const fd = openSync(target, constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | (constants.O_NOFOLLOW ?? 0), 0o600);
  try {
    writeSync(fd, `${JSON.stringify(record)}\n`);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  return record;
}
