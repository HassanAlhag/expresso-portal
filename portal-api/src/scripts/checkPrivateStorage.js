// Verifies the private S3 bucket end to end, using a throwaway object:
//  1. upload works, 2. a signed link downloads it, 3. the plain (unsigned)
//  URL is DENIED (proves the bucket is not public), 4. cleanup.
//   node src/scripts/checkPrivateStorage.js
import "dotenv/config";
import {
  putPrivate,
  privateDownloadUrl,
  deletePrivate,
  privateBucket,
} from "../utils/privateStorage.js";

const bucket = process.env.AWS_S3_PRIVATE_BUCKET;
if (!bucket) {
  console.error("AWS_S3_PRIVATE_BUCKET is not set.");
  process.exit(1);
}
console.log(`Bucket: ${privateBucket()} (region ${process.env.AWS_REGION || "us-east-1"})`);

let key;
try {
  ({ key } = await putPrivate(Buffer.from("expresso-storage-check"), "healthcheck", "check.txt", "text/plain"));
  console.log("✅ 1. Upload OK");

  const signed = await privateDownloadUrl(key, { filename: "check.txt" });
  const ok = await fetch(signed);
  if (ok.status !== 200 || (await ok.text()) !== "expresso-storage-check") throw new Error(`signed download returned ${ok.status}`);
  console.log("✅ 2. Signed link works");

  const plain = `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
  const denied = await fetch(plain);
  if (denied.status === 200) {
    console.error("❌ 3. The object is PUBLICLY readable. Turn on Block Public Access and remove any public bucket policy.");
    process.exitCode = 1;
  } else {
    console.log(`✅ 3. Unsigned access denied (HTTP ${denied.status})`);
  }
} catch (e) {
  console.error(`❌ Check failed: ${e.name || ""} ${e.message}`);
  process.exitCode = 1;
} finally {
  if (key) {
    await deletePrivate(key).catch(() => {});
    console.log("4. Test object removed");
  }
}
