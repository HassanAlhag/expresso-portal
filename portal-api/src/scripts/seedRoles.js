import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { DEFAULT_ROLE_PERMISSIONS } from "../config/permissions.js";
import Role from "../modules/iam/roles/role.model.js";

const ROLES = [
  {
    key: "super_admin",
    label: "Super Admin",
    description: "Full system access",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.super_admin,
  },
  {
    key: "admin",
    label: "Admin",
    description: "Administrative access except super admin control",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.admin,
  },
  {
    key: "operations_manager",
    label: "Admin / Operations Manager",
    description: "Daily operations, client work, delivery, and operational reporting",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.operations_manager,
  },
  {
    key: "finance",
    label: "Finance",
    description: "Invoices, payments, expenses, and finance reports",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.finance,
  },
  {
    key: "procurement_manager",
    label: "Procurement Manager",
    description: "Procurement approvals, supplier control, quotations, and purchase status",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.procurement_manager,
  },
  {
    key: "procurement_officer",
    label: "Procurement Officer",
    description: "Procurement handling with limited approval authority",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.procurement_officer,
  },
  {
    key: "project_manager",
    label: "Project Manager",
    description: "Project execution, task assignment, deliverables, and client updates",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.project_manager,
  },
  {
    key: "staff",
    label: "Staff",
    description: "Operational team access",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.staff,
  },
  {
    key: "hr_management",
    label: "HR / Management",
    description: "Staff performance, HR workflows, and internal productivity reports",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.hr_management,
  },
  {
    key: "staff_client",
    label: "Staff Client",
    description: "External client access for projects, tickets, deliverables, reports, and files",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.staff_client,
  },
  {
    key: "procurement_client",
    label: "Procurement Client",
    description: "External client access for procurement requests and approved procurement files",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.procurement_client,
  },
  {
    key: "client_admin",
    label: "Client Admin",
    description: "Main client-side contact with combined client project and procurement access",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.client_admin,
  },
  {
    key: "client",
    label: "Client",
    description: "Client portal access",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.client,
  },
  {
    key: "vendor",
    label: "Vendor",
    description: "External vendor access for RFQs and support",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.vendor,
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
