import { test } from "node:test";
import assert from "node:assert/strict";
import { validateManifest, sealManifest, computeSeal, STATUS } from "../../src/scripts/lifecycle/manifest.js";
import { manifestBody } from "./fixtures.js";

const sealed = (mutate = () => {}) => {
  const m = manifestBody();
  mutate(m);
  return sealManifest(m);
};
const rules = (r) => r.errors.map((e) => `${e.path}: ${e.rule}`).join("\n");

test("a well-formed supported manifest is VALID but never 'verified'", () => {
  const r = validateManifest(sealed());
  assert.equal(r.status, STATUS.VALID, rules(r));
  assert.equal(r.verified, false);
  assert.match(r.digest, /^[0-9a-f]{64}$/);
});

test("an unsupported schema version is reported as such", () => {
  const r = validateManifest(sealed((m) => (m.schemaVersion = "expresso.lifecycle.manifest/99")));
  assert.equal(r.status, STATUS.UNSUPPORTED_VERSION);
});

test("missing required fields are INVALID", () => {
  for (const k of ["operationId", "source", "time", "application", "database", "objectStorage", "artifacts", "completion"]) {
    const r = validateManifest(sealed((m) => delete m[k]));
    assert.equal(r.status, STATUS.INVALID, k);
  }
  assert.equal(validateManifest(sealed((m) => delete m.schemaVersion)).status, STATUS.INVALID);
  assert.equal(validateManifest(null).status, STATUS.INVALID);
  const unsealed = manifestBody();
  assert.equal(validateManifest(unsealed).status, STATUS.INVALID);
});

test("invalid timestamps (format, calendar, order) are INVALID", () => {
  for (const ts of ["2026-10-27 08:00:00", "2026-10-27T08:00:00+04:00", "2026-02-31T00:00:00Z", "yesterday"]) {
    assert.equal(validateManifest(sealed((m) => (m.time.startedAt = ts))).status, STATUS.INVALID, ts);
  }
  assert.equal(validateManifest(sealed((m) => (m.time.completedAt = "2026-10-27T07:00:00Z"))).status, STATUS.INVALID);
});

test("invalid checksums and digests are INVALID", () => {
  assert.equal(validateManifest(sealed((m) => (m.artifacts[0].sha256 = "ABC"))).status, STATUS.INVALID);
  assert.equal(validateManifest(sealed((m) => (m.artifacts[0].sha256 = "A".repeat(64)))).status, STATUS.INVALID);
  assert.equal(validateManifest(sealed((m) => (m.source.fingerprint = "1234"))).status, STATUS.INVALID);
  assert.equal(validateManifest(sealed((m) => (m.application.gitCommit = "abc123"))).status, STATUS.INVALID);
});

test("artifact paths and object keys cannot traverse or be absolute", () => {
  for (const p of ["../outside.gz", "db/../../etc/passwd", "/abs/path.gz", "C:/x.gz", "db\\users.gz", "db//x", "./db/x"]) {
    assert.equal(validateManifest(sealed((m) => (m.artifacts[0].path = p))).status, STATUS.INVALID, p);
  }
  assert.equal(validateManifest(sealed((m) => (m.objectStorage.stores[0].objects[0].key = "../secret"))).status, STATUS.INVALID);
});

test("duplicate identifiers are INVALID", () => {
  assert.equal(validateManifest(sealed((m) => m.database.collections.push({ ...m.database.collections[1] }))).status, STATUS.INVALID);
  assert.equal(validateManifest(sealed((m) => (m.artifacts[1].path = m.artifacts[0].path))).status, STATUS.INVALID);
  assert.equal(validateManifest(sealed((m) => m.database.collections[0].indexes.push({ name: "email_1", key: { other: 1 } }))).status, STATUS.INVALID);
  assert.equal(validateManifest(sealed((m) => m.objectStorage.stores.push({ ...m.objectStorage.stores[0] }))).status, STATUS.INVALID);
});

test("an honest incomplete manifest is INCOMPLETE, not VALID", () => {
  const r = validateManifest(sealed((m) => {
    m.completion.state = "incomplete";
    m.completion.completedComponents = ["database", "application-metadata"];
    m.time.completedAt = null;
  }));
  assert.equal(r.status, STATUS.INCOMPLETE, rules(r));
  const failed = validateManifest(sealed((m) => {
    m.completion.state = "failed";
    m.completion.completedComponents = ["database"];
    m.completion.failures = [{ component: "object-storage-public", category: "connectivity" }];
  }));
  assert.equal(failed.status, STATUS.INCOMPLETE, rules(failed));
});

test("impossible completion states are INVALID", () => {
  // claims complete with a missing component
  assert.equal(validateManifest(sealed((m) => (m.completion.completedComponents = ["database"]))).status, STATUS.INVALID);
  // complete with failures
  assert.equal(validateManifest(sealed((m) => (m.completion.failures = [{ component: "database", category: "integrity" }]))).status, STATUS.INVALID);
  // failed without a failure
  assert.equal(validateManifest(sealed((m) => (m.completion.state = "failed"))).status, STATUS.INVALID);
  // completed but not required
  assert.equal(validateManifest(sealed((m) => (m.completion.requiredComponents = ["database"]))).status, STATUS.INVALID);
  // completed without an artifact
  assert.equal(validateManifest(sealed((m) => (m.artifacts = [m.artifacts[1]]))).status, STATUS.INVALID);
  // both completed and excluded
  assert.equal(validateManifest(sealed((m) => (m.completion.exclusions = [{ component: "database", reason: "x" }]))).status, STATUS.INVALID);
  // complete with no completion time
  assert.equal(validateManifest(sealed((m) => (m.time.completedAt = null))).status, STATUS.INVALID);
});

test("an altered manifest no longer matches its sealed digest", () => {
  const m = sealed();
  m.database.collections[0].count = 4;
  const r = validateManifest(m);
  assert.equal(r.status, STATUS.INVALID);
  assert.ok(r.errors.some((e) => e.path === "seal.digest"));
  assert.equal(computeSeal(sealed()), sealed().seal.digest);
});

test("secret-like fields and values are prohibited; errors never echo them", () => {
  const cases = [
    (m) => (m.source.password = "hunter2"),
    (m) => (m.database.collections[0].options.connectionString = "x"),
    (m) => (m.completion.exclusions = [{ component: "application-metadata", reason: "mongodb://u:p@db.example/x" }]),
    (m) => (m.artifacts[0].encryption = { scheme: "age", keyRef: "AKIAABCDEFGHIJKLMNOP" }),
    (m) => (m.objectStorage.stores[0].namespace = "bucket?X-Amz-Signature=abc"),
    (m) => (m.artifacts[0].encryption.secretKey = "abc"),
  ];
  for (const c of cases) {
    const r = validateManifest(sealed(c));
    assert.equal(r.status, STATUS.INVALID);
    assert.doesNotMatch(JSON.stringify(r), /hunter2|u:p@|AKIAABCDEFGHIJKLMNOP|X-Amz-Signature=abc/);
  }
  // An index on a field named like a credential is metadata, not a secret.
  assert.equal(validateManifest(sealed()).status, STATUS.VALID);
});

test("exclusions and a dirty tree are warnings, not silent", () => {
  const r = validateManifest(sealed((m) => {
    m.application.dirty = true;
    m.completion.completedComponents = ["database", "application-metadata"];
    m.completion.exclusions = [{ component: "object-storage-public", reason: "local fixture has no public store" }];
  }));
  assert.equal(r.status, STATUS.VALID, rules(r));
  assert.equal(r.warnings.length, 2);
});
