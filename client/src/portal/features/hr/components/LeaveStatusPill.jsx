import React from "react";

import StatusPill from "../../../shared/ui/StatusPill";

const TONES = {
  submitted: "info",

  approved: "success",

  rejected: "danger",

  cancelled: "neutral",
};

export default function LeaveStatusPill({ status }) {
  const value = String(status || "submitted").toLowerCase();

  const label = value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return <StatusPill tone={TONES[value] || "neutral"}>{label}</StatusPill>;
}
