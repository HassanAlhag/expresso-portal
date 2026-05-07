import "dotenv/config";
import bcrypt from "bcryptjs";
import User from "../modules/iam/users/user.model.js";
import { connectDB } from "../config/db.js";

const run = async () => {
  await connectDB();

  const email = "admin@expresso.com";
  const user = await User.findOne({ email }).select("+passwordHash +password");

  if (!user) {
    console.log("❌ User not found:", email);
    process.exit(0);
  }

  console.log("✅ Found user:", {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    hasPasswordHash: Boolean(user.passwordHash),
    hasPassword: Boolean(user.password),
  });

  // Try compare with what you think the password is
  const okHash = user.passwordHash
    ? await bcrypt.compare("Admin12345", user.passwordHash)
    : false;

  const okLegacy = user.password
    ? await bcrypt.compare("Admin12345", user.password)
    : false;

  console.log("Compare Admin12345 =>", { okHash, okLegacy });

  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
