import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, symlinkSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { appendEvidence, verifyEvidence, evidencePath, validateEvent, DEFAULT_EVIDENCE_FILE } from "../../src/scripts/lifecycle/evidence.js";
import { REPO_ROOT } from "../../src/scripts/lifecycle/catalog.js";

let dir;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "lifecycle-evidence-test-")); // owned, disposable
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const event = (over = {}) => ({
  operationId: "op-20261027-0001",
  eventType: "backup.started",
  targetFingerprint: "a".repeat(64),
  operator: "hassan",
  toolVersion: "r5-d1.1",
  result: "started",
  ...over,
});
let tick = 0;
const clock = () => new Date(Date.UTC(2026, 9, 27, 9, 0, tick++));
const file = () => path.join(dir, DEFAULT_EVIDENCE_FILE);

test("append creates the file and writes one sealed record", () => {
  tick = 0;
  const rec = appendEvidence({ dir, event: event(), now: clock });
  assert.equal(rec.sequence, 1);
  assert.equal(rec.prevDigest, null);
  assert.equal(rec.timestamp, "2026-10-27T09:00:00.000Z");
  assert.match(rec.digest, /^[0-9a-f]{64}$/);
  const lines = readFileSync(file(), "utf8").trim().split("\n");
  assert.equal(lines.length, 1);
  assert.equal((statSync(file()).mode & 0o777).toString(8), "600");
});

test("multiple appends chain and preserve earlier records byte for byte", () => {
  tick = 0;
  appendEvidence({ dir, event: event(), now: clock });
  const before = readFileSync(file(), "utf8");
  appendEvidence({ dir, event: event({ eventType: "backup.completed", result: "succeeded", digests: { manifest: "b".repeat(64) }, counts: { users: 3 } }), now: clock });
  appendEvidence({ dir, event: event({ eventType: "backup.failed", result: "failed", failureCategory: "connectivity" }), now: clock });
  const after = readFileSync(file(), "utf8");
  assert.ok(after.startsWith(before), "earlier bytes unchanged");
  const v = verifyEvidence(file());
  assert.equal(v.records, 3);
  assert.equal(v.ok, true);
  const recs = after.trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(recs[1].prevDigest, recs[0].digest);
  assert.equal(recs[2].prevDigest, recs[1].digest);
});

test("deterministic: the same clock and input produce the same records", () => {
  const dir2 = mkdtempSync(path.join(tmpdir(), "lifecycle-evidence-test-"));
  try {
    tick = 0;
    const a = appendEvidence({ dir, event: event(), now: clock });
    tick = 0;
    const b = appendEvidence({ dir: dir2, event: event(), now: clock });
    assert.deepEqual(a, b);
  } finally {
    rmSync(dir2, { recursive: true, force: true });
  }
});

test("malformed events are rejected and nothing is written", () => {
  const bad = [
    event({ eventType: "reset.executed", result: "started" }), // result does not fit
    event({ eventType: "db.drop" }),
    event({ operationId: "x" }),
    event({ targetFingerprint: "abc" }),
    event({ eventType: "backup.failed", result: "failed" }), // no failure category
    event({ failureCategory: "timeout" }), // category on a non-failure
    event({ counts: { users: -1 } }),
    event({ extra: 1 }),
    null,
  ];
  for (const e of bad) assert.throws(() => appendEvidence({ dir, event: e, now: clock }), /event|object/);
  assert.throws(() => readFileSync(file()), /ENOENT/);
});

test("secrets are rejected, never recorded", () => {
  for (const e of [
    event({ operator: "u:p@db" }),
    event({ counts: { password: 1 } }),
    { ...event(), eventType: "backup.failed", result: "failed", failureCategory: "unknown", digests: { manifest: "c".repeat(64) }, toolVersion: "Bearer abcdefghijkl" },
  ]) {
    assert.throws(() => appendEvidence({ dir, event: e, now: clock }));
  }
  assert.throws(() => validateEvent({ ...event(), mongoUri: "mongodb://u:p@h/db" }), /unsupported field|secret/);
});

test("path traversal and unsafe locations are rejected", () => {
  for (const f of ["../escape.jsonl", "sub/dir.jsonl", "evidence.json", ".hidden.jsonl", "/abs.jsonl"]) {
    assert.throws(() => evidencePath(dir, f), /plain \.jsonl/);
  }
  assert.throws(() => evidencePath("relative/dir"), /absolute/);
  assert.throws(() => evidencePath(path.join(REPO_ROOT, "tmp-evidence")), /outside the repository/);
  const link = path.join(dir, "link.jsonl");
  symlinkSync(path.join(dir, "elsewhere.jsonl"), link);
  assert.throws(() => appendEvidence({ dir, file: "link.jsonl", event: event(), now: clock }), /symbolic/);
});

test("a tampered evidence file is detected and further appends are refused", () => {
  tick = 0;
  appendEvidence({ dir, event: event(), now: clock });
  appendEvidence({ dir, event: event({ eventType: "backup.completed", result: "succeeded" }), now: clock });
  const lines = readFileSync(file(), "utf8").trim().split("\n");
  const edited = JSON.parse(lines[0]);
  edited.operator = "someone-else";
  writeFileSync(file(), `${JSON.stringify(edited)}\n${lines[1]}\n`);
  const v = verifyEvidence(file());
  assert.equal(v.ok, false);
  assert.throws(() => appendEvidence({ dir, event: event(), now: clock }), /does not verify/);
});
