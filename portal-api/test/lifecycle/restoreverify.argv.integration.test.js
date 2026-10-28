// R5-D3 — process-list security test: the running mongorestore child of the
// restore-verification CLI, on two disposable local replica sets (source A,
// authentication-enabled verification target B).
//
// Opt-in and Linux-only (it reads /proc). Same variables as
// restoreverify.integration.test.js. Only the CLI's own children are inspected
// (through /proc/<cli pid>/task/*/children); argv and environment bytes are
// reduced to booleans at once and never stored, printed or written.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { MANIFEST_NAME, verifyBackupArtifact } from "../../src/scripts/lifecycle/backup.js";
import { VERIFICATION_NAME, NOT_VERIFIED_NAME, validateVerification } from "../../src/scripts/lifecycle/restoreverify.js";
import { hostCategory } from "../../src/scripts/lifecycle/target.js";
import { PIPE_DIR_PREFIX } from "../../src/scripts/lifecycle/secretpipe.js";

const E = process.env;
const A_HOST = E.LIFECYCLE_D2_TEST_HOST;
const A_RS = E.LIFECYCLE_D2_TEST_RS;
const B_HOST = E.LIFECYCLE_D3_TARGET_HOST;
const B_RS = E.LIFECYCLE_D3_TARGET_RS;
const B_ADMIN = E.LIFECYCLE_D3_TARGET_ADMIN_URI;
const DUMP = E.LIFECYCLE_MONGODUMP;
const RESTORE = E.LIFECYCLE_MONGORESTORE;
const loop = (h) => hostCategory(String(h).replace(/:\d+$/, "")) === "loopback";
const enabled = process.platform === "linux" && Boolean(A_HOST && A_RS && B_HOST && B_RS && B_ADMIN && DUMP && RESTORE) && loop(A_HOST) && loop(B_HOST) && A_HOST !== B_HOST;
const skip = enabled ? false : "Linux with two disposable local replica sets (see restoreverify.integration.test.js)";
const LIFECYCLE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/scripts/lifecycle");

const tag = randomBytes(4).toString("hex");
const SRC = `expresso_d3_argv_src_${tag}`;
const V = (n) => `expresso_d3_argv_v${n}_${tag}`;
// URI-special characters in both: : @ / # ? % & = + space and non-ASCII.
const USER = `d3:us@er/${randomBytes(3).toString("hex")}#?`;
const PASS = `p@ss:w/rd#?%&=+ é-${randomBytes(6).toString("hex")}`;
const NEEDLES = [PASS, encodeURIComponent(PASS), USER, encodeURIComponent(USER), "mongodb://", "mongodb+srv://", `@${B_HOST}`].map((s) => Buffer.from(s));
const contains = (buf) => NEEDLES.some((n) => buf.indexOf(n) !== -1);

let a;
let b;
let root;
let artifact;
let sourceHash;
const created = new Set();

before(async () => {
  if (!enabled) return;
  a = new mongoose.mongo.MongoClient(`mongodb://${A_HOST}/?directConnection=true`, { serverSelectionTimeoutMS: 8000 });
  b = new mongoose.mongo.MongoClient(B_ADMIN, { directConnection: true, serverSelectionTimeoutMS: 8000 });
  await a.connect();
  await b.connect();
  // Synthetic data, large enough that mongorestore runs for a while.
  const s = a.db(SRC);
  for (let i = 0; i < 30; i++) await s.collection("events").insertMany(Array.from({ length: 5000 }, (_, j) => ({ seq: i * 5000 + j, body: randomBytes(384).toString("base64") })), { ordered: false });
  await s.collection("events").createIndex({ seq: 1 }, { unique: true });
  await s.collection("customers").insertMany(Array.from({ length: 20 }, (_, i) => ({ companyName: `Synthetic Co ${i}` })));
  sourceHash = (await s.command({ dbHash: 1 })).md5;
  root = realpathSync(mkdtempSync(path.join(tmpdir(), "d3-argv-")));
  for (const d of ["backups", "verifications", "tmp"]) mkdirSync(path.join(root, d), { mode: 0o700 });
  writeFileSync(path.join(root, "src.json"), JSON.stringify({ schemaVersion: "expresso.lifecycle.profiles/1", profiles: [{ alias: "src-a", class: "disposable", connection: { scheme: "mongodb", hosts: [A_HOST], database: SRC, replicaSet: A_RS }, operations: ["backup"] }] }));
  const r = spawnSync(process.execPath, [path.join(LIFECYCLE, "backup.js"), "--profiles", path.join(root, "src.json"), "--profile", "src-a", "--output", path.join(root, "backups"), "--evidence-dir", path.join(root, "evidence"), "--operator", "d3-argv", "--artifact-id", "bk-d3-argv-01", "--mongodump", DUMP], {
    encoding: "utf8", env: { PATH: E.PATH, LIFECYCLE_TARGET_URI: `mongodb://${A_HOST}/${SRC}?replicaSet=${A_RS}` }, timeout: 120000,
  });
  assert.equal(r.status, 0, r.stderr);
  artifact = path.join(root, "backups", "bk-d3-argv-01");
});

after(async () => {
  if (!enabled) return;
  // Harness cleanup on the disposable servers only: what this test created.
  for (const db of created) {
    try {
      await b.db(db).command({ dropAllUsersFromDatabase: 1 });
    } catch {
      // none
    }
    await b.db(db).dropDatabase();
  }
  await a.db(SRC).dropDatabase();
  await a.close();
  await b.close();
  rmSync(root, { recursive: true, force: true });
});

async function startVerify(n) {
  const db = V(n);
  created.add(db);
  await b.db(db).command({ createUser: USER, pwd: PASS, roles: [{ role: "readWrite", db }] });
  const pf = path.join(root, `v${n}.json`);
  writeFileSync(pf, JSON.stringify({ schemaVersion: "expresso.lifecycle.profiles/1", profiles: [{ alias: "verify-b", class: "disposable", connection: { scheme: "mongodb", hosts: [B_HOST], database: db, replicaSet: B_RS }, operations: ["restore-verify"] }] }));
  const child = spawn(process.execPath, [path.join(LIFECYCLE, "restoreverify.js"), "--artifact", artifact, "--profiles", pf, "--profile", "verify-b", "--output", path.join(root, "verifications"), "--evidence-dir", path.join(root, "evidence"), "--operator", "d3-argv", "--verification-id", `rv-argv-000${n}`, "--mongorestore", RESTORE], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    env: { PATH: E.PATH, TMPDIR: path.join(root, "tmp"), LIFECYCLE_TARGET_URI: `mongodb://${encodeURIComponent(USER)}:${encodeURIComponent(PASS)}@${B_HOST}/${db}?replicaSet=${B_RS}` },
  });
  let out = "";
  child.stdout.on("data", (d) => (out += d));
  child.stderr.on("data", (d) => (out += d));
  const done = new Promise((resolve) => child.on("close", (code, signal) => resolve({ code, signal, output: () => out })));
  return { child, done, db, dir: path.join(root, "verifications", `rv-argv-000${n}`) };
}

function childrenOf(pid) {
  try {
    return readdirSync(`/proc/${pid}/task`).flatMap((t) => readFileSync(`/proc/${pid}/task/${t}/children`, "utf8").trim().split(/\s+/).filter(Boolean).map(Number));
  } catch {
    return [];
  }
}

// Inspect every mongorestore child of the CLI (the --version probe and the
// restore) until the restore itself is seen; reduce what is read to booleans.
async function inspectMongorestore(cliPid, deadlineMs = 90000) {
  const end = Date.now() + deadlineMs;
  const probes = [];
  const done = new Set();
  while (Date.now() < end) {
    for (const pid of childrenOf(cliPid)) {
      if (done.has(pid)) continue;
      let comm;
      let cmdline;
      let environ;
      try {
        comm = readFileSync(`/proc/${pid}/comm`, "utf8").trim();
        if (comm !== "mongorestore") continue;
        cmdline = readFileSync(`/proc/${pid}/cmdline`);
        environ = readFileSync(`/proc/${pid}/environ`);
      } catch {
        continue;
      }
      const args = cmdline.toString("utf8").split("\0").filter(Boolean);
      const config = args.find((x) => x.startsWith("--config="))?.slice("--config=".length) ?? "";
      let pipe = null;
      try {
        const st = lstatSync(config);
        const dst = lstatSync(path.dirname(config));
        pipe = { fifo: st.isFIFO(), mode: st.mode & 0o777, size: st.size, dirMode: dst.mode & 0o777, inPrivateTmp: path.dirname(path.dirname(config)) === path.join(root, "tmp") && path.basename(path.dirname(config)).startsWith(PIPE_DIR_PREFIX) };
      } catch {
        // already removed
      }
      const result = {
        pid,
        argvHasCredentialOrUri: contains(cmdline),
        environHasCredentialOrUri: contains(environ),
        environHasTargetVariable: environ.indexOf(Buffer.from("LIFECYCLE_TARGET_URI=")) !== -1,
        argShapes: args.slice(1).map((x) => x.replace(/=.*$/, "=")),
        namespaceArgsExact: args.includes(`--nsInclude=${SRC}.*`) && args.includes(`--nsFrom=${SRC}.*`) && args.some((x) => /^--nsTo=expresso_d3_argv_v\d+_[0-9a-f]+\.\*$/.test(x)),
        hasDrop: args.some((x) => x.startsWith("--drop")),
        pipe,
        probes,
      };
      cmdline.fill(0);
      environ.fill(0);
      if (!config) {
        done.add(pid);
        probes.push({ argShapes: result.argShapes, argvHasCredentialOrUri: result.argvHasCredentialOrUri, environHasCredentialOrUri: result.environHasCredentialOrUri, environHasTargetVariable: result.environHasTargetVariable });
        continue;
      }
      return result;
    }
    await new Promise((r) => setTimeout(r, 2));
  }
  return null;
}

function scanTree(dir) {
  const found = { files: 0, leaks: 0, fifos: [] };
  if (!existsSync(dir)) return found;
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = path.join(d, name);
      const st = lstatSync(p);
      if (st.isDirectory()) walk(p);
      else if (st.isFIFO()) found.fifos.push({ size: st.size, mode: st.mode & 0o777 });
      else if (st.isFile()) {
        found.files++;
        const buf = readFileSync(p);
        if (NEEDLES.slice(0, 4).some((n) => buf.indexOf(n) !== -1)) found.leaks++;
        buf.fill(0);
      }
    }
  };
  walk(dir);
  return found;
}
const alive = (pid) => {
  try {
    return readFileSync(`/proc/${pid}/comm`, "utf8").trim() === "mongorestore";
  } catch {
    return false;
  }
};

test("D3 argv: the running mongorestore has no user name, password or URI in argv or environment; the restore verifies", { skip }, async () => {
  const manifestBefore = readFileSync(path.join(artifact, MANIFEST_NAME));
  const { child, done, db, dir } = await startVerify(1);
  const seen = await inspectMongorestore(child.pid);
  const r = await done;
  assert.ok(seen, "mongorestore child was observed while running");
  assert.equal(seen.argvHasCredentialOrUri, false);
  assert.equal(seen.environHasCredentialOrUri, false);
  assert.equal(seen.environHasTargetVariable, false);
  for (const p of seen.probes) assert.deepEqual(p, { argShapes: ["--version"], argvHasCredentialOrUri: false, environHasCredentialOrUri: false, environHasTargetVariable: false });
  assert.deepEqual(seen.argShapes, ["--config=", "--archive=", "--gzip", "--nsInclude=", "--nsFrom=", "--nsTo=", "--stopOnError", "--quiet"]);
  assert.equal(seen.namespaceArgsExact, true);
  assert.equal(seen.hasDrop, false);
  assert.deepEqual(seen.pipe, { fifo: true, mode: 0o600, size: 0, dirMode: 0o700, inPrivateTmp: true });

  assert.equal(r.code, 0, "restore verified");
  assert.equal(contains(Buffer.from(r.output())), false, "CLI output has no credentials");
  const doc = JSON.parse(readFileSync(path.join(dir, VERIFICATION_NAME), "utf8"));
  assert.equal(validateVerification(doc).ok, true);
  assert.equal(doc.status.restoreVerified, true);
  assert.equal(doc.comparison.databaseHash.result, "equal");
  assert.equal((await b.db(db).command({ dbHash: 1 })).md5, sourceHash);
  assert.equal(scanTree(path.join(root, "verifications")).leaks, 0);
  assert.equal(scanTree(path.join(root, "evidence")).leaks, 0);
  assert.deepEqual(readdirSync(path.join(root, "tmp")), [], "pipe directory removed");
  assert.equal(alive(seen.pid), false);
  assert.deepEqual(readFileSync(path.join(artifact, MANIFEST_NAME)), manifestBefore);
  assert.equal(verifyBackupArtifact(artifact).ok, true);
  assert.equal((await a.db(SRC).command({ dbHash: 1 })).md5, sourceHash, "source unchanged");
});

test("D3 argv: SIGINT during mongorestore exits 130, is NOT VERIFIED, removes the pipe and leaves the partial database for review", { skip }, async () => {
  const { child, done, db, dir } = await startVerify(2);
  const seen = await inspectMongorestore(child.pid);
  assert.ok(seen, "mongorestore child was observed while running");
  assert.equal(seen.argvHasCredentialOrUri, false);
  child.kill("SIGINT");
  const r = await done;
  assert.equal(r.code, 130);
  assert.equal(contains(Buffer.from(r.output())), false);
  assert.equal(existsSync(path.join(dir, VERIFICATION_NAME)), false, "never a verification artifact");
  const marker = JSON.parse(readFileSync(path.join(dir, NOT_VERIFIED_NAME), "utf8"));
  assert.equal(marker.restoreVerified, false);
  assert.equal(marker.category, "interrupted");
  assert.equal(marker.verificationDatabase, db);
  assert.deepEqual(readdirSync(path.join(root, "tmp")), [], "pipe directory removed");
  for (let i = 0; i < 200 && alive(seen.pid); i++) await new Promise((res) => setTimeout(res, 10));
  assert.equal(alive(seen.pid), false, "mongorestore stopped");
  assert.equal(scanTree(dir).leaks, 0);
  assert.equal((await a.db(SRC).command({ dbHash: 1 })).md5, sourceHash, "source unchanged");
});

test("D3 argv: SIGKILL of the CLI leaves at most an empty private FIFO and never a verification artifact", { skip }, async () => {
  const { child, done, dir } = await startVerify(3);
  const seen = await inspectMongorestore(child.pid);
  assert.ok(seen, "mongorestore child was observed while running");
  child.kill("SIGKILL");
  await done;
  // The orphaned mongorestore is this test's own child's child: stop it.
  if (alive(seen.pid)) process.kill(seen.pid, "SIGKILL");
  for (let i = 0; i < 200 && alive(seen.pid); i++) await new Promise((res) => setTimeout(res, 10));
  const tmp = scanTree(path.join(root, "tmp"));
  assert.equal(tmp.files, 0, "no regular file in the pipe area");
  assert.equal(tmp.leaks, 0);
  for (const f of tmp.fifos) assert.deepEqual(f, { size: 0, mode: 0o600 });
  for (const d of readdirSync(path.join(root, "tmp"))) assert.equal(statSync(path.join(root, "tmp", d)).mode & 0o777, 0o700);
  assert.equal(existsSync(path.join(dir, VERIFICATION_NAME)), false, "never a verification artifact");
  assert.equal(scanTree(dir).leaks, 0);
  assert.equal(scanTree(path.join(root, "evidence")).leaks, 0);
  // Test cleanup of the residue inside this test's own private directory.
  rmSync(path.join(root, "tmp"), { recursive: true, force: true });
  mkdirSync(path.join(root, "tmp"), { mode: 0o700 });
});
