// R5-D2 — hand a secret to a child process without argv, environment or disk.
//
// mongodump's documented --config option reads a YAML file whose `uri` key may
// carry the full connection string (user, password, host, database). The file
// is given here as a FIFO (named pipe) instead of a regular file:
//   - it lives in a fresh private directory (mkdtemp, mode 0700) and is itself
//     mode 0600, so only this user can open it;
//   - a FIFO has no storage: the bytes pass through a kernel buffer and are
//     never written to a filesystem (its size on disk is always 0);
//   - the FIFO and its directory are removed when the run ends, including on
//     errors and SIGINT/SIGTERM; if the process is killed outright, at most an
//     empty FIFO in an empty private directory remains, holding no data.
// Node has no mkfifo API, so the standard `mkfifo` utility is run by absolute
// path with an argument array (no shell). This module only ever removes the
// exact FIFO and directory it created.

import { execFileSync } from "node:child_process";
import { closeSync, constants, existsSync, mkdtempSync, openSync, promises as fsp, rmdirSync, statSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const PIPE_DIR_PREFIX = "expresso-lifecycle-";
const MKFIFO_PATHS = ["/usr/bin/mkfifo", "/bin/mkfifo"];
const MAX_BYTES = 4096; // below PIPE_BUF on supported platforms: one atomic write

function locateMkfifo() {
  const found = MKFIFO_PATHS.find((p) => existsSync(p));
  if (!found) {
    const e = new Error("mkfifo is not available; refusing to pass credentials another way");
    e.code = "MKFIFO_UNAVAILABLE";
    throw e;
  }
  return found;
}

/**
 * Create a private FIFO, write `content` to it for exactly one reader, call
 * `run(fifoPath)`, then remove the FIFO and its directory. Returns run()'s result.
 */
export async function withSecretPipe(content, run) {
  if (typeof content !== "string" || Buffer.byteLength(content) > MAX_BYTES) throw new Error("secret pipe content is invalid");
  const mkfifo = locateMkfifo();
  const dir = mkdtempSync(path.join(tmpdir(), PIPE_DIR_PREFIX));
  const fifo = path.join(dir, "config.yaml");
  let writing = null;
  try {
    if ((statSync(dir).mode & 0o077) !== 0) throw new Error("private directory is not private");
    execFileSync(mkfifo, ["-m", "600", fifo], { stdio: "ignore", timeout: 10000, env: {} });
    const st = statSync(fifo);
    if (!st.isFIFO() || (st.mode & 0o077) !== 0) throw new Error("named pipe is not private");
    // Opening for write waits until the child opens it for reading.
    writing = (async () => {
      const fh = await fsp.open(fifo, constants.O_WRONLY);
      try {
        await fh.write(content);
      } finally {
        await fh.close();
      }
    })().catch(() => {});
    return await run(fifo);
  } finally {
    if (writing) {
      // If the child never opened the pipe, open a reader so the pending
      // writer completes; its bytes are discarded when both ends close.
      let reader = null;
      try {
        reader = openSync(fifo, constants.O_RDONLY | constants.O_NONBLOCK);
      } catch {
        // already gone
      }
      await Promise.race([writing, new Promise((r) => setTimeout(r, 2000).unref())]);
      if (reader !== null) closeSync(reader);
    }
    try {
      unlinkSync(fifo);
    } catch {
      // not created
    }
    try {
      rmdirSync(dir);
    } catch {
      // not empty or already gone: never removed recursively
    }
  }
}
