// portal-api/src/utils/s3.js

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import path from "path";

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.AWS_S3_BUCKET;

if (!BUCKET) {
  console.warn("⚠️ AWS_S3_BUCKET is not set.");
}

if (!process.env.AWS_ACCESS_KEY_ID) {
  console.warn("⚠️ AWS_ACCESS_KEY_ID is not set.");
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn("⚠️ AWS_SECRET_ACCESS_KEY is not set.");
}

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function makeKey(folder = "uploads", originalName = "file") {
  const ext = path.extname(originalName || "").toLowerCase();

  const base = path
    .basename(originalName || "file", ext)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/gi, "")
    .slice(0, 48)
    .toLowerCase();

  const stamp = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2, 10);

  return `${folder}/${base || "file"}-${stamp}-${rand}${ext}`;
}

export async function uploadToS3(
  buffer,
  folder = "uploads",
  originalName = "file",
  contentType = "application/octet-stream"
) {
  if (!BUCKET) {
    throw new Error("AWS_S3_BUCKET is not configured.");
  }

  if (!buffer) {
    throw new Error("No file buffer provided for S3 upload.");
  }

  const key = makeKey(folder, originalName);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
    })
  );

  return {
    key,
    url: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`,
  };
}

export async function deleteFromS3(key) {
  if (!BUCKET || !key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}
