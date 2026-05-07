// src/scripts/seedUser.js
import "dotenv/config";
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";
import User from "../modules/iam/users/user.model.js";

async function run() {
  await connectDB();

  const email = (env.superAdminEmail || "").trim().toLowerCase();
  const password = String(env.superAdminPassword || "");
  const fullName = (env.superAdminName || "Super Admin").trim();

  if (!email || !password) {
    console.log("❌ Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in .env");
    process.exit(1);
  }

  const passwordHash = await User.hashPassword(password);

  const doc = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        fullName,
        email,
        role: "super_admin",
        isActive: true,
        permissions: [
          "users.read",
          "users.write",
          "services.read",
          "services.write",
          "customers.read",
          "customers.write",
        ],
        passwordHash,
      },
    },
    { upsert: true, new: true }
  ).select("fullName email role isActive");

  console.log("✅ Seeded super_admin:", {
    id: String(doc._id),
    fullName: doc.fullName,
    email: doc.email,
    role: doc.role,
    isActive: doc.isActive,
  });

  process.exit(0);
}

run().catch((e) => {
  console.error("❌ seedUser failed:", e);
  process.exit(1);
});
