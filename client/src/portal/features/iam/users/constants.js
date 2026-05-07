// src/portal/features/iam/users/constants.js
import { LayoutGrid, Lock, Activity, StickyNote, Users } from "lucide-react";

export const BRAND = "#7F8AD1";

export const ROLE_OPTIONS = [
  { value: "", label: "All" },
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "client", label: "Client" },
];

export const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

export const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
  { value: "fullName", label: "Name (A–Z)" },
  { value: "-fullName", label: "Name (Z–A)" },
];

export const USER_TABS = [
  { key: "overview", label: "Overview", Icon: LayoutGrid },
  { key: "access", label: "Access", Icon: Users },
  { key: "security", label: "Security", Icon: Lock },
  { key: "activity", label: "Activity", Icon: Activity },
  { key: "notes", label: "Notes", Icon: StickyNote },
];
