// Inspect a user account's login state without printing secrets.
//   node src/scripts/debugUser.js someone@example.com
// (Previously hard-coded an admin email and tested a guessed password.)
import "dotenv/config";
import User from "../modules/iam/users/user.model.js";
import { connectDB } from "../config/db.js";
import { assertSafeTarget } from "./_guard.js";

const run = async () => {
  const email = String(process.argv[2] || "").trim().toLowerCase();
  if (!email || email.startsWith("--")) {
    console.log("Usage: node src/scripts/debugUser.js <email> [--allow-remote]");
    process.exit(1);
  }
  assertSafeTarget();
  await connectDB();

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    console.log("❌ User not found:", email);
    process.exit(0);
  }

  console.log("✅ Found user:", {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    hasPasswordHash: Boolean(user.passwordHash),
    lastLoginAt: user.lastLoginAt,
    passwordChangedAt: user.passwordChangedAt,
  });
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
