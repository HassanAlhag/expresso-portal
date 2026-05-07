import React from "react";
import StatusPill from "../../../shared/ui/StatusPill";

const STATUS_TONE = {
  submitted: "info",
  approved: "success",
  rejected: "danger",
  registered: "warning",
  paid: "success",
};

export default function ExpenseStatusPill({ status }) {
  const value = String(status || "submitted").toLowerCase();
  const label = value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <StatusPill tone={STATUS_TONE[value] || "neutral"}>{label}</StatusPill>
  );
}
