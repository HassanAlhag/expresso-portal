// Private storage for confidential uploads (client files, CVs, internal
// documents). Objects are never given a public URL; access is through a
// short-lived signed link issued only after the API has checked permissions
// and tenant ownership (audit S2).
//
// Production: S3. Use a separate bucket with Block Public Access enabled
// (AWS_S3_PRIVATE_BUCKET). If only AWS_S3_BUCKET is set, objects go under the
// "private/" prefix of that bucket, and the bucket policy MUST NOT allow
// public reads of private/* (see docs/storage.md).
// Development (no bucket): files are written to portal-api/private-uploads/,
// which is NOT served statically, and downloaded via a signed token route.

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";
import { publicBucket } from "./s3.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const LOCAL_PRIVATE_ROOT = resolve(__dirname, "../../private-uploads");
export const PRIVATE_PREFIX = "private/";
const LINK_TTL_SECONDS = 5 * 60;

let client;
function s3() {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

// Deliberately narrower than the public resolver (s3.js publicBucket): the
// deprecated public aliases S3_BUCKET / AWS_BUCKET_NAME are NOT a private
// fallback, so private files never move into a bucket named only by an alias.
export function privateBucket() {
  return process.env.AWS_S3_PRIVATE_BUCKET || process.env.AWS_S3_BUCKET || "";
}

function isProduction() {
  return (process.env.NODE_ENV || "development") === "production";
}

function safeBase(originalName = "file") {
  const ext = path.extname(originalName || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
  const base = path
    .basename(originalName || "file", path.extname(originalName || ""))
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/gi, "")
    .slice(0, 48)
    .toLowerCase();
  return { base: base || "file", ext };
}

export function isPrivateKey(key) {
  return typeof key === "string" && key.startsWith(PRIVATE_PREFIX);
}

/** Store a buffer privately. Returns { key } — there is deliberately no url. */
export async function putPrivate(buffer, folder, originalName, contentType) {
  const { base, ext } = safeBase(originalName);
  const cleanFolder = String(folder || "misc").replace(/[^a-z0-9-]/gi, "");
  const key = `${PRIVATE_PREFIX}${cleanFolder}/${Date.now().toString(16)}-${crypto
    .randomBytes(8)
    .toString("hex")}-${base}${ext}`;

  const bucket = privateBucket();
  if (!bucket) {
    if (isProduction()) {
      throw new Error("Private storage is not configured (AWS_S3_PRIVATE_BUCKET)");
    }
    const target = path.join(LOCAL_PRIVATE_ROOT, key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);
    return { key };
  }

  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
      ServerSideEncryption: "AES256",
    })
  );
  return { key };
}

function contentDisposition(filename, inline) {
  const name = String(filename || "download").replace(/["\r\n]/g, "");
  return `${inline ? "inline" : "attachment"}; filename="${name}"`;
}

/**
 * A short-lived link to a private object. Call ONLY after authorization.
 * `inline: true` lets images/PDFs open in the browser instead of downloading.
 */
export async function privateDownloadUrl(key, { filename, inline = true } = {}) {
  if (!isPrivateKey(key)) throw new Error("Not a private storage key");
  const bucket = privateBucket();
  if (!bucket) {
    const token = jwt.sign({ k: key, n: filename || "", i: inline }, env.jwtSecret, {
      expiresIn: LINK_TTL_SECONDS,
    });
    const base = (
      process.env.API_PUBLIC_URL ||
      process.env.PORTAL_API_PUBLIC_URL ||
      `http://localhost:${process.env.PORT || 5050}`
    ).replace(/\/$/, "");
    return `${base}/api/private-files/${encodeURIComponent(token)}`;
  }
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: contentDisposition(filename, inline),
    }),
    { expiresIn: LINK_TTL_SECONDS }
  );
}

export async function deletePrivate(key) {
  if (!isPrivateKey(key)) return;
  const bucket = privateBucket();
  if (!bucket) {
    await fs.unlink(path.join(LOCAL_PRIVATE_ROOT, key)).catch(() => {});
    return;
  }
  await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Used by the migration script: copy a legacy public object into private storage. */
export async function copyPublicObjectToPrivate(publicKey, folder) {
  const sourceBucket = publicBucket();
  const bucket = privateBucket();
  if (!sourceBucket || !bucket) throw new Error("S3 buckets are not configured");
  const { base, ext } = safeBase(path.basename(publicKey));
  const key = `${PRIVATE_PREFIX}${folder}/${Date.now().toString(16)}-${crypto
    .randomBytes(8)
    .toString("hex")}-${base}${ext}`;
  await s3().send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: key,
      CopySource: `${sourceBucket}/${publicKey.split("/").map(encodeURIComponent).join("/")}`,
      ServerSideEncryption: "AES256",
      ACL: "private",
    })
  );
  return { key };
}

/** Development-only: resolve a signed local token to a file on disk. */
export function resolveLocalToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (!isPrivateKey(payload?.k)) throw new Error("Invalid token");
  const full = path.resolve(LOCAL_PRIVATE_ROOT, payload.k);
  if (!full.startsWith(LOCAL_PRIVATE_ROOT + path.sep)) throw new Error("Invalid path");
  return { path: full, filename: payload.n || path.basename(full), inline: payload.i !== false };
}
