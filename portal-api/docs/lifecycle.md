# Data lifecycle — R5-D1 safety foundation (runbook)

Status: **R5-D1 complete / committed.** R5-D2 to R5-D5 are **not started**.

## Read this first

R5-D1 builds the safety primitives that later lifecycle work will depend on. On its own it changes nothing and protects nothing that exists today.

- **D1 does NOT provide a backup.** No command dumps, copies or exports data.
- **D1 does NOT make reset safe yet.** There is no reset command, and no collection is reset-eligible.
- **D1 does NOT verify recovery.** A manifest that passes `db:manifest-check` is well formed; it is not proof that a backup exists or restores.
- **D1 does NOT permit production reset** — or any production lifecycle operation. Production and staging profiles are refused.
- D1 does not connect to MongoDB or S3, does not read `.env` or `MONGO_URI`, does not import the application, and runs no seed.

## What D1 does

| Part | File | What it does |
|---|---|---|
| Target identity | `src/scripts/lifecycle/target.js` | Matches a **declared** profile against the **observed** connection identity; refuses anything missing, malformed, ambiguous, mismatched, unsupported or production-like |
| Manifest model | `src/scripts/lifecycle/manifest.js` | Versioned (`expresso.lifecycle.manifest/1`) description of a future backup, validated offline to VALID / INVALID / INCOMPLETE / UNSUPPORTED_VERSION |
| Catalog | `src/scripts/lifecycle/catalog.js` | Lifecycle classes A–F and protection flags, derived from the repository's existing `docs/architecture/source-inventory.json` and `collection-classification.json` |
| Inventory | `src/scripts/lifecycle/inventory.js` | Read-only comparison of known collections with an observed snapshot |
| Evidence | `src/scripts/lifecycle/evidence.js` | Append-only, hash-chained JSON-lines evidence format for later phases (library only) |
| CLI | `src/scripts/lifecycle/cli.js` | `inventory` and `manifest-check` only |
| Shared helpers | `src/scripts/lifecycle/common.js` | Canonical JSON digests, path and timestamp checks, secret detection, exit codes |

No new npm dependency.

## Commands

```
npm run db:inventory -- --catalog-only
LIFECYCLE_TARGET_URI='<connection string>' npm run db:inventory -- \
    --profiles <profiles.json> --profile <alias> --observed <snapshot.json> [--include-database-name]
npm run db:manifest-check -- --manifest <manifest.json>
```

There is no `db:backup`, `db:restore`, `db:reset` or `db:seed`. Asking the CLI for `backup`, `restore`, `reset`, `seed` or any unknown command or option exits with code 2. There is no production override flag of any kind.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 2 | Invalid arguments, unsupported operation, or target identity refused |
| 4 | Validation failure (manifest INVALID or INCOMPLETE, bad snapshot, catalog drift) |
| 5 | Unsupported schema version |
| 10 | Completed with warnings (unknown collections, dirty working tree, manifest exclusions) |

Output is JSON on stdout. Errors are one line on stderr, `lifecycle: <CODE>: <message>`, and never include connection strings, credentials or input values.

## Target identity

The CLI never decides a target is safe from `NODE_ENV`, `DB_ENVIRONMENT`, a database name containing "test", or `localhost`/`127.0.0.1`: a tunnel or alias can point anywhere. A target needs both:

1. **A declared profile** — an alias in an explicit profiles file (`--profiles`), naming its class, the exact expected connection identity and the operations it allows. Profiles hold no credentials (the file is refused if it contains any).
2. **An observed identity** — parsed from the connection string in `LIFECYCLE_TARGET_URI` (an explicit variable; `MONGO_URI` and `.env` are never read).

They must match exactly: scheme, every host and port, database name and replica set. The result is a sanitized identity with a deterministic SHA-256 `fingerprint` (credentials excluded), host categories and short host fingerprints. The database name is printed only with `--include-database-name`.

| Profile class | D1 |
|---|---|
| `local`, `disposable` | Supported for read operations, loopback hosts only |
| `shared-development`, `staging` | Recognised, refused |
| `production` | Recognised, always refused |

Refused whatever the profile says: `mongodb+srv` seed lists, managed-cloud hosts (`*.mongodb.net` etc.), and database or replica-set names that look like production (`prod`, `production`, `live`). Also refused: no database name in the URI (the driver would silently use a default), duplicated hosts or options, unix sockets, other schemes.

Example profiles file (keep it outside the repository):

```json
{
  "schemaVersion": "expresso.lifecycle.profiles/1",
  "profiles": [
    {
      "alias": "local-dev",
      "class": "local",
      "connection": { "scheme": "mongodb", "hosts": ["127.0.0.1:27017"], "database": "expresso_dev", "replicaSet": null },
      "operations": ["inventory"]
    }
  ]
}
```

**Known limit.** A loopback port can still be a tunnel to another server. D1 narrows this (exact port, database and replica-set match; production-name refusal) but cannot prove what answers on the port without connecting. R5-D2 must add a server-side identity check before any write.

## Inventory

`--catalog-only` lists what the repository knows (45 collections) with classes and protection, observing nothing.

With a target, D1 reads a **captured snapshot** (`--observed`, schema `expresso.lifecycle.observed/1`) bound to the target's fingerprint; a snapshot from a different target is refused. D1 ships no live database adapter and no tool that captures a snapshot from a live database; in D1, snapshots are test fixtures or hand-supplied documents. Any future adapter must expose only `listCollections`, `countDocuments`, `listIndexes` and `serverInfo`; the inventory wraps it in a frozen facade with exactly those methods.

Each collection is reported as `present`, `known-absent`, `unknown` (observed, not known to the repository) or `not-observed`, with counts, indexes, options, class, protection and declared storage mapping.

## Catalog and protection

Lifecycle classes: **A** SYSTEM · **B** CONFIGURATION / MASTER · **C** CMS CANDIDATE · **D** BUSINESS / PROTECTED HISTORY · **E** DEMO / TEST · **F** FILE METADATA.

They are mapped from the reviewed repository classes (SYSTEM → A, CONFIGURATION → B, CMS → C, BUSINESS and LOG/AUDIT → D); `files` and `media` are F. No collection is E: the repository has no test-only collection, so demo/test data is row-level inside D collections. If the inventory and classification disagree, the catalog refuses to load rather than guessing.

Classification never authorises deletion. In D1 every collection is `protected: true`, `resetEligible: false`, `writable: false`. Unknown collections are protected, read-only and require an owner decision. No reset policy is encoded.

## Manifests

`manifest-check` validates a manifest offline (no MongoDB, S3, network or app startup):

- **identity**: schema version, operation id, kind, source profile and fingerprint;
- **time**: UTC start/end and consistency method;
- **application**: git commit, dirty flag, catalog version, tool version, lockfile digests;
- **database**: name, topology, server version, collections with options, indexes, counts and fingerprints;
- **object storage**: public/private stores, namespace, object keys, sizes, checksums, version ids;
- **artifacts**: relative paths (no traversal), sizes, SHA-256, encryption key references (never key material);
- **completion**: required/completed components, exclusions, failures, capture method, state;
- **seal**: SHA-256 of the canonical manifest without the seal.

Results: **VALID** (well formed and consistent; `verified` is always `false`), **INVALID** (including an altered seal, impossible completion state, duplicates, bad timestamps or checksums, path traversal, secret-like content), **INCOMPLETE** (honestly records a partial or failed capture), **UNSUPPORTED_VERSION**.

## Evidence

`evidence.js` defines lifecycle evidence for later phases: `backup.*`, `restore.*`, `verification.completed`, `reset.*`, `seed.*` events with operation id, target fingerprint, manifest/backup/plan digests, operator, tool version, UTC time, result, counts and a sanitized failure category. It is not the application's Audit collection and never lives in the target database.

- Files are JSON lines in an explicit absolute directory **outside the repository** (created 0700; files 0600; symlinks refused; plain file names only).
- Records are appended with `O_APPEND`; earlier records are never rewritten.
- Events are validated; secret-like content is rejected, not cleaned.
- Each record carries the previous record's digest. This hash chain is **tamper evidence only**: it detects edited, removed or reordered records. It does not make the file immutable. Appending to a file whose chain does not verify is refused.

D1 executes none of these operations and has no CLI command that writes evidence.

## Approved sequence

| Phase | Scope | Status |
|---|---|---|
| R5-D1 | Identity, manifests, inventory, catalog, evidence foundation | **Complete / committed** |
| R5-D2 | Backup + restore into a disposable target | Not started |
| R5-D3 | Restore verification | Not started |
| R5-D4 | Seed separation (system / config / CMS / demo) | Not started |
| R5-D5 | Bounded nonproduction reset | Not started |

Nothing in D2–D5 exists yet. The existing seed scripts and `src/scripts/_guard.js` are unchanged and are not used by the lifecycle CLI.
