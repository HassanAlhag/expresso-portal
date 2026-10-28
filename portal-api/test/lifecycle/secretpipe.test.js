// R5-D2 — the private configuration pipe that carries the connection string to mongodump.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync, existsSync, promises as fsp } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { withSecretPipe, PIPE_DIR_PREFIX } from "../../src/scripts/lifecycle/secretpipe.js";

const SECRET = 'uri: "mongodb://us%3Aer%40x:p%40ss%3Aw%2Frd@127.0.0.1:27999/db"\n';
const leftovers = () => readdirSync(tmpdir()).filter((n) => n.startsWith(PIPE_DIR_PREFIX));

test("the reader receives the content through a private FIFO that stores nothing and is removed", async () => {
  const before = leftovers();
  let seen;
  const got = await withSecretPipe(SECRET, async (fifo) => {
    const st = statSync(fifo);
    const dir = statSync(path.dirname(fifo));
    seen = { isFIFO: st.isFIFO(), fifoMode: (st.mode & 0o777).toString(8), dirMode: (dir.mode & 0o777).toString(8), size: st.size, path: fifo };
    // Read asynchronously, as a separate process would (a synchronous read here would block the writer).
    return fsp.readFile(fifo, "utf8");
  });
  assert.equal(got, SECRET);
  assert.deepEqual({ ...seen, path: undefined }, { isFIFO: true, fifoMode: "600", dirMode: "700", size: 0, path: undefined });
  assert.ok(!seen.path.includes("p%40ss") && !seen.path.includes("us%3Aer"));
  assert.equal(existsSync(seen.path), false);
  assert.equal(existsSync(path.dirname(seen.path)), false);
  assert.deepEqual(leftovers(), before);
});

test("a reader that never opens the pipe does not hang the run, and everything is removed", async () => {
  const before = leftovers();
  let fifoPath;
  const t0 = Date.now();
  const r = await withSecretPipe(SECRET, async (fifo) => (fifoPath = fifo, "no-read"));
  assert.equal(r, "no-read");
  assert.ok(Date.now() - t0 < 2500);
  assert.equal(existsSync(path.dirname(fifoPath)), false);
  assert.deepEqual(leftovers(), before);
});

test("a failing or interrupted run still removes the pipe and its directory", async () => {
  const before = leftovers();
  let fifoPath;
  await assert.rejects(withSecretPipe(SECRET, async (fifo) => {
    fifoPath = fifo;
    throw new Error("interrupted");
  }), /interrupted/);
  assert.equal(existsSync(path.dirname(fifoPath)), false);
  assert.deepEqual(leftovers(), before);
});

test("oversized or non-string content is refused before anything is created", async () => {
  const before = leftovers();
  await assert.rejects(withSecretPipe("x".repeat(5000), async () => {}), /invalid/);
  await assert.rejects(withSecretPipe(null, async () => {}), /invalid/);
  assert.deepEqual(leftovers(), before);
});
