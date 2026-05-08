import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import path from "path";

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function cleanName(originalName = "file") {
  const ext = path.extname(originalName || "").toLowerCase();
  const base = path
    .basename(originalName || "file", ext)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/gi, "")
    .slice(0, 48)
    .toLowerCase();

  return base || "file";
}

function makeKey(folder, originalName, suffix = "", extOverride = "") {
  const originalExt = path.extname(originalName || "").toLowerCase();
  const ext = extOverride || originalExt || "";
  const base = cleanName(originalName);
  const stamp = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2, 8);

  return `${folder}/${base}${suffix}-${stamp}-${rand}${ext}`;
}

export function getS3PublicUrl(key) {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export async function uploadToS3(buffer, folder, originalName, contentType) {
  if (!BUCKET) {
    throw new Error("AWS_S3_BUCKET is not configured");
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
    url: getS3PublicUrl(key),
    key,
  };
}

export async function uploadBufferToS3({
  buffer,
  folder = "media",
  originalName = "file",
  contentType = "application/octet-stream",
  suffix = "",
  ext = "",
}) {
  if (!BUCKET) {
    throw new Error("AWS_S3_BUCKET is not configured");
  }

  const key = makeKey(folder, originalName, suffix, ext);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return {
    url: getS3PublicUrl(key),
    key,
  };
}

export async function deleteFromS3(key) {
  if (!key || !BUCKET) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}
