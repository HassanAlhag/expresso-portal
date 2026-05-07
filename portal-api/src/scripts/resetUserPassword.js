import "dotenv/config";
import { connectDB } from "../config/db.js";
import User from "../modules/iam/users/user.model.js";

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log(
    "Usage: node src/scripts/resetUserPassword.js <email> <newPassword>"
  );
  process.exit(1);
}

async function run() {
  await connectDB();

  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
  }).select("+passwordHash");
  if (!user) {
    console.log("❌ User not found:", email);
    process.exit(1);
  }

  const passwordHash = await User.hashPassword(String(newPassword));
  user.passwordHash = passwordHash;
  user.isActive = true;
  await user.save();

  console.log("✅ Password reset for:", user.email);
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ reset failed:", e);
  process.exit(1);
});
