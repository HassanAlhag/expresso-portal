import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const DEFAULT_REGION = "us-east-1";
const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = resolve(__dirname, "../../uploads");
let cachedClient;
let cachedRegion;

function getS3Config() {
  const region = process.env.AWS_REGION || DEFAULT_REGION;
  const bucket =
    process.env.AWS_S3_BUCKET ||
    process.env.S3_BUCKET ||
    process.env.AWS_BUCKET_NAME;

  return { region, bucket };
}

function getS3Client(region) {
  if (cachedClient && cachedRegion === region) return cachedClient;

  cachedRegion = region;
  cachedClient = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  return cachedClient;
}

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

function canUseLocalUploads() {
  return (process.env.NODE_ENV || "development") !== "production";
}

function getLocalPublicUrl(key) {
  const baseUrl =
    process.env.API_PUBLIC_URL ||
    process.env.PORTAL_API_PUBLIC_URL ||
    `http://localhost:${process.env.PORT || 5050}`;

  return `${baseUrl.replace(/\/$/, "")}/uploads/${key}`;
}

async function uploadBufferLocally(buffer, key) {
  const target = path.join(UPLOAD_ROOT, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);

  return {
    url: getLocalPublicUrl(key),
    key,
  };
}

export function getS3PublicUrl(key) {
  const { region, bucket } = getS3Config();

  if (!bucket && canUseLocalUploads()) {
    return getLocalPublicUrl(key);
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function uploadToS3(buffer, folder, originalName, contentType) {
  const { region, bucket } = getS3Config();
  const key = makeKey(folder, originalName);

  if (!bucket) {
    if (canUseLocalUploads()) {
      return uploadBufferLocally(buffer, key);
    }

    throw new Error(
      "AWS_S3_BUCKET is not configured. Add it to portal-api/.env or export it before starting portal-api."
    );
  }

  await getS3Client(region).send(
    new PutObjectCommand({
      Bucket: bucket,
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
  const { region, bucket } = getS3Config();
  const key = makeKey(folder, originalName, suffix, ext);

  if (!bucket) {
    if (canUseLocalUploads()) {
      return uploadBufferLocally(buffer, key);
    }

    throw new Error(
      "AWS_S3_BUCKET is not configured. Add it to portal-api/.env or export it before starting portal-api."
    );
  }

  await getS3Client(region).send(
    new PutObjectCommand({
      Bucket: bucket,
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
  const { region, bucket } = getS3Config();

  if (!key) return;

  if (!bucket && canUseLocalUploads()) {
    await fs.unlink(path.join(UPLOAD_ROOT, key)).catch(() => {});
    return;
  }

  if (!bucket) return;

  await getS3Client(region).send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
