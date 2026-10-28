// Real child-process regression: reduce synthetic credential checks to booleans.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { gitApplicationInfo } from "../../src/scripts/lifecycle/cli.js";

const CLI = new URL("../../src/scripts/lifecycle/cli.js", import.meta.url).href;
const URI = "mongodb://synthetic_reader:synthetic_password@127.0.0.1:27999/synthetic_test";
const SECRET = "synthetic-secret-sentinel";
const run = (env) => spawnSync(process.execPath, ["--input-type=module", "-e", `import { gitApplicationInfo } from ${JSON.stringify(CLI)}; process.stdout.write(JSON.stringify(gitApplicationInfo()));`], { encoding: "utf8", env });

test("every lifecycle git child receives PATH only; URI and arbitrary parent secrets never reach it", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lifecycle-git-env-"));
  const log = path.join(dir, "observations.jsonl");
  try {
    writeFileSync(path.join(dir, "git"), `#!${process.execPath}
const fs = require("node:fs");
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ keys: Object.keys(process.env).sort(), uriPresent: Object.hasOwn(process.env, "LIFECYCLE_TARGET_URI"), secretPresent: Object.hasOwn(process.env, "TEST_SECRET"), credentialBytesPresent: Object.values(process.env).some(v => v.includes("synthetic_password") || v.includes("synthetic-secret-sentinel")) }) + "\\n");
if (process.argv.includes("rev-parse")) process.stdout.write("${"f".repeat(40)}\\n");
`, { mode: 0o700 });
    const r = run({ PATH: dir, LIFECYCLE_TARGET_URI: URI, TEST_SECRET: SECRET, GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: "alias.unsafe", GIT_CONFIG_VALUE_0: SECRET });
    assert.equal(r.status, 0);
    assert.deepEqual(JSON.parse(r.stdout), { gitCommit: "f".repeat(40), dirty: false, toolVersion: "r5-d1.1" });
    const observations = readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
    assert.equal(observations.length, 2, "rev-parse and status both exercised");
    for (const o of observations) {
      // macOS/libuv may add this OS text-encoding variable at exec time.
      // The helper's explicit environment is pinned to PATH in safety.test.js.
      if (process.platform === "darwin") o.keys = o.keys.filter((k) => k !== "__CF_USER_TEXT_ENCODING");
      assert.deepEqual(o, { keys: ["PATH"], uriPresent: false, secretPresent: false, credentialBytesPresent: false });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("git metadata collection still works with a real git executable and PATH alone", () => {
  const expected = gitApplicationInfo();
  assert.match(expected.gitCommit, /^[0-9a-f]{40}$/);
  assert.equal(typeof expected.dirty, "boolean");
  const r = run({ PATH: process.env.PATH, LIFECYCLE_TARGET_URI: URI, TEST_SECRET: SECRET });
  assert.equal(r.status, 0);
  assert.deepEqual(JSON.parse(r.stdout), expected);
  assert.equal((r.stdout + r.stderr).includes(SECRET) || (r.stdout + r.stderr).includes("synthetic_password"), false);
});
