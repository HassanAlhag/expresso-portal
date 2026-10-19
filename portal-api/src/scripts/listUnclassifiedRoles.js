// READ-ONLY report: custom roles whose audience (internal/external) has not
// been set, plus users whose role has no definition at all. Changes nothing.
//   node src/scripts/listUnclassifiedRoles.js
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { assertSafeTarget } from "./_guard.js";
import Role from "../modules/iam/roles/role.model.js";
import User from "../modules/iam/users/user.model.js";
import { DEFAULT_ROLE_PERMISSIONS } from "../config/permissions.js";

assertSafeTarget({ readOnly: true });
await connectDB();

const roles = await Role.find({}).select("key label isInternal isSystem permissions").lean();
const counts = Object.fromEntries(
  (await User.aggregate([{ $group: { _id: "$role", n: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } } } }]))
    .map((r) => [r._id, r])
);

const unclassified = roles.filter(
  (r) => typeof r.isInternal !== "boolean" && !DEFAULT_ROLE_PERMISSIONS[r.key]
);
console.log(`\nCustom roles with audience NOT set (treated as External): ${unclassified.length}`);
for (const r of unclassified) {
  const c = counts[r.key] || { n: 0, active: 0 };
  console.log(`- ${r.key} ("${r.label}") · users: ${c.n} (${c.active} active) · permissions: ${(r.permissions || []).length}`);
  console.log(`    ${(r.permissions || []).join(", ") || "(none)"}`);
}

const known = new Set([...roles.map((r) => r.key), ...Object.keys(DEFAULT_ROLE_PERMISSIONS)]);
const orphans = Object.keys(counts).filter((k) => !known.has(k));
console.log(`\nUsers on a role that has no definition: ${orphans.length ? "" : "none"}`);
for (const k of orphans) console.log(`- ${k}: ${counts[k].n} user(s)`);

await mongoose.disconnect();
