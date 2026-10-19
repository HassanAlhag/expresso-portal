import "./setup-env.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const guard = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/scripts/_guard.js");
const run = (uri, args = []) =>
  spawnSync(process.execPath, ["--input-type=module", "-e", `import { assertSafeTarget } from ${JSON.stringify(guard)}; assertSafeTarget(); console.log("ran");`, "--", ...args], {
    env: { ...process.env, MONGO_URI: uri },
    encoding: "utf8",
  });

test("scripts refuse a remote database without --allow-remote", () => {
  const r = run("mongodb+srv://user:pass@cluster0.example.mongodb.net/db");
  assert.equal(r.status, 2);
  assert.doesNotMatch(r.stdout, /ran/);
});

test("scripts run against a local database", () => {
  const r = run("mongodb://127.0.0.1:27017/expresso");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /ran/);
});
