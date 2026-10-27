// Moves legacy confidential uploads (client Files and job-application CVs)
// from public S3 URLs into private storage. Safe by default:
//
//   node src/scripts/migrateConfidentialFiles.js            # dry run, prints plan
//   ENV_FILE=~/expresso-prod.env node src/scripts/migrateConfidentialFiles.js --allow-remote
//   node src/scripts/migrateConfidentialFiles.js --apply    # copy + update records
//   node src/scripts/migrateConfidentialFiles.js --apply --delete-public
//                                                         # also delete the public copies
//
// Run against STAGING first. Requires the public bucket (source: AWS_S3_BUCKET,
// or a deprecated alias S3_BUCKET / AWS_BUCKET_NAME) and ideally
// AWS_S3_PRIVATE_BUCKET (destination) in portal-api/.env.
import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// ENV_FILE lets you point at a one-off env file (e.g. production values kept
// outside the project) without changing portal-api/.env.
config({ path: process.env.ENV_FILE ? resolve(process.env.ENV_FILE) : resolve(__dirname, "../../.env") });

const { default: mongoose } = await import("mongoose");
const { connectDB } = await import("../config/db.js");
const { assertSafeTarget } = await import("./_guard.js");
const { default: File } = await import("../modules/files/file.model.js");
const { default: Application } = await import("../modules/careers/application.model.js");
const { copyPublicObjectToPrivate, privateBucket } = await import("../utils/privateStorage.js");
const { deleteFromS3, publicBucket } = await import("../utils/s3.js");

const APPLY = process.argv.includes("--apply");
const DELETE_PUBLIC = process.argv.includes("--delete-public");

function keyFromUrl(url) {
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
  } catch {
    return "";
  }
}

async function main() {
  // A dry run only reads; applying changes is a write.
  assertSafeTarget({ readOnly: !APPLY });
  if (!publicBucket() || !privateBucket()) {
    throw new Error("Set AWS_S3_BUCKET (and preferably AWS_S3_PRIVATE_BUCKET) first.");
  }
  await connectDB();

  const files = await File.find({ isPrivate: { $ne: true }, filename: { $ne: "" } }).lean();
  const apps = await Application.find({ cvUrl: { $ne: "" } }).select("+cvKey cvUrl").lean();
  console.log(`Files to move: ${files.length}; CVs to move: ${apps.length}`);
  console.log(APPLY ? "APPLY mode" : "DRY RUN (add --apply to make changes)");

  let moved = 0;
  for (const f of files) {
    console.log(`file ${f._id}: ${f.filename}`);
    if (!APPLY) continue;
    const { key } = await copyPublicObjectToPrivate(f.filename, "files");
    await File.updateOne({ _id: f._id }, { filename: key, url: "", isPrivate: true });
    if (DELETE_PUBLIC) await deleteFromS3(f.filename);
    moved += 1;
  }
  for (const a of apps) {
    const source = keyFromUrl(a.cvUrl);
    console.log(`cv ${a._id}: ${source || "(external url, skipped)"}`);
    if (!APPLY || !source) continue;
    const { key } = await copyPublicObjectToPrivate(source, "cvs");
    await Application.updateOne({ _id: a._id }, { cvKey: key, cvUrl: "", hasCv: true });
    if (DELETE_PUBLIC) await deleteFromS3(source);
    moved += 1;
  }
  console.log(APPLY ? `Moved ${moved} objects.` : "Nothing changed.");
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e.message || e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
