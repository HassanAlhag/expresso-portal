# File storage

Two kinds of uploads:

| Kind | Examples | Where | How it is opened |
| --- | --- | --- | --- |
| Public media | Website images, portfolio, slides, Media Library | `AWS_S3_BUCKET` (public read) or `portal-api/uploads/` locally | Direct URL |
| Private documents | Client files (Files module), CVs, service-template attachments | `AWS_S3_PRIVATE_BUCKET` (or `private/` prefix), or `portal-api/private-uploads/` locally | API checks permissions and tenant, then returns a 5-minute signed link |

## Bucket configuration names

| Setting | Canonical name | Also accepted (deprecated) |
| --- | --- | --- |
| Public bucket | `AWS_S3_BUCKET` | `S3_BUCKET`, then `AWS_BUCKET_NAME` |
| Private bucket | `AWS_S3_PRIVATE_BUCKET` | none |

`S3_BUCKET` and `AWS_BUCKET_NAME` are compatibility aliases for the **public**
bucket only, scheduled for removal after a compatibility period. One resolver
(`publicBucket()` in `src/utils/s3.js`) applies them everywhere the public bucket
is read: uploads, the admin system-status panel and the migration source below.
When an alias is used the API logs a one-time deprecation warning naming the
variable (never its value). Set `AWS_S3_BUCKET` instead.

The aliases are **not** a private-storage fallback: private storage uses
`AWS_S3_PRIVATE_BUCKET`, or the `private/` prefix of `AWS_S3_BUCKET` (see
below), and nothing else.

## Production setup (required before relying on private storage)

1. Create a bucket for private documents, e.g. `expresso-portal-private`, with
   **Block Public Access: ON** (all four settings). Default encryption SSE-S3.
2. Give the API's IAM user `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`
   on `arn:aws:s3:::expresso-portal-private/*`, and `s3:GetObject` on the public
   bucket (needed by the migration copy).
3. Set `AWS_S3_PRIVATE_BUCKET=expresso-portal-private` on the API host.
4. Run the migration (staging first):
   ```
   node src/scripts/migrateConfidentialFiles.js            # dry run
   node src/scripts/migrateConfidentialFiles.js --apply --allow-remote
   node src/scripts/migrateConfidentialFiles.js --apply --delete-public --allow-remote
   ```

If `AWS_S3_PRIVATE_BUCKET` is not set, private files go under the `private/`
prefix of `AWS_S3_BUCKET` (the canonical name only; a deprecated alias is not
used for this). In that case the bucket policy must NOT grant public
read on `private/*` — a typical public-read policy on `*` would expose them.
Using a separate bucket is strongly recommended.

In production the API refuses private uploads when no bucket is configured
(it never silently falls back to public storage).

## Git

`portal-api/uploads/` and `portal-api/private-uploads/` are ignored. Files that
were committed before (including a CV) were removed from the index in
`stabilize/phase-a`; they still exist in older commits. Purging them from
history requires rewriting history and a force-push — a separate, deliberate step.
