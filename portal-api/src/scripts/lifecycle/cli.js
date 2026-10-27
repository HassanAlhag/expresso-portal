#!/usr/bin/env node
// R5-D1 lifecycle CLI — read-only commands only.
//
//   node src/scripts/lifecycle/cli.js inventory --catalog-only
//   LIFECYCLE_TARGET_URI=… node src/scripts/lifecycle/cli.js inventory \
//       --profiles <profiles.json> --profile <alias> --observed <snapshot.json>
//   node src/scripts/lifecycle/cli.js manifest-check --manifest <manifest.json>
//
// No backup, restore, reset or seed command exists. The CLI does not load
// .env, does not read MONGO_URI, does not import the application, does not
// connect to MongoDB or S3, and writes nothing except its report to stdout.
//
// Exit codes: 0 success · 2 invalid arguments or target identity ·
// 4 validation failure · 5 unsupported version · 10 completed with warnings.

import { readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { EXIT, LifecycleError } from "./common.js";
import { validateProfiles, resolveTarget, authorizeOperation, publicIdentity } from "./target.js";
import { loadCatalog, REPO_ROOT } from "./catalog.js";
import { runInventory, snapshotAdapter } from "./inventory.js";
import { validateManifest, STATUS } from "./manifest.js";

export const TOOL_VERSION = "r5-d1.1";
export const TARGET_URI_ENV = "LIFECYCLE_TARGET_URI";
const MAX_INPUT_BYTES = 20 * 1024 * 1024;

const COMMANDS = {
  inventory: { flags: ["--catalog-only", "--profiles", "--profile", "--observed", "--include-database-name"] },
  "manifest-check": { flags: ["--manifest"] },
};
const BOOLEAN_FLAGS = new Set(["--catalog-only", "--include-database-name"]);
const NOT_IN_D1 = new Set(["backup", "restore", "reset", "seed", "verify", "verify-backup", "delete", "drop", "repair", "migrate"]);

const USAGE = `Usage:
  cli.js inventory --catalog-only
  cli.js inventory --profiles <file> --profile <alias> --observed <snapshot.json> [--include-database-name]
      (target connection string is read from ${TARGET_URI_ENV}; never from MONGO_URI or .env)
  cli.js manifest-check --manifest <file>
R5-D1 provides read-only commands only.`;

function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") return { help: true };
  if (NOT_IN_D1.has(command)) throw new LifecycleError("UNSUPPORTED_OPERATION", `"${command}" is not provided by R5-D1 (read-only foundation)`);
  if (!Object.hasOwn(COMMANDS, command)) throw new LifecycleError("UNSUPPORTED_OPERATION", "unknown command");
  const opts = {};
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    if (!COMMANDS[command].flags.includes(flag)) throw new LifecycleError("INVALID_ARGS", "unknown or unsupported option");
    if (Object.hasOwn(opts, flag)) throw new LifecycleError("INVALID_ARGS", "an option was given twice");
    if (BOOLEAN_FLAGS.has(flag)) opts[flag] = true;
    else {
      const value = rest[++i];
      if (value === undefined || value.startsWith("--")) throw new LifecycleError("INVALID_ARGS", "an option is missing its value");
      opts[flag] = value;
    }
  }
  return { command, opts };
}

function readJsonFile(file, label, exitCode) {
  let size;
  try {
    size = statSync(file).size;
  } catch {
    throw new LifecycleError("UNREADABLE_INPUT", `the ${label} file could not be read`, exitCode);
  }
  if (size > MAX_INPUT_BYTES) throw new LifecycleError("INPUT_TOO_LARGE", `the ${label} file is too large`, exitCode);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new LifecycleError("UNREADABLE_INPUT", `the ${label} file is not valid JSON`, exitCode);
  }
}

/** Read-only git facts about the application checkout. */
export function gitApplicationInfo(root = REPO_ROOT) {
  const git = (args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  try {
    const gitCommit = git(["rev-parse", "HEAD"]);
    const dirty = git(["status", "--porcelain", "--untracked-files=no"]).length > 0;
    return { gitCommit: /^[0-9a-f]{40}$/.test(gitCommit) ? gitCommit : null, dirty, toolVersion: TOOL_VERSION };
  } catch {
    return { gitCommit: null, dirty: null, toolVersion: TOOL_VERSION };
  }
}

async function inventoryCommand(opts, deps) {
  const catalog = deps.loadCatalog();
  const application = deps.application();
  if (opts["--catalog-only"]) {
    if (opts["--profiles"] || opts["--profile"] || opts["--observed"] || opts["--include-database-name"]) {
      throw new LifecycleError("INVALID_ARGS", "--catalog-only takes no target options");
    }
    return runInventory({ catalog, application, now: deps.now });
  }
  if (!opts["--profiles"] || !opts["--profile"]) throw new LifecycleError("MISSING_PROFILE", "inventory needs --profiles and --profile (or --catalog-only)");
  const profiles = validateProfiles(readJsonFile(opts["--profiles"], "profiles", EXIT.INVALID_ARGS_OR_IDENTITY));
  const identity = resolveTarget({ profiles, alias: opts["--profile"], uri: deps.env[TARGET_URI_ENV] });
  authorizeOperation(identity, "inventory");
  if (!opts["--observed"]) {
    throw new LifecycleError("NO_OBSERVATION", "R5-D1 does not connect to databases; pass --observed <snapshot.json> captured from this target");
  }
  const adapter = snapshotAdapter(readJsonFile(opts["--observed"], "observed snapshot", EXIT.VALIDATION_FAILURE));
  if (adapter.targetFingerprint !== identity.fingerprint) throw new LifecycleError("PROFILE_MISMATCH", "the observed snapshot was captured from a different target");
  const report = await runInventory({ catalog, identity: publicIdentity(identity, { includeDatabaseName: Boolean(opts["--include-database-name"]) }), adapter, application, now: deps.now });
  return report;
}

function manifestCommand(opts) {
  if (!opts["--manifest"]) throw new LifecycleError("INVALID_ARGS", "manifest-check needs --manifest <file>");
  let doc;
  try {
    doc = readJsonFile(opts["--manifest"], "manifest", EXIT.VALIDATION_FAILURE);
  } catch (e) {
    return { status: STATUS.INVALID, errors: [{ path: "", rule: e.message }], warnings: [], verified: false };
  }
  return validateManifest(doc);
}

const MANIFEST_EXIT = { VALID: EXIT.OK, INVALID: EXIT.VALIDATION_FAILURE, INCOMPLETE: EXIT.VALIDATION_FAILURE, UNSUPPORTED_VERSION: EXIT.UNSUPPORTED_VERSION };

/** Run the CLI. All side effects come through `deps` (injectable for tests). */
export async function main(argv, deps = {}) {
  const d = {
    env: process.env,
    stdout: (s) => process.stdout.write(s),
    stderr: (s) => process.stderr.write(s),
    now: () => new Date(),
    loadCatalog: () => loadCatalog(),
    application: () => gitApplicationInfo(),
    ...deps,
  };
  try {
    const parsed = parseArgs(argv);
    if (parsed.help) {
      d.stdout(`${USAGE}\n`);
      return EXIT.OK;
    }
    if (parsed.command === "inventory") {
      const report = await inventoryCommand(parsed.opts, d);
      d.stdout(`${JSON.stringify(report, null, 2)}\n`);
      return report.warnings.length ? EXIT.WARNINGS : EXIT.OK;
    }
    const result = manifestCommand(parsed.opts);
    d.stdout(`${JSON.stringify({ command: "manifest-check", ...result, note: "Structural validation only: a VALID manifest is not a verified backup." }, null, 2)}\n`);
    const code = MANIFEST_EXIT[result.status];
    return code === EXIT.OK && result.warnings.length ? EXIT.WARNINGS : code;
  } catch (e) {
    if (e instanceof LifecycleError) {
      d.stderr(`lifecycle: ${e.code}: ${e.message}\n`);
      return e.exitCode;
    }
    // Unexpected errors: print a category only, never the raw error (it could carry input).
    d.stderr("lifecycle: INTERNAL_ERROR: unexpected failure (no details printed)\n");
    return EXIT.VALIDATION_FAILURE;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
