# File storage

Two kinds of uploads:

| Kind | Examples | Where | How it is opened |
| --- | --- | --- | --- |
| Public media | Website images, portfolio, slides, Media Library | `AWS_S3_BUCKET` (public read) or `portal-api/uploads/` locally | Direct URL |
| Private documents | Client files (Files module), CVs, service-template attachments | `AWS_S3_PRIVATE_BUCKET` (or `private/` prefix), or `portal-api/private-uploads/` locally | API checks permissions and tenant, then returns a 5-minute signed link |

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
prefix of `AWS_S3_BUCKET`. In that case the bucket policy must NOT grant public
read on `private/*` — a typical public-read policy on `*` would expose them.
Using a separate bucket is strongly recommended.

In production the API refuses private uploads when no bucket is configured
(it never silently falls back to public storage).

## Git

`portal-api/uploads/` and `portal-api/private-uploads/` are ignored. Files that
were committed before (including a CV) were removed from the index in
`stabilize/phase-a`; they still exist in older commits. Purging them from
history requires rewriting history and a force-push — a separate, deliberate step.
