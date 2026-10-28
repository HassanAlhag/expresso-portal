import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseConnectionString, validateProfiles, resolveTarget, authorizeOperation, targetFingerprint, publicIdentity, hostCategory, sameTarget,
} from "../../src/scripts/lifecycle/target.js";
import { LOCAL_URI, LOCAL_URI_WITH_CREDS, profilesDoc } from "./fixtures.js";

const profiles = validateProfiles(profilesDoc());
const code = (fn) => {
  try {
    fn();
  } catch (e) {
    return e.code;
  }
  return "NO_ERROR";
};

test("a missing profile is rejected", () => {
  assert.equal(code(() => resolveTarget({ profiles, alias: "", uri: LOCAL_URI })), "MISSING_PROFILE");
  assert.equal(code(() => resolveTarget({ profiles: undefined, alias: "local-fixture", uri: LOCAL_URI })), "MISSING_PROFILE");
  assert.equal(code(() => resolveTarget({ profiles, alias: "not-registered", uri: LOCAL_URI })), "UNKNOWN_PROFILE");
});

test("a missing or malformed connection string is rejected (never classified as local)", () => {
  assert.equal(code(() => resolveTarget({ profiles, alias: "local-fixture", uri: undefined })), "MISSING_TARGET");
  for (const bad of ["not a uri", "mongodb://", "mongodb://127.0.0.1:99999/db", "mongodb://127.0.0.1:27999/bad name", "mongodb://127.0.0.1:27999/db#frag", "mongodb://[zz::1]/db"]) {
    assert.match(code(() => parseConnectionString(bad)), /MALFORMED_TARGET|MISSING_TARGET/, bad);
  }
});

test("unsupported connection forms are rejected", () => {
  assert.equal(code(() => parseConnectionString("postgres://127.0.0.1/db")), "UNSUPPORTED_CONNECTION");
  assert.equal(code(() => parseConnectionString("http://127.0.0.1:27017/db")), "UNSUPPORTED_CONNECTION");
  assert.equal(code(() => parseConnectionString("mongodb://%2Ftmp%2Fmongodb-27017.sock/db")), "UNSUPPORTED_CONNECTION");
});

test("ambiguous identities are rejected", () => {
  assert.equal(code(() => parseConnectionString("mongodb://127.0.0.1:27999")), "AMBIGUOUS_TARGET"); // no database
  assert.equal(code(() => parseConnectionString("mongodb://127.0.0.1:27999,127.0.0.1:27999/db")), "AMBIGUOUS_TARGET");
  assert.equal(code(() => parseConnectionString("mongodb://127.0.0.1/db?replicaSet=a&replicaSet=b")), "AMBIGUOUS_TARGET");
});

test("declared/observed mismatch is rejected", () => {
  assert.equal(code(() => resolveTarget({ profiles, alias: "local-fixture", uri: "mongodb://127.0.0.1:27999/other_db?replicaSet=rs0" })), "PROFILE_MISMATCH");
  assert.equal(code(() => resolveTarget({ profiles, alias: "local-fixture", uri: "mongodb://127.0.0.1:28000/expresso_lifecycle_fixture?replicaSet=rs0" })), "PROFILE_MISMATCH");
  assert.equal(code(() => resolveTarget({ profiles, alias: "local-fixture", uri: "mongodb://127.0.0.1:27999/expresso_lifecycle_fixture" })), "PROFILE_MISMATCH");
});

test("production and staging profiles are refused; production-like targets are refused whatever they are declared as", () => {
  assert.equal(code(() => resolveTarget({ profiles, alias: "prod", uri: "mongodb+srv://cluster0.example.mongodb.net/expresso" })), "UNSUPPORTED_PROFILE");
  assert.equal(code(() => resolveTarget({ profiles, alias: "staging", uri: "mongodb+srv://staging.example.mongodb.net/expresso_staging" })), "UNSUPPORTED_PROFILE");
  assert.equal(code(() => resolveTarget({ profiles, alias: "local-prodname", uri: "mongodb://127.0.0.1:27017/expresso_prod" })), "PRODUCTION_LIKE_TARGET");
  // A local profile can never describe a remote host.
  const remote = validateProfiles({ schemaVersion: "expresso.lifecycle.profiles/1", profiles: [{ alias: "sneaky", class: "local", connection: { scheme: "mongodb", hosts: ["db.internal.example:27017"], database: "expresso_dev" }, operations: ["inventory"] }] });
  assert.equal(code(() => resolveTarget({ profiles: remote, alias: "sneaky", uri: "mongodb://db.internal.example:27017/expresso_dev" })), "PROFILE_MISMATCH");
});

test("localhost alone authorises nothing", () => {
  assert.equal(code(() => resolveTarget({ profiles: [], alias: "local-fixture", uri: LOCAL_URI })), "UNKNOWN_PROFILE");
  assert.equal(code(() => resolveTarget({ profiles, alias: undefined, uri: "mongodb://localhost/expresso_test" })), "MISSING_PROFILE");
  // A profile without the operation cannot run it, even on loopback.
  const id = resolveTarget({ profiles, alias: "local-no-ops", uri: "mongodb://127.0.0.1:27998/expresso_disposable" });
  assert.equal(code(() => authorizeOperation(id, "inventory")), "OPERATION_NOT_ALLOWED");
});

test("only read operations exist; write/destructive operations are refused", () => {
  const id = resolveTarget({ profiles, alias: "local-fixture", uri: LOCAL_URI });
  assert.equal(authorizeOperation(id, "inventory"), true);
  for (const op of ["restore", "reset", "seed", "delete"]) assert.equal(code(() => authorizeOperation(id, op)), "UNSUPPORTED_OPERATION");
  // R5-D2: backup is a read operation, allowed only when the profile lists it.
  assert.equal(code(() => authorizeOperation(id, "backup")), "OPERATION_NOT_ALLOWED");
  assert.equal(id.writeCapable, false);
  assert.deepEqual(id.allowedOperations, ["inventory"]);
  // R5-D3: restore-verify is never implied by inventory or backup.
  assert.equal(code(() => authorizeOperation(id, "restore-verify")), "OPERATION_NOT_ALLOWED");
});

test("credentials are never kept or printed", () => {
  const id = resolveTarget({ profiles, alias: "local-fixture", uri: LOCAL_URI_WITH_CREDS });
  const text = JSON.stringify(id);
  assert.doesNotMatch(text, /fixture_user|fixture-pass-123|mongodb:\/\//);
  assert.equal(id.observed.credentialsPresent, true);
  const shown = JSON.stringify(publicIdentity(id));
  assert.doesNotMatch(shown, /expresso_lifecycle_fixture|127\.0\.0\.1/); // database and host stay off default output
  assert.match(JSON.stringify(publicIdentity(id, { includeDatabaseName: true })), /expresso_lifecycle_fixture/);
  // Error messages never echo the input.
  try {
    parseConnectionString("mongodb://u:secret-pw@bad host/db");
  } catch (e) {
    assert.doesNotMatch(e.message, /secret-pw/);
  }
});

test("fingerprints are deterministic and ignore credentials and option order", () => {
  const a = resolveTarget({ profiles, alias: "local-fixture", uri: LOCAL_URI });
  const b = resolveTarget({ profiles, alias: "local-fixture", uri: LOCAL_URI_WITH_CREDS });
  assert.equal(a.fingerprint, b.fingerprint);
  assert.match(a.fingerprint, /^[0-9a-f]{64}$/);
  assert.ok(sameTarget(a, b));
  const fp1 = targetFingerprint({ scheme: "mongodb", hosts: ["127.0.0.1:2", "127.0.0.1:1"], database: "d", replicaSet: null });
  const fp2 = targetFingerprint({ scheme: "mongodb", hosts: ["127.0.0.1:1", "127.0.0.1:2"], database: "d", replicaSet: null });
  assert.equal(fp1, fp2);
  assert.notEqual(fp1, targetFingerprint({ scheme: "mongodb", hosts: ["127.0.0.1:1", "127.0.0.1:2"], database: "e", replicaSet: null }));
});

test("profiles registries are validated and may not carry credentials", () => {
  const withCreds = profilesDoc();
  withCreds.profiles[0].connection.password = "x";
  assert.equal(code(() => validateProfiles(withCreds)), "INVALID_PROFILES");
  const withUri = profilesDoc();
  withUri.profiles[0].description = "mongodb://u:p@127.0.0.1/db";
  assert.equal(code(() => validateProfiles(withUri)), "INVALID_PROFILES");
  const dup = profilesDoc();
  dup.profiles[1].alias = "local-fixture";
  assert.equal(code(() => validateProfiles(dup)), "INVALID_PROFILES");
  assert.equal(code(() => validateProfiles({ schemaVersion: "v0", profiles: [] })), "INVALID_PROFILES");
  const unknownOp = profilesDoc();
  unknownOp.profiles[0].operations = ["reset"];
  assert.equal(code(() => validateProfiles(unknownOp)), "INVALID_PROFILES");
});

test("host categories", () => {
  assert.equal(hostCategory("localhost"), "loopback");
  assert.equal(hostCategory("127.0.0.1"), "loopback");
  assert.equal(hostCategory("[::1]"), "loopback");
  assert.equal(hostCategory("10.0.0.5"), "private-network");
  assert.equal(hostCategory("cluster0.abc.mongodb.net"), "managed-cloud");
  assert.equal(hostCategory("db.example.com"), "remote");
});

test("R5-D3: restore-verify is the only write operation; it must be listed explicitly and stays local/disposable-only", async () => {
  const { OPERATIONS, NAMED_WRITE_OPERATIONS } = await import("../../src/scripts/lifecycle/target.js");
  assert.deepEqual(OPERATIONS, { inventory: "read", backup: "read", "restore-verify": "write-nonproduction" });
  assert.deepEqual(NAMED_WRITE_OPERATIONS, ["restore-verify"]);
  const doc = (cls, hosts, ops) => ({ schemaVersion: "expresso.lifecycle.profiles/1", profiles: [{ alias: "verify", class: cls, connection: { scheme: "mongodb", hosts, database: "expresso_verify", replicaSet: "rsv" }, operations: ops }] });
  const uri = (h) => `mongodb://u:p@${h}/expresso_verify?replicaSet=rsv`;
  const ok = resolveTarget({ profiles: validateProfiles(doc("disposable", ["127.0.0.1:27996"], ["restore-verify"])), alias: "verify", uri: uri("127.0.0.1:27996") });
  assert.equal(authorizeOperation(ok, "restore-verify"), true);
  assert.equal(ok.writeCapable, true);
  const backupOnly = resolveTarget({ profiles: validateProfiles(doc("disposable", ["127.0.0.1:27996"], ["backup"])), alias: "verify", uri: uri("127.0.0.1:27996") });
  assert.equal(code(() => authorizeOperation(backupOnly, "restore-verify")), "OPERATION_NOT_ALLOWED");
  assert.equal(backupOnly.writeCapable, false);
  for (const cls of ["staging", "production", "shared-development"]) {
    assert.equal(code(() => resolveTarget({ profiles: validateProfiles(doc(cls, ["127.0.0.1:27996"], ["restore-verify"])), alias: "verify", uri: uri("127.0.0.1:27996") })), "UNSUPPORTED_PROFILE");
  }
  assert.equal(code(() => resolveTarget({ profiles: validateProfiles(doc("disposable", ["10.1.2.3:27017"], ["restore-verify"])), alias: "verify", uri: uri("10.1.2.3:27017") })), "PROFILE_MISMATCH");
  for (const op of ["restore", "drop", "reset", "cleanup", "write-nonproduction"]) assert.equal(code(() => authorizeOperation(ok, op)), "UNSUPPORTED_OPERATION");
});
