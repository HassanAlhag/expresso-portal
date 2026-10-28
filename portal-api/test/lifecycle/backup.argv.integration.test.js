// R5-D2 — process-list security test against a disposable, authentication-enabled
// local mongod.
//
// Opt-in and Linux-only (it reads /proc). Runs only when LIFECYCLE_D2_AUTH_HOST
// (loopback host:port of a disposable standalone started with --auth),
// LIFECYCLE_D2_AUTH_ADMIN_URI (an administrator on that disposable server, used
// only to create and drop this test's own database and user) and
// LIFECYCLE_MONGODUMP (absolute path) are set.
//
// It creates a uniquely named synthetic database and a read-only user whose
// name and password contain URI-special characters, then, while the real CLI's
// real mongodump child is running, reads ONLY that child's /proc entries
// (found through the CLI's own /proc/<pid>/task/*/children list; no other
// process is inspected). The argv and environment bytes are reduced to
// booleans at once and never stored, printed or written.
// It never restores. Never point it at anything but a disposable local server.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { verifyBackupArtifact, MANIFEST_NAME } from "../../src/scripts/lifecycle/backup.js";
import { validateManifest } from "../../src/scripts/lifecycle/manifest.js";
import { verifyEvidence } from "../../src/scripts/lifecycle/evidence.js";
import { hostCategory } from "../../src/scripts/lifecycle/target.js";
import { PIPE_DIR_PREFIX } from "../../src/scripts/lifecycle/secretpipe.js";

const HOST = process.env.LIFECYCLE_D2_AUTH_HOST;
const ADMIN = process.env.LIFECYCLE_D2_AUTH_ADMIN_URI;
const DUMP = process.env.LIFECYCLE_MONGODUMP;
const enabled = process.platform === "linux" && Boolean(HOST && ADMIN && DUMP) && hostCategory(String(HOST).replace(/:\d+$/, "")) === "loopback";
const skip = enabled ? false : "Linux with LIFECYCLE_D2_AUTH_HOST / _ADMIN_URI / LIFECYCLE_MONGODUMP set (needs a disposable local mongod --auth)";
const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/scripts/lifecycle/backup.js");

const DB = `expresso_d2_argv_${randomBytes(4).toString("hex")}`;
// URI-special characters in both: : @ / # ? % & = + space and non-ASCII.
const USER = `d2:us@er/${randomBytes(3).toString("hex")}#?`;
const PASS = `p@ss:w/rd#?%&=+ é-${randomBytes(6).toString("hex")}`;
const TARGET = `mongodb://${encodeURIComponent(USER)}:${encodeURIComponent(PASS)}@${HOST}/${DB}`;
const NEEDLES = [PASS, encodeURIComponent(PASS), USER, encodeURIComponent(USER), "mongodb://", "mongodb+srv://", `@${HOST}`].map((s) => Buffer.from(s));

let admin;
let root;
let source;

const contains = (buf) => NEEDLES.some((n) => buf.indexOf(n) !== -1);

async function sourceState() {
  const db = admin.db(DB);
  const hash = await db.command({ dbHash: 1 });
  const counts = {};
  for (const c of (await db.listCollections().toArray()).map((x) => x.name).sort()) counts[c] = await db.collection(c).countDocuments({});
  return { md5: hash.md5, collections: hash.collections, counts };
}

before(async () => {
  if (!enabled) return;
  admin = new mongoose.mongo.MongoClient(ADMIN, { directConnection: true, serverSelectionTimeoutMS: 8000 });
  await admin.connect();
  const db = admin.db(DB);
  // Synthetic data only, large enough that mongodump runs for a while.
  const blob = () => randomBytes(384).toString("base64");
  for (let b = 0; b < 30; b++) {
    await db.collection("events").insertMany(Array.from({ length: 5000 }, (_, i) => ({ seq: b * 5000 + i, body: blob() })), { ordered: false });
  }
  await db.collection("customers").insertMany(Array.from({ length: 20 }, (_, i) => ({ companyName: `Synthetic Co ${i}` })));
  await db.command({ createUser: USER, pwd: PASS, roles: [{ role: "read", db: DB }] });
  source = await sourceState();
  root = realpathSync(mkdtempSync(path.join(tmpdir(), "d2-argv-")));
  for (const d of ["backups", "tmp", "evidence"]) mkdirSync(path.join(root, d), { mode: 0o700 });
  writeFileSync(path.join(root, "profiles.json"), JSON.stringify({ schemaVersion: "expresso.lifecycle.profiles/1", profiles: [{ alias: "local-d2-argv", class: "disposable", connection: { scheme: "mongodb", hosts: [HOST], database: DB }, operations: ["backup"] }] }));
});

after(async () => {
  if (!enabled) return;
  // Test cleanup on the disposable server only: this test's own user and database.
  try {
    await admin.db(DB).command({ dropUser: USER });
  } catch {
    // already gone
  }
  await admin.db(DB).dropDatabase();
  await admin.close();
  rmSync(root, { recursive: true, force: true });
});

function startBackup(id) {
  const child = spawn(process.execPath, [CLI, "--profiles", path.join(root, "profiles.json"), "--profile", "local-d2-argv", "--output", path.join(root, "backups"), "--evidence-dir", path.join(root, "evidence"), "--operator", "d2-argv", "--artifact-id", id, "--mongodump", DUMP], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    env: { PATH: process.env.PATH, TMPDIR: path.join(root, "tmp"), LIFECYCLE_TARGET_URI: TARGET },
  });
  let out = "";
  child.stdout.on("data", (d) => (out += d));
  child.stderr.on("data", (d) => (out += d));
  const done = new Promise((resolve) => child.on("close", (code, signal) => resolve({ code, signal, output: () => out })));
  return { child, done };
}

// The CLI's direct children, from the CLI's own /proc entry only.
function childrenOf(pid) {
  try {
    return readdirSync(`/proc/${pid}/task`).flatMap((t) => readFileSync(`/proc/${pid}/task/${t}/children`, "utf8").trim().split(/\s+/).filter(Boolean).map(Number));
  } catch {
    return [];
  }
}

// Inspect every mongodump child of the CLI (the --version probe and the dump)
// until the dump itself is seen; what is read is reduced to booleans at once.
async function inspectMongodump(cliPid, deadlineMs = 60000) {
  const end = Date.now() + deadlineMs;
  const probes = [];
  const done = new Set();
  while (Date.now() < end) {
    for (const pid of childrenOf(cliPid)) {
      if (done.has(pid)) continue;
      let comm;
      try {
        comm = readFileSync(`/proc/${pid}/comm`, "utf8").trim();
      } catch {
        continue;
      }
      if (comm !== "mongodump") continue;
      let cmdline;
      let environ;
      try {
        cmdline = readFileSync(`/proc/${pid}/cmdline`);
        environ = readFileSync(`/proc/${pid}/environ`);
      } catch {
        continue;
      }
      const args = cmdline.toString("utf8").split("\0").filter(Boolean);
      const config = args.find((a) => a.startsWith("--config="))?.slice("--config=".length) ?? "";
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
        probes,
        argvHasCredentialOrUri: contains(cmdline),
        environHasCredentialOrUri: contains(environ),
        environHasTargetVariable: environ.indexOf(Buffer.from("LIFECYCLE_TARGET_URI=")) !== -1,
        argShapes: args.slice(1).map((a) => a.replace(/=.*$/, "=")),
        configArgIsPipePath: Boolean(config) && path.basename(config) === "config.yaml",
        pipe,
      };
      cmdline.fill(0);
      environ.fill(0);
      if (!args.some((a) => a.startsWith("--config="))) {
        // The version probe (or any other mongodump run): record its booleans and keep waiting.
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

// Every regular file under dir must be free of credential bytes; FIFOs are reported, never opened.
function scanTree(dir) {
  const found = { files: 0, leaks: 0, fifos: [] };
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = path.join(d, name);
      const st = lstatSync(p);
      if (st.isDirectory()) walk(p);
      else if (st.isFIFO()) found.fifos.push({ size: st.size, mode: st.mode & 0o777 });
      else if (st.isFile()) {
        found.files++;
        const b = readFileSync(p);
        if (NEEDLES.slice(0, 4).some((n) => b.indexOf(n) !== -1)) found.leaks++;
        b.fill(0);
      }
    }
  };
  walk(dir);
  return found;
}

const alive = (pid) => {
  try {
    return readFileSync(`/proc/${pid}/comm`, "utf8").trim() === "mongodump";
  } catch {
    return false;
  }
};

test("D2 argv: the running mongodump has no user name, password or URI in argv or environment", { skip }, async () => {
  const { child, done } = startBackup("bk-argv-0001");
  const seen = await inspectMongodump(child.pid);
  const r = await done;
  assert.ok(seen, "mongodump child was observed while running");
  assert.equal(seen.argvHasCredentialOrUri, false);
  assert.equal(seen.environHasCredentialOrUri, false);
  assert.equal(seen.environHasTargetVariable, false);
  for (const p of seen.probes) assert.deepEqual(p, { argShapes: ["--version"], argvHasCredentialOrUri: false, environHasCredentialOrUri: false, environHasTargetVariable: false });
  assert.deepEqual(seen.argShapes, ["--config=", "--archive=", "--gzip", "--quiet"]);
  assert.equal(seen.configArgIsPipePath, true);
  assert.deepEqual(seen.pipe, { fifo: true, mode: 0o600, size: 0, dirMode: 0o700, inPrivateTmp: true });

  assert.equal(r.code, 0, "backup succeeds");
  assert.equal(contains(Buffer.from(r.output())), false, "CLI output has no credentials");
  const dir = path.join(root, "backups", "bk-argv-0001");
  assert.equal(verifyBackupArtifact(dir).ok, true);
  const m = JSON.parse(readFileSync(path.join(dir, MANIFEST_NAME), "utf8"));
  assert.equal(validateManifest(m).status, "VALID");
  assert.deepEqual(m.status, { backupCreated: true, artifactChecksumsValid: true, restoreVerified: false });
  assert.equal(m.database.topology, "standalone");
  assert.equal(contains(Buffer.from(JSON.stringify(m))), false);
  assert.equal(verifyEvidence(path.join(root, "evidence", "lifecycle-evidence.jsonl")).ok, true);
  assert.equal(scanTree(path.join(root, "evidence")).leaks, 0);
  assert.equal(scanTree(dir).leaks, 0);
  assert.deepEqual(readdirSync(path.join(root, "tmp")), [], "pipe directory removed");
  assert.equal(alive(seen.pid), false);
  assert.deepEqual(await sourceState(), source, "source unchanged");
});

test("D2 argv: SIGINT during mongodump exits 130 and leaves no pipe, marker only", { skip }, async () => {
  const { child, done } = startBackup("bk-argv-0002");
  const seen = await inspectMongodump(child.pid);
  assert.ok(seen, "mongodump child was observed while running");
  assert.equal(seen.argvHasCredentialOrUri, false);
  child.kill("SIGINT");
  const r = await done;
  assert.equal(r.code, 130);
  assert.equal(contains(Buffer.from(r.output())), false);
  const dir = path.join(root, "backups", "bk-argv-0002");
  assert.equal(existsSync(path.join(dir, "INCOMPLETE.json")), true);
  assert.equal(existsSync(path.join(dir, MANIFEST_NAME)), false);
  assert.equal(scanTree(dir).leaks, 0);
  assert.deepEqual(readdirSync(path.join(root, "tmp")), [], "pipe directory removed");
  assert.equal(alive(seen.pid), false, "mongodump stopped");
  assert.deepEqual(await sourceState(), source);
});

test("D2 argv: SIGKILL of the CLI leaves at most an empty private FIFO, never credential bytes", { skip }, async () => {
  const { child, done } = startBackup("bk-argv-0003");
  const seen = await inspectMongodump(child.pid);
  assert.ok(seen, "mongodump child was observed while running");
  child.kill("SIGKILL");
  await done;
  // The orphaned mongodump is this test's own child's child: stop it.
  if (alive(seen.pid)) process.kill(seen.pid, "SIGKILL");
  for (let i = 0; i < 200 && alive(seen.pid); i++) await new Promise((r) => setTimeout(r, 10));
  const tmp = scanTree(path.join(root, "tmp"));
  assert.equal(tmp.files, 0, "no regular file in the pipe area");
  assert.equal(tmp.leaks, 0);
  for (const f of tmp.fifos) assert.deepEqual(f, { size: 0, mode: 0o600 });
  for (const d of readdirSync(path.join(root, "tmp"))) assert.equal(statSync(path.join(root, "tmp", d)).mode & 0o777, 0o700);
  assert.equal(scanTree(path.join(root, "backups", "bk-argv-0003")).leaks, 0);
  assert.equal(scanTree(path.join(root, "evidence")).leaks, 0);
  assert.deepEqual(await sourceState(), source);
  // Test cleanup of the residue inside this test's own private directory.
  rmSync(path.join(root, "tmp"), { recursive: true, force: true });
  mkdirSync(path.join(root, "tmp"), { mode: 0o700 });
});
