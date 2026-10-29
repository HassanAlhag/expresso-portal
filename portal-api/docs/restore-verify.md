# Restore verification — R5-D3 (runbook)

**Blueprint closure:** D1–D3 are CLOSED foundations; D4 seed and D5 reset are DEFERRED post-Blueprint. No reset/seed operation is authorized. See [final code closure and deployment acceptance](../../docs/architecture/BLUEPRINT-CLOSURE.md).

Status: **R5-D3 complete / committed / pushed**. R5-D4 and R5-D5 are **not started**.

## Read this first

- **D3 is verification, not recovery.** It takes ONE R5-D2 backup artifact, checks it completely, restores it into a **new, empty verification database** on a **separate local/disposable replica set**, and proves the restored database matches the D2 manifest. It is not a disaster-recovery or operator restore command, and there is no way to use it as one.
- **It never writes to the source.** The source database is never contacted (the D2 manifest is enough); the restore can only go to a database whose name differs from the source's, on a server that is provably not the source server.
- **What a `restoreVerified: true` result proves:** this artifact restored, under the tested conditions, into an empty disposable database whose collections, types, options, document counts, indexes (name, key order, uniqueness) and content hashes match the manifest.
- **What it does not prove:** production restore procedures; production RTO or RPO; infrastructure recovery; S3/object-storage recovery (D2 is database-only); external service recovery; index properties beyond name, key and uniqueness (D2 records only these); users and roles (not part of a D2 backup).
- **The D2 artifact is never modified.** Its manifest keeps `restoreVerified: false` for ever (it records what was known when the backup was made). The result of D3 is a separate, sealed `restore-verification.json`.

## Command

```
LIFECYCLE_TARGET_URI='mongodb://<user>:<password>@127.0.0.1:<port>/<verification-db>?replicaSet=<name>' \
npm run db:restore-verify -- \
  --artifact /abs/path/backups/<artifact-id> \
  --profiles /abs/path/profiles.json --profile <alias> \
  --output /abs/path/verifications --evidence-dir /abs/path/evidence \
  --operator <your-id> [--verification-id <id>] [--mongorestore /abs/path/to/mongorestore]
```

All options except `--verification-id` and `--mongorestore` are required. The verification target's URI is read only from `LIFECYCLE_TARGET_URI` (the D1/D2 convention), never from the command line, `MONGO_URI` or `.env`: a URI on the command line would be visible in the process list. There is no source URI at all. There is no `--force`, `--drop`, `--drop-existing`, `--allow-production`, `--skip-safety`, `--yes-really`, `--target-uri` or any other override: unknown options exit 2.

| Exit | Meaning |
|---|---|
| 0 | Restored and verified; `restore-verification.json` written |
| 2 | Refused before restore: arguments, D1 identity, operation not allowed, source = target (database, fingerprint or server), ambiguous identity, live identity, target not empty, unsafe or colliding output |
| 4 | Artifact failed preflight (no restore started), tooling, connection, permission, mongorestore failure, artifact changed, restored content does not match (NOT VERIFIED), evidence |
| 130 | Interrupted (SIGINT / SIGTERM): NOT VERIFIED |

## Safety boundary

1. **Artifact preflight (offline, before any connection).** `--artifact` must be an explicit, absolute, canonical path to one directory; no discovery, no "latest", no search. It must not be a symbolic link or reached through one, and may contain only regular files: the manifest and the one archive it lists. Refused: missing directory, an `INCOMPLETE.json` marker, a missing, unreadable, invalid or re-edited manifest (the D1 validator checks the schema and the seal), any status other than `backupCreated: true`, `artifactChecksumsValid: true`, `restoreVerified: false`, anything but a complete `mongodump-archive-gzip` capture with one database archive and a `quiescent-verified` database hash, an unexpected file, and an archive that is missing, truncated, resized or fails its SHA-256 (D2's `verifyBackupArtifact`). Any failure exits before mongorestore can start. The artifact is checked again (manifest bytes, archive size and SHA-256) after the restore; a change fails the run.
2. **Source identity from the manifest only.** D3 reads the manifest's sanitized source fingerprint, source database name, topology and profile class. It needs no source URI or credentials and never connects to the source; a backup whose source no longer exists verifies normally. Only backups of `local`/`disposable` sources are accepted.
3. **Target identity (D1).** The profile must declare the verification target exactly (scheme, hosts, database, replica set), be `local`/`disposable` on loopback, and list the operation **`restore-verify`** explicitly. `restore-verify` is the only write operation in the lifecycle tooling (class `write-nonproduction`); it is never implied by `backup` or `inventory`. Staging, production, `mongodb+srv`, managed-cloud hosts and production-looking names are refused by D1.
4. **Source ≠ target proof.** Refused unless all hold:
   - the verification database name differs from the source database name (`SAME_DATABASE`);
   - the target fingerprint differs from the source fingerprint (`SAME_TARGET`);
   - the target is a replica set: a standalone target cannot be proven distinct (`SOURCE_TARGET_AMBIGUOUS`);
   - re-fingerprinting the target's declared server with the **source** database name, for every subset of its declared hosts, with and without its replica-set name, never yields the source fingerprint (`SAME_SOURCE_SERVER`, before connecting);
   - the same check with the members and replica-set name the live server reports (`SAME_SOURCE_SERVER`, after connecting). D2 accepts a replica-set source only under its canonical member names, so a backup of this same replica set matches here even if the profile spells hosts differently.
5. **Live identity (D2 rules, read-only).** Primary; declared replica-set name; `hello.me` declared; every member on loopback; every declared host a member; no mongos; production- or Atlas-looking set names refused.
6. **Empty target.** The exact verification database must have **no collections** (absent or empty). Anything else — an unrelated collection, an application collection, one document — is refused (`TARGET_NOT_EMPTY`). Nothing is ever dropped, cleared or overwritten; there is no `--drop`.

**Residual limitation (as D1/D2).** MongoDB cannot prove the physical machine behind a port. A loopback port forwarded to another server that also reports loopback member names and the declared replica-set name would pass the live checks. Use a dedicated, non-shared host and keep disposable servers on ports that are not forwarded. The source-server check is identity-based: a source reached under a non-canonical host spelling, or a server restarted under a different topology, may not be recognised; the source database is nevertheless never written, because the restore can only go to an empty database with a different name through an exact namespace mapping.

## mongorestore, credentials and namespace mapping

- **Tool.** `mongorestore` (MongoDB Database Tools; verified with 100.13.0), located like mongodump (`--mongorestore` absolute path, or the absolute entries of `PATH`; never downloaded). The `--version` probe runs with the filtered environment and must report `mongorestore version:`.
- **Arguments (exact):** `mongorestore --config=<private FIFO> --archive=<artifact>/database.archive.gz --gzip --nsInclude=<source>.* --nsFrom=<source>.* --nsTo=<verification>.* --stopOnError --quiet`. Argument array, `shell: false`. Never `--drop`, `--uri`, `--db`, `--oplogReplay`, `--restoreDbUsersAndRoles` or `--preserveUUID`.
- **Credentials.** Exactly the D2 mechanism (`secretpipe.js`): the URI is written once to a FIFO (0600, size 0) in a fresh private directory (0700) and given to mongorestore's documented `--config` (`uri:` key; verified for mongorestore 100.13.0). No user name, password, host, database or URI is in argv; the child environment drops `LIFECYCLE_TARGET_URI` and every value containing `mongodb://` or `mongodb+srv://`; `mkfifo` runs with an empty environment. The pipe and directory are removed on success, failure and SIGINT/SIGTERM. After SIGKILL or power loss at most an **empty** private FIFO directory remains (no data; delete by hand).
- **Connection string given to mongorestore.** The D1-verified target URI **without its database path**, with `authSource=<verification database>` added unless the URI already names an `authSource` (this is the driver's own default). Verified with 100.13.0: a database in the URI path is treated as the deprecated `--db` and competes with `--nsTo`; without it, `--nsTo` is the single destination.
- **Namespace mapping.** Exactly `<source>.*` → `<verification>.*`, restricted by `--nsInclude=<source>.*`. Both names must match D1's database-name rule (`[A-Za-z0-9_-]`), so they contain no namespace-pattern characters and the mapping cannot reach another database; identical names are refused. (Verified: a non-matching `--nsInclude` restores nothing and still exits 0, which is why exit 0 is never taken as success on its own.)
- **Minimum privileges:** `readWrite` on the verification database only (mongorestore creates collections, views and indexes and inserts; D3 then reads `listCollections`, `dbHash`, counts and indexes). No admin, cluster, `restore` or `system.views` privileges are needed.

## Verification methodology

After mongorestore exits 0, D3 re-checks the artifact, then reads the restored database (read-only adapter `mongoread.js`) and compares it with the manifest. Any difference means **NOT VERIFIED** (exit 4):

| Check | Rule |
|---|---|
| Collection set | Every manifest collection exists; no other collection exists (`MISSING_COLLECTION`, `UNEXPECTED_COLLECTION`). Collections unknown to the repository are restored and verified like any other and listed in the result. |
| Type | Equal (`collection`, `view`, …). |
| Options | Equal, order-sensitive (capped size/max, validator, collation, view `viewOn`/`pipeline`). |
| Count | Equal ordinary document counts; views explicitly `null` / not applicable; `system.views` definition count derived from metadata. Legacy numeric view counts remain supported. |
| Indexes | Same names, same key **in the same field order**, same uniqueness. |
| Content | Per collection, `sha256(canonical {dbHash md5, count})` equals the manifest fingerprint. |
| Database hash | `sha256(dbHash md5)` equals the manifest's `databaseHashSha256` — when the backup has no views (see below). |

### dbHash findings (verified with MongoDB 8.3.7 and mongorestore 100.13.0)

- `dbHash` hashes a collection's documents, not its namespace: after restoring into a differently named database, every ordinary collection's hash is identical, and with no views the database-level md5 is identical too. D3 therefore requires equality for both.
- `system.views` is the exception: its documents' `_id` is `"<database>.<view>"`, so its hash (and the database-level md5, which includes it) necessarily changes with the database name. D3 does not fake that equality: for `system.views` the content check is the view **definitions** (every view's type and order-sensitive options must match) plus the number of views, and the database hash is reported as `not-comparable` with the reason.
- D2 and D3 use the same `captureState` metadata inventory. `system.views` cannot be counted or have its indexes listed with `read` / `readWrite` on the tested authenticated server. Its count is the number of listed views; new D2 manifests explicitly record `indexes: []`, `indexesInspected: false`, and D3 reports these server-managed indexes as not inspected. Legacy manifests recording only the default `_id_` index remain accepted; other index claims fail (`INDEX_NOT_VERIFIABLE`). Views have no stored documents: new manifests use `count: null`, `countSemantics: "not-applicable"`; D3 verifies definitions without querying view data. Only legacy manifests with a numeric view count require evaluating that view for compatibility.

## Results and failure behaviour

- **Success:** `<output>/<verification-id>/restore-verification.json` (mode 0600, written exclusively, sealed; schema `expresso.lifecycle.restore-verification/1`). It references the D2 artifact id, manifest seal digest, manifest file SHA-256 (unchanged), archive size and SHA-256, the source fingerprint, profile class, database and topology, the D2 status (still `restoreVerified: false`), the verification target fingerprint, profile, verification database, live topology and the distinctness checks, mongorestore version, start / restore-complete / end times (UTC), the namespace mapping, every per-collection comparison, the database-hash result, unknown collections, the evidence records it builds on (type, sequence, digest), what it proves and does not prove, and `status: { restoreSucceeded: true, contentVerified: true, restoreVerified: true }`. The validator rejects any document whose `restoreVerified` is true without a successful restore and a comparison with no problems, whose seal does not match, that equates target and source, or that contains secret-like content.
- **Failure or interruption after the restore started:** no `restore-verification.json`; a `NOT-VERIFIED.json` marker instead (code, sanitized category, whether the restore started, comparison problems as codes and collection names, the verification database name). **The verification database is left exactly as it is** — possibly holding a partial restore — for diagnosis: D3 has no drop or clean-up capability, by design. Review it, then drop that disposable database manually.
- **Refusals before the restore** (preflight, identity, empty target): no output directory and no database change.
- **Interrupts:** SIGINT/SIGTERM stop mongorestore (SIGTERM), exit 130, write `NOT-VERIFIED.json` (`category: interrupted`) and record `restore.failed`. SIGKILL/power loss: no verification artifact can be produced; at most an empty private FIFO directory remains; the verification database may be partial.
- **Output:** `--output` must be an existing, absolute, canonical, non-symlink directory outside the repository and outside the artifact; each run creates exactly one new directory; an existing verification id is refused (never overwritten). Evidence must also be outside the artifact.

## Evidence

Appended to `<evidence-dir>/lifecycle-evidence.jsonl` (D1 format: append-only, hash-chained; tamper evidence, not tamper proof): `restore.requested`, `restore.identity-verified`, `restore.started`, `restore.completed`, `verification.completed` (`succeeded` with the verification seal digest, or `failed` with category `integrity` when the content does not match), or `restore.failed` with a sanitized category. A failed verification never claims recoverability.

## How D3 was verified

- Unit tests with real D2 artifacts (made by `runBackup` with fakes), a fake read-only target and a fake mongorestore (`test/lifecycle/restoreverify.test.js`), plus a stand-in executable that records the real child's argv and environment.
- Opt-in live end-to-end test (`test/lifecycle/restoreverify.integration.test.js`) on two explicitly started disposable replica sets, synthetic data only: source A (`--replSet rs0 --port 27999`, no auth) where the real D2 command backs up, and verification target B (`--replSet rsv --auth --keyFile … --port 27996`). Set `LIFECYCLE_D2_TEST_HOST`, `LIFECYCLE_D2_TEST_RS`, `LIFECYCLE_D3_TARGET_HOST`, `LIFECYCLE_D3_TARGET_RS`, `LIFECYCLE_D3_TARGET_ADMIN_URI` (an administrator on B, used by the harness only to create and drop its own users and databases), `LIFECYCLE_MONGODUMP`, `LIFECYCLE_MONGORESTORE`.
- Opt-in process-list test (`test/lifecycle/restoreverify.argv.integration.test.js`, Linux): reads only the CLI's own mongorestore children in `/proc`, with special-character credentials, during success, SIGINT and SIGKILL.

## Phase status

| Phase | Status |
|---|---|
| R5-D1 identity, manifests, inventory, evidence | Complete / committed / pushed |
| R5-D2 backup creation | Complete / committed / pushed |
| R5-D3 restore verification (disposable targets) | Complete / committed / pushed |
| R5-D4 seed separation | Not started |
| R5-D5 bounded nonproduction reset | Not started |
