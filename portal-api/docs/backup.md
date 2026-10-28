# Database backup — R5-D2 (runbook)

Status: **R5-D2 complete / committed.** R5-D3 (restore verification) is **not started**.

## Read this first

- **D2 proves backup creation only.** It produces a MongoDB archive, a sealed manifest and evidence for one database. The manifest always says `restoreVerified: false`.
- **D2 does not prove the backup restores.** No restore is ever run. Recovery may only be called verified after R5-D3 restores the artifact into a disposable target and checks it.
- **Local and disposable targets only.** Staging, production, `mongodb+srv`, managed-cloud hosts and anything not declared in a D1 profile are refused. There is no override flag.
- **The archive contains real database content.** Treat every artifact directory as sensitive data (see below).

## Command

```
LIFECYCLE_TARGET_URI='mongodb://<user>:<password>@127.0.0.1:<port>/<database>?replicaSet=<name>' \
npm run db:backup -- \
  --profiles /abs/path/profiles.json --profile <alias> \
  --output /abs/path/backups --evidence-dir /abs/path/evidence \
  --operator <your-id> [--artifact-id <id>] [--mongodump /abs/path/to/mongodump]
```

Every option except `--artifact-id` and `--mongodump` is required. The target URI is read only from `LIFECYCLE_TARGET_URI` (D1 convention), never from `MONGO_URI`, `.env` or the command line. Profiles, output and evidence paths must be absolute.

| Exit | Meaning |
|---|---|
| 0 | Backup created; artifact, manifest and evidence verified (restore NOT verified) |
| 2 | Refused before capture: arguments, D1 identity, live identity, topology, empty database, unsafe or colliding output |
| 4 | Capture failed: tooling, connection, permission, mongodump error, source changed during capture, checksum, manifest or evidence |
| 130 | Interrupted (SIGINT / SIGTERM) |

There is no restore, drop, delete, reset, seed, repair or migrate command.

## Target safety (D1 + live identity)

1. **D1 identity.** The profile (explicit file) must declare the alias, class `local` or `disposable`, the exact hosts, database and replica set, and list `"backup"` in `operations`. The URI must match exactly. Staging and production classes, `mongodb+srv`, managed-cloud hosts and production-looking names are refused by D1. Example:

   ```json
   { "schemaVersion": "expresso.lifecycle.profiles/1",
     "profiles": [{ "alias": "local-dev", "class": "disposable",
       "connection": { "scheme": "mongodb", "hosts": ["127.0.0.1:27999"], "database": "expresso_dev", "replicaSet": "rs0" },
       "operations": ["inventory", "backup"] }] }
   ```

2. **Live identity (read-only, before any write).** D2 connects directly to the declared host and reads `hello` and `buildInfo`:
   - the server must be the primary (identity evidence only, never a reason to write);
   - its replica-set name must equal the declared one (a standalone must be declared without one); production- or Atlas-looking set names are refused;
   - `hello.me` must be a declared host, every member it reports must be on loopback, and every declared host must be a member;
   - mongos (sharded) is refused;
   - a database with no collections is refused as a likely wrong target.

**Residual limitation.** MongoDB cannot prove the physical machine behind a port. A loopback port forwarded to another server that also reports loopback member names and the declared replica-set name would pass these checks. Use a dedicated, non-shared host, and keep disposable servers on ports that are not forwarded anywhere.

## Tooling and privileges

- `mongodump` (MongoDB Database Tools; verified with 100.13.0). It must already be installed; it is never downloaded. It is found from `--mongodump` (absolute path) or the absolute entries of `PATH`, and its version is recorded.
- It runs with an argument array and no shell: `mongodump --config=<pipe> --archive=<dir>/database.archive.gz --gzip --quiet`. Our wrapper never prints mongodump's output.
- **Credentials never appear in the process list.** The whole connection string (user name, password, host, database) is passed with mongodump's documented `--config` option (a YAML file with a `uri:` key). That "file" is a named pipe (FIFO), not a regular file:
  - it is created in a fresh private directory (`mkdtemp`, mode 0700, prefix `expresso-lifecycle-` under the system temporary directory) and is itself mode 0600;
  - a pipe has no storage: the bytes pass once through a kernel buffer to the single reader and are never written to disk (its size is always 0);
  - the pipe and its directory are removed when the run ends, including on failure and on SIGINT/SIGTERM (exit 130). If the process is killed outright (SIGKILL, power loss) at most an **empty** pipe in an empty private directory remains; it holds no data and can be deleted by hand.
  - `mkfifo` is run by absolute path (`/usr/bin/mkfifo` or `/bin/mkfifo`) with an empty environment; if neither exists the backup refuses (it never falls back to argv or a temporary file).
- **Environment.** mongodump and the `--version` probe get our environment minus `LIFECYCLE_TARGET_URI` and any value containing `mongodb://` or `mongodb+srv://`.
- Verified with mongodump 100.13.0 (`--help` lists `--config=<filename>`; a `uri:` key with user and password authenticates; a `username:` key is not accepted by this version, so the user name travels inside the URI).
- **Minimum privileges: the built-in `read` role on the target database** (listCollections, listIndexes, find/count and `dbHash` are all included). No write, admin or backup role is needed; D2 never creates or changes users.

## Consistency guarantee: `quiescent-verified`

`mongodump --oplog` only works for whole-instance dumps, so a single-database dump cannot be oplog-consistent. Instead D2 records each collection's content hash (`dbHash`) and count, plus the index list, immediately before and after the dump:

- identical before and after: no write changed the database during capture, so the archive reflects that one state; the manifest records `time.consistency.method = "quiescent-verified"`;
- different: the run **fails** (`SOURCE_CHANGED_DURING_BACKUP`) and no manifest is written. D2 never silently downgrades.

Limits: a write that is exactly undone during the capture would not be detected; `dbHash` takes shared locks and reads every document, so on large databases schedule backups for a quiet period. Writes to other databases are not relevant to this guarantee.

## Output directory and artifacts

- `--output` must be an existing, absolute, canonical directory that is not a symbolic link, not reached through one, and outside (and not a parent of) the repository.
- Each run creates exactly one new directory, `<output>/<artifact-id>` (mode 0700, created exclusively). An existing id is refused; nothing is overwritten.
- Contents on success: `database.archive.gz` (mongodump `--archive --gzip`) and `manifest.json` (mode 0600, written last and exclusively).
- **Failure and interruption policy: preserve and mark, never delete.** A run that started capture but did not finish leaves `INCOMPLETE.json` (status, code, category, time; no secrets) and **no** manifest. Such a directory is never a valid backup; keep it for diagnosis and delete it manually once reviewed. D2 deletes nothing.
- **Sensitivity.** The archive contains the database's documents, including personal and business data and credential hashes stored in collections such as `users`. It is not encrypted by D2 (`encryption: null` in the manifest). Store it on encrypted, access-controlled storage, never in the repository, and dispose of it under the data-retention policy.

## Manifest and checksums

The manifest is the D1 schema (`expresso.lifecycle.manifest/1`), extended compatibly:

- `source` (profile alias, class, target fingerprint; no credentials), `time` (UTC start/end, consistency), `application` (git commit, dirty flag, catalog version, D2 and mongodump versions, `package-lock.json` digest);
- `database`: name, topology, server version, and per collection: type, options, count, indexes (name, key, unique), a fingerprint of its content hash and count, and whether the repository knows the collection (unknown collections are included, never skipped);
- `artifacts`: the archive's relative path, size and SHA-256;
- `completion`: database and application metadata completed; public and private object storage **excluded** (D2 is database-only);
- `status`: `{ backupCreated: true, artifactChecksumsValid: true, restoreVerified: false }`. The validator rejects `restoreVerified: true` in this schema version;
- `seal`: SHA-256 of the canonical manifest.

`npm run db:manifest-check -- --manifest <dir>/manifest.json` validates it offline. `verifyBackupArtifact(dir)` (in `backup.js`) also checks the files: missing manifest, INCOMPLETE marker, missing, extra, truncated or modified files and checksum mismatches.

## Evidence

Appended to `<evidence-dir>/lifecycle-evidence.jsonl` (D1 format: append-only, hash-chained, outside the repository): `backup.requested`, `backup.identity-verified`, `backup.started`, `backup.artifact-checksummed`, `backup.manifest-written`, `backup.completed`, or `backup.failed` with a sanitized category (identity, validation, connectivity, permission, capacity, integrity, timeout, interrupted, tooling, unknown). The chain is tamper evidence, not tamper proof, and does not show that a backup restores.

## How D2 was verified

- Unit tests with a fake read-only adapter and fake mongodump (`test/lifecycle/backup.test.js`).
- Opt-in process-list security test (`test/lifecycle/backup.argv.integration.test.js`, Linux) against an explicitly started disposable standalone `mongod --auth` on loopback: set `LIFECYCLE_D2_AUTH_HOST`, `LIFECYCLE_D2_AUTH_ADMIN_URI` (an administrator on that disposable server, used only to create and drop the test's own database and user) and `LIFECYCLE_MONGODUMP`. It creates a read-only user whose name and password contain `: @ / # ? % & = +`, space and non-ASCII characters, and while the real mongodump runs reads only that child's `/proc` argv and environment (found from the CLI's own child list), reducing them to booleans at once. It asserts no user name, password (raw or encoded) or `mongodb://` URI is present; that the pipe is a 0600 FIFO of size 0 in a 0700 directory; and that after success, SIGINT (exit 130, INCOMPLETE marker) and SIGKILL nothing in output, manifest, evidence, artifacts or temporary space contains credential bytes and the source is unchanged.
- Opt-in integration test (`test/lifecycle/backup.integration.test.js`) against an explicitly started disposable local replica set (`mongod --replSet rs0 --bind_ip 127.0.0.1 --port 27999`, data directory outside the repository, no authentication, synthetic data only): set `LIFECYCLE_D2_TEST_HOST=127.0.0.1:27999`, `LIFECYCLE_D2_TEST_RS=rs0`, `LIFECYCLE_MONGODUMP=/abs/path/mongodump`. It seeds a uniquely named synthetic database, backs it up through the real CLI, checks manifest, counts, indexes, checksums, evidence and that the source is unchanged, then drops only that synthetic database. It never restores.

## Phase status

| Phase | Status |
|---|---|
| R5-D1 identity, manifests, inventory, evidence | Complete / committed |
| R5-D2 backup creation | Complete / committed |
| R5-D3 restore into a disposable target and verification | Not started |
| R5-D4 seed separation | Not started |
| R5-D5 bounded nonproduction reset | Not started |
