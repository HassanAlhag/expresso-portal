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

test("lifecycle sources contain no storage mutation", () => {
  const re = /(PutObject|DeleteObject|DeleteObjects|CopyObject|Upload\b|@aws-sdk|unlinkSync|unlink\(|rmSync|rmdirSync|\brm\(|truncate|writeFileSync|renameSync|copyFileSync)/;
  for (const { f, code } of sources) assert.doesNotMatch(codeOnly(code), re, f);
});

test("lifecycle sources import only Node built-ins and each other (no app, db, env, seeds)", () => {
  for (const { f, code } of sources) {
    const specs = [...code.matchAll(/^\s*import\s[^;]*?from\s+["']([^"']+)["']/gm), ...code.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]);
    for (const s of specs) assert.ok(s.startsWith("node:") || /^\.\/[a-z]+\.js$/.test(s), `${f} imports ${s}`);
    assert.doesNotMatch(code, /\brequire\(/, f);
    assert.doesNotMatch(code, /dotenv|mongoose|["']express["']|\.\.\/(config|modules|utils|app|server)|seed[A-Z]/, f);
  }
});

test("only cli.js runs a child process, and only read-only git", () => {
  for (const { f, code } of sources) {
    if (f !== "cli.js") assert.doesNotMatch(code, /child_process/, f);
  }
  const cli = sources.find((s) => s.f === "cli.js").code;
  const gitCalls = [...cli.matchAll(/git\(\[([^\]]*)\]\)/g)].map((m) => m[1]);
  assert.deepEqual(gitCalls.sort(), ['"rev-parse", "HEAD"', '"status", "--porcelain", "--untracked-files=no"'].sort());
  assert.doesNotMatch(cli, /exec\(|spawn\(|execSync\(/);
});

test("package scripts expose only the read-only lifecycle commands", () => {
  const scripts = JSON.parse(readFileSync(PKG, "utf8")).scripts;
  const db = Object.keys(scripts).filter((k) => k.startsWith("db:")).sort();
  assert.deepEqual(db, ["db:inventory", "db:manifest-check"]);
  assert.match(scripts["db:inventory"], /lifecycle\/cli\.js inventory$/);
  assert.match(scripts["db:manifest-check"], /lifecycle\/cli\.js manifest-check$/);
});
