#!/usr/bin/env node
// R5-B2 reference-integrity check — offline, read-only.
//
//   node src/scripts/lifecycle/refcheck.js --snapshot <explicit-file>
//
// Reads ONE explicitly named, sanitized snapshot file and prints a JSON report
// to stdout. It never captures data: it does not connect to MongoDB or
// storage, does not read .env or MONGO_URI, does not import the application,
// does not search for dump files, and writes nothing. There is no capture,
// repair, fix, delete, migrate, reset, restore or backup command.
//
// Exit codes (shared with the D1 CLI): 0 complete evidence and no findings ·
// 2 invalid arguments · 4 invalid snapshot or catalog drift · 5 unsupported
// version · 10 report produced with findings or incomplete evidence.

import { readFileSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { EXIT, LifecycleError } from "./common.js";
import { DEFAULT_SOURCES } from "./catalog.js";
import { buildReferenceCatalog, catalogDrift, evaluateReferences } from "./references.js";

const MAX_INPUT_BYTES = 50 * 1024 * 1024;
const USAGE = `Usage:
  refcheck.js --snapshot <file>
Offline reference-integrity report for an explicitly supplied snapshot (R5-B2). Read-only.`;

function readJson(file, label) {
  let size;
  try {
    size = statSync(file).size;
  } catch {
    throw new LifecycleError("UNREADABLE_INPUT", `the ${label} file could not be read`, EXIT.VALIDATION_FAILURE);
  }
  if (size > MAX_INPUT_BYTES) throw new LifecycleError("INPUT_TOO_LARGE", `the ${label} file is too large`, EXIT.VALIDATION_FAILURE);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new LifecycleError("UNREADABLE_INPUT", `the ${label} file is not valid JSON`, EXIT.VALIDATION_FAILURE);
  }
}

/** Run the check. Side effects only through `deps` (injectable for tests). */
export async function main(argv, deps = {}) {
  const d = {
    stdout: (s) => process.stdout.write(s),
    stderr: (s) => process.stderr.write(s),
    inventory: () => readJson(DEFAULT_SOURCES.inventory, "source inventory"),
    ...deps,
  };
  try {
    if (!argv.length || argv[0] === "--help" || argv[0] === "-h") {
      d.stdout(`${USAGE}\n`);
      return EXIT.OK;
    }
    if (argv.length !== 2 || argv[0] !== "--snapshot" || !argv[1] || argv[1].startsWith("--")) {
      throw new LifecycleError("INVALID_ARGS", "expected exactly: --snapshot <file>");
    }
    const inventory = d.inventory();
    const catalog = buildReferenceCatalog(inventory);
    const drift = catalogDrift(inventory, catalog);
    if (drift.length) throw new LifecycleError("CATALOG_DRIFT", `the reference catalog no longer matches the models (${drift.length} difference(s)); review references.js`, EXIT.VALIDATION_FAILURE);
    const report = evaluateReferences(readJson(argv[1], "snapshot"), catalog);
    d.stdout(`${JSON.stringify(report, null, 2)}\n`);
    return report.evidence.complete && report.findings.length === 0 ? EXIT.OK : EXIT.WARNINGS;
  } catch (e) {
    if (e instanceof LifecycleError) {
      d.stderr(`refcheck: ${e.code}: ${e.message}\n`);
      return e.exitCode;
    }
    d.stderr("refcheck: INTERNAL_ERROR: unexpected failure (no details printed)\n");
    return EXIT.VALIDATION_FAILURE;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
