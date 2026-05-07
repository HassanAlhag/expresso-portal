import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Role from "../modules/iam/roles/role.model.js";

const ROLES = [
  {
    key: "super_admin",
    label: "Super Admin",
    description: "Full system access",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "users.view",
      "users.manage",
      "clients.view",
      "clients.manage",
      "projects.view",
      "projects.manage",
      "jobs.view",
      "jobs.manage",
      "productions.view",
      "productions.manage",
      "media.view",
      "media.manage",
      "reports.view",
      "billing.view",
    ],
  },
  {
    key: "admin",
    label: "Admin",
    description: "Administrative access except super admin control",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "users.view",
      "users.manage",
      "clients.view",
      "clients.manage",
      "projects.view",
      "projects.manage",
      "jobs.view",
      "jobs.manage",
      "productions.view",
      "productions.manage",
      "media.view",
      "media.manage",
      "reports.view",
      "billing.view",
    ],
  },
  {
    key: "staff",
    label: "Staff",
    description: "Operational team access",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "clients.view",
      "projects.view",
      "jobs.view",
      "jobs.manage",
      "productions.view",
      "productions.manage",
      "media.view",
      "media.manage",
      "reports.view",
    ],
  },
  {
    key: "client",
    label: "Client",
    description: "Client portal access",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "projects.view",
      "files.view",
      "reports.view",
    ],
  },
];

async function run() {
  await connectDB();

  for (const role of ROLES) {
    await Role.findOneAndUpdate({ key: role.key }, role, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    console.log(`✅ Seeded role: ${role.key}`);
  }

  await mongoose.connection.close();
  console.log("✅ Done");
}

run().catch((err) => {
  console.error("❌ seedRoles failed:", err);
  process.exit(1);
});
