import React from "react";
import StatusPill from "../../../shared/ui/StatusPill";

const TONES = {
  active: "success",
  on_leave: "warning",
  inactive: "neutral",
  resigned: "neutral",
  terminated: "danger",
};

export default function StaffStatusPill({ status }) {
  const value = String(status || "active").toLowerCase();
  const label = value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return <StatusPill tone={TONES[value] || "neutral"}>{label}</StatusPill>;
}
