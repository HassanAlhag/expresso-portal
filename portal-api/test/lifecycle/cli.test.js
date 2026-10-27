import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { main, TARGET_URI_ENV } from "../../src/scripts/lifecycle/cli.js";
import { buildCatalog } from "../../src/scripts/lifecycle/catalog.js";
import { sealManifest } from "../../src/scripts/lifecycle/manifest.js";
import { validateProfiles, resolveTarget } from "../../src/scripts/lifecycle/target.js";
import { LOCAL_URI, LOCAL_URI_WITH_CREDS, profilesDoc, miniInventory, miniClassification, snapshotFor, manifestBody, FIXED_NOW } from "./fixtures.js";

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/scripts/lifecycle/cli.js");
let dir;
const files = {};
const fp = resolveTarget({ profiles: validateProfiles(profilesDoc()), alias: "local-fixture", uri: LOCAL_URI }).fingerprint;

before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "lifecycle-cli-test-"));
  const put = (name, value) => {
    files[name] = path.join(dir, name);
    writeFileSync(files[name], typeof value === "string" ? value : JSON.stringify(value));
  };
  put("profiles.json", profilesDoc());
  put("snapshot.json", snapshotFor(fp, [{ name: "users", count: 2 }, { name: "invites", count: 0 }]));
  put("snapshot-unknown.json", snapshotFor(fp, [{ name: "users", count: 2 }, { name: "scratch", count: 1 }]));
  put("snapshot-other.json", snapshotFor("0".repeat(64), [{ name: "users", count: 2 }]));
  put("valid.json", sealManifest(manifestBody()));
  const altered = sealManifest(manifestBody());
  altered.database.collections[0].count = 99;
  put("altered.json", altered);
  const future = sealManifest({ ...manifestBody(), schemaVersion: "expresso.lifecycle.manifest/2" });
  put("future.json", future);
  const inc = manifestBody();
  inc.completion.state = "incomplete";
  inc.completion.completedComponents = ["database"];
  inc.time.completedAt = null;
  put("incomplete.json", sealManifest(inc));
  const secret = manifestBody();
  secret.completion.exclusions = [{ component: "application-metadata", reason: "mongodb://admin:Sup3rS3cret@prod.example.net/expresso" }];
  secret.completion.completedComponents = ["database", "object-storage-public"];
  put("secret.json", sealManifest(secret));
  put("garbage.json", "{not json");
});
after(() => rmSync(dir, { recursive: true, force: true }));

/** Run main() in-process with injected, deterministic dependencies. */
async function run(argv, env = {}) {
  let out = "";
  let err = "";
  const code = await main(argv, {
    env,
    stdout: (s) => (out += s),
    stderr: (s) => (err += s),
    now: FIXED_NOW,
    loadCatalog: () => buildCatalog({ inventory: miniInventory(), classification: miniClassification() }),
    application: () => ({ gitCommit: "f".repeat(40), dirty: false, toolVersion: "r5-d1.1" }),
  });
  return { code, out, err };
}
const inv = (extra = [], env = { [TARGET_URI_ENV]: LOCAL_URI_WITH_CREDS }) =>
  run(["inventory", "--profiles", files["profiles.json"], "--profile", "local-fixture", ...extra], env);

test("inventory happy path from a captured snapshot: exit 0, sanitized JSON", async () => {
  const r = await inv(["--observed", files["snapshot.json"]]);
  assert.equal(r.code, 0, r.err);
  const report = JSON.parse(r.out);
  assert.equal(report.mode, "observed-snapshot");
  assert.equal(report.summary.present, 2);
  assert.equal(report.target.fingerprint, fp);
  assert.doesNotMatch(r.out + r.err, /fixture_user|fixture-pass-123|mongodb:\/\/|expresso_lifecycle_fixture/);
});

test("database name is printed only on request", async () => {
  const r = await inv(["--observed", files["snapshot.json"], "--include-database-name"]);
  assert.equal(r.code, 0);
  assert.equal(JSON.parse(r.out).target.database, "expresso_lifecycle_fixture");
  assert.doesNotMatch(r.out, /fixture-pass-123/);
});

test("unknown collections complete with warnings (exit 10)", async () => {
  const r = await inv(["--observed", files["snapshot-unknown.json"]]);
  assert.equal(r.code, 10);
  assert.equal(JSON.parse(r.out).summary.unknown, 1);
});

test("catalog-only inventory needs no target", async () => {
  const r = await run(["inventory", "--catalog-only"]);
  assert.equal(r.code, 0, r.err);
  assert.equal(JSON.parse(r.out).mode, "catalog-only");
  assert.equal((await run(["inventory", "--catalog-only", "--profile", "x"])).code, 2);
});

test("bad targets exit 2 with a sanitized message", async () => {
  const cases = [
    [inv(["--observed", files["snapshot.json"]], {}), /MISSING_TARGET/],
    [inv(["--observed", files["snapshot.json"]], { [TARGET_URI_ENV]: "mongodb://admin:Sup3rS3cret@127.0.0.1:27999/other?replicaSet=rs0" }), /PROFILE_MISMATCH/],
    [run(["inventory", "--profiles", files["profiles.json"], "--profile", "prod", "--observed", files["snapshot.json"]], { [TARGET_URI_ENV]: "mongodb+srv://admin:Sup3rS3cret@cluster0.example.mongodb.net/expresso" }), /UNSUPPORTED_PROFILE/],
    [run(["inventory", "--profile", "local-fixture"], { [TARGET_URI_ENV]: LOCAL_URI }), /MISSING_PROFILE/],
    [inv(["--observed", files["snapshot.json"]], { [TARGET_URI_ENV]: "mongodb://admin:Sup3rS3cret@bad host/db" }), /MALFORMED_TARGET/],
    [inv(["--observed", files["snapshot-other.json"]]), /different target/],
    [inv([]), /does not connect to databases/],
  ];
  for (const [p, re] of cases) {
    const r = await p;
    assert.equal(r.code, 2, r.err);
    assert.match(r.err, re);
    assert.equal(r.out, "");
    assert.doesNotMatch(r.err, /Sup3rS3cret|admin:|mongodb:\/\//);
  }
});

test("MONGO_URI is never used as a target", async () => {
  const r = await inv(["--observed", files["snapshot.json"]], { MONGO_URI: LOCAL_URI });
  assert.equal(r.code, 2);
  assert.match(r.err, /MISSING_TARGET/);
});

test("unsupported operations and options are refused (exit 2)", async () => {
  for (const argv of [["backup"], ["restore"], ["reset"], ["seed"], ["drop"], ["frobnicate"], ["inventory", "--force-production"], ["inventory", "--yes-i-know"], ["inventory", "--allow-production"], ["manifest-check", "--manifest"]]) {
    const r = await run(argv);
    assert.equal(r.code, 2, argv.join(" "));
    assert.equal(r.out, "");
  }
});

test("manifest-check exit semantics: valid 0, invalid 4, incomplete 4, unsupported 5", async () => {
  const check = (name) => run(["manifest-check", "--manifest", files[name]]);
  const valid = await check("valid.json");
  assert.equal(valid.code, 0, valid.out);
  assert.equal(JSON.parse(valid.out).verified, false);
  assert.match(JSON.parse(valid.out).note, /not a verified backup/);
  assert.equal((await check("altered.json")).code, 4);
  assert.equal(JSON.parse((await check("incomplete.json")).out).status, "INCOMPLETE");
  assert.equal((await check("incomplete.json")).code, 4);
  assert.equal((await check("future.json")).code, 5);
  assert.equal((await check("garbage.json")).code, 4);
  assert.equal((await run(["manifest-check", "--manifest", path.join(dir, "missing.json")])).code, 4);
});

test("manifest-check never echoes secret values", async () => {
  const r = await run(["manifest-check", "--manifest", files["secret.json"]]);
  assert.equal(r.code, 4);
  assert.doesNotMatch(r.out + r.err, /Sup3rS3cret|admin:|prod\.example\.net/);
});

test("as a real process: help, manifest-check and refusal exit codes; nothing loaded from .env", () => {
  const env = { PATH: process.env.PATH, MONGO_URI: "mongodb://should-not-be-used.example/x" };
  const sh = (args) => spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", env });
  assert.equal(sh(["--help"]).status, 0);
  assert.equal(sh(["manifest-check", "--manifest", files["valid.json"]]).status, 0);
  assert.equal(sh(["manifest-check", "--manifest", files["future.json"]]).status, 5);
  const reset = sh(["reset"]);
  assert.equal(reset.status, 2);
  assert.match(reset.stderr, /not provided by R5-D1/);
  const inv2 = sh(["inventory", "--profiles", files["profiles.json"], "--profile", "local-fixture", "--observed", files["snapshot.json"]]);
  assert.equal(inv2.status, 2);
  assert.match(inv2.stderr, /MISSING_TARGET/);
  assert.doesNotMatch(inv2.stderr + inv2.stdout, /should-not-be-used/);
});
