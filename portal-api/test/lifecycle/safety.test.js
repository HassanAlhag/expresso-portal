// Static safety checks over the R5-D1 lifecycle sources: no database or
// storage mutation, no application/startup imports, no destructive commands.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/scripts/lifecycle");
const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../package.json");
const sources = readdirSync(DIR).filter((f) => f.endsWith(".js")).map((f) => ({ f, code: readFileSync(path.join(DIR, f), "utf8") }));
// Strip comments so prose ("creates the directory") is not mistaken for code.
const codeOnly = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

test("lifecycle sources contain no database mutation calls", () => {
  const re = /\.(deleteMany|deleteOne|dropDatabase|dropCollection|drop|updateMany|updateOne|insertMany|insertOne|replaceOne|create|save|bulkWrite|syncIndexes|syncIndex|createIndex|createIndexes|ensureIndexes|dropIndex|dropIndexes|createCollection|renameCollection|rename|findOneAndUpdate|findOneAndDelete|findOneAndReplace|findByIdAndUpdate|findByIdAndDelete|remove|init)\s*\(/;
  for (const { f, code } of sources) assert.doesNotMatch(codeOnly(code), re, f);
});

// R5-D2: secretpipe.js may remove exactly the FIFO and private directory it
// created (never recursively); no other lifecycle file removes anything.
const PIPE = "secretpipe.js";

test("lifecycle sources contain no storage mutation", () => {
  const re = /(PutObject|DeleteObject|DeleteObjects|CopyObject|Upload\b|@aws-sdk|unlinkSync|unlink\(|rmSync|rmdirSync|\brm\(|truncate|writeFileSync|renameSync|copyFileSync)/;
  for (const { f, code } of sources) {
    const c = codeOnly(code);
    if (f === PIPE) {
      const removals = [...c.matchAll(/\b(unlinkSync|rmdirSync|rmSync|unlink|rm)\(([^)]*)\)/g)].map((m) => `${m[1]}(${m[2]})`);
      assert.deepEqual(removals, ["unlinkSync(fifo)", "rmdirSync(dir)"]);
      assert.doesNotMatch(c, /recursive|PutObject|DeleteObject|CopyObject|@aws-sdk|truncate|writeFileSync|renameSync|copyFileSync/);
      continue;
    }
    assert.doesNotMatch(c, re, f);
  }
});

// R5-D2: mongoread.js is the single read-only database adapter. It may import
// the driver bundled with mongoose (an existing dependency) and nothing else
// outside Node; every other lifecycle file stays database-free.
const DB_ADAPTER = "mongoread.js";

test("lifecycle sources import only Node built-ins and each other (no app, db, env, seeds)", () => {
  for (const { f, code } of sources) {
    const specs = [...code.matchAll(/^\s*import\s[^;]*?from\s+["']([^"']+)["']/gm), ...code.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]);
    for (const s of specs) assert.ok(s.startsWith("node:") || /^\.\/[a-z]+\.js$/.test(s) || (f === DB_ADAPTER && s === "mongoose"), `${f} imports ${s}`);
    assert.doesNotMatch(code, /\brequire\(/, f);
    assert.doesNotMatch(code, /dotenv|["']express["']|\.\.\/(config|modules|utils|app|server)|seed[A-Z]/, f);
    if (f !== DB_ADAPTER) assert.doesNotMatch(code, /mongoose|MongoClient/, f);
  }
});

test("the database adapter exposes read operations only", () => {
  const code = codeOnly(sources.find((s) => s.f === DB_ADAPTER).code);
  const commands = [...code.matchAll(/new Set\(\[([^\]]*)\]\)/g)].map((m) => m[1]).join();
  assert.equal(commands, '"hello", "buildInfo", "dbHash"');
  const onCollection = [...code.matchAll(/\.collection\([^)]*\)\.([a-zA-Z]+)\(/g)].map((m) => m[1]).sort();
  assert.deepEqual(onCollection, ["countDocuments", "listIndexes"]);
  const onDbOrClient = [...code.matchAll(/\b(?:db|client)\.([a-zA-Z]+)\(/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(onDbOrClient)].sort(), ["close", "collection", "command", "connect", "db", "listCollections"]);
  assert.doesNotMatch(code, /\.(insert|update|delete|replace|drop|rename|createIndex|createCollection|bulkWrite|aggregate|find|watch|admin|runCommand|createUser|grantRoles)[A-Za-z]*\(/);
});

const RESTORE = "restoreverify.js";

test("only cli.js (read-only git), backup.js (mongodump), restoreverify.js (mongorestore) and secretpipe.js (mkfifo) run child processes", () => {
  for (const { f, code } of sources) {
    if (f !== "cli.js" && f !== "backup.js" && f !== PIPE && f !== RESTORE) assert.doesNotMatch(code, /child_process/, f);
  }
  const pipe = codeOnly(sources.find((s) => s.f === PIPE).code);
  assert.deepEqual([...pipe.matchAll(/\bexecFileSync\(([^,]+),\s*\[([^\]]*)\]/g)].map((m) => `${m[1]}:${m[2]}`), ['mkfifo:"-m", "600", fifo']);
  assert.match(pipe, /MKFIFO_PATHS = \["\/usr\/bin\/mkfifo", "\/bin\/mkfifo"\]/);
  assert.doesNotMatch(pipe, /shell:\s*true|\bspawn\(|\bexec\(|execSync\(/);
  // R5-D2: backup.js runs mongodump only, by absolute path, with an argument array and no shell.
  const backup = codeOnly(sources.find((s) => s.f === "backup.js").code);
  assert.doesNotMatch(backup, /shell:\s*true|\bexec\(|execSync\(|spawnSync\(|mongorestore/);
  const spawns = [...backup.matchAll(/\bspawn\(([^,]+),\s*\[/g)].map((m) => m[1]);
  assert.deepEqual(spawns, ["binary"]);
  const execs = [...backup.matchAll(/\bexecFileSync\(([^,]+),\s*\[([^\]]*)\]/g)].map((m) => `${m[1]}:${m[2]}`);
  assert.deepEqual(execs, ['binary:"--version"']);
  // No child inherits the caller's environment (which holds LIFECYCLE_TARGET_URI).
  assert.match(backup, /execFileSync\(binary, \["--version"\], \{[^}]*env: childEnvironment\(\) \}\)/);
  assert.match(backup, /spawn\(binary, \[[^\n]+\], \{[^\n]*env: childEnvironment\(\) \}\)/);
  assert.match(pipe, /execFileSync\(mkfifo, \["-m", "600", fifo\], \{[^}]*env: \{\} \}\)/);
  // R5-D3: restoreverify.js runs mongorestore only: one spawn, argument array, no
  // shell, filtered environment, version probe through backup.js's toolVersionOf.
  const restore = codeOnly(sources.find((s) => s.f === RESTORE).code);
  assert.doesNotMatch(restore, /shell:\s*true|\bexec\(|execSync\(|spawnSync\(|execFileSync\(|(locateTool|toolVersionOf)\(\s*["'`]mongodump/);
  assert.match(restore, /const TOOL = "mongorestore";/);
  assert.equal([...restore.matchAll(/\bspawn\(/g)].length, 1);
  assert.match(restore, /\bspawn\(binary, mongorestoreArgs\(\{ configPath, archivePath, sourceDb, targetDb \}\), \{ stdio: \["ignore", "ignore", "pipe"\], shell: false, env: childEnvironment\(\) \}\)/);
  // Its argument list: config pipe, archive, gzip, one exact namespace mapping, stop on error. Never --drop or a URI.
  assert.match(restore, /return \[`--config=\$\{configPath\}`, `--archive=\$\{archivePath\}`, "--gzip", \.\.\.namespaceArgs\(sourceDb, targetDb\), "--stopOnError", "--quiet"\];/);
  assert.doesNotMatch(restore, /["'`]--(drop|uri|db|oplogReplay|restoreDbUsersAndRoles|preserveUUID|username|password)\b/);
  const cli = sources.find((s) => s.f === "cli.js").code;
  const gitCalls = [...cli.matchAll(/git\(\[([^\]]*)\]\)/g)].map((m) => m[1]);
  assert.deepEqual(gitCalls.sort(), ['"rev-parse", "HEAD"', '"status", "--porcelain", "--untracked-files=no"'].sort());
  assert.doesNotMatch(cli, /exec\(|spawn\(|execSync\(/);
  assert.equal([...cli.matchAll(/\bexecFileSync\(/g)].length, 1);
  assert.match(cli, /execFileSync\("git", \["-C", root, \.\.\.args\], \{ encoding: "utf8", stdio: \["ignore", "pipe", "ignore"\], env: \{ PATH: process\.env\.PATH \} \}\)/);
  for (const source of [cli, backup, pipe, restore]) assert.doesNotMatch(codeOnly(source), /(?:execFileSync|spawn)\([^\n]+env:\s*(?:process\.env|\{\s*\.\.\.process\.env)/);
});

test("package scripts expose only the read-only lifecycle commands and the restore-verification command", () => {
  const scripts = JSON.parse(readFileSync(PKG, "utf8")).scripts;
  const db = Object.keys(scripts).filter((k) => k.startsWith("db:")).sort();
  assert.deepEqual(db, ["db:backup", "db:inventory", "db:manifest-check", "db:restore-verify"]);
  assert.match(scripts["db:restore-verify"], /lifecycle\/restoreverify\.js$/);
  assert.match(scripts["db:backup"], /lifecycle\/backup\.js$/);
  assert.match(scripts["db:inventory"], /lifecycle\/cli\.js inventory$/);
  assert.match(scripts["db:manifest-check"], /lifecycle\/cli\.js manifest-check$/);
});
