import React from "react";
import Badge from "../../../shared/ui/Badge";
import { STATUS_TONE, statusLabel } from "../format";

// Project status in the shared status system. The label is always shown, so
// status never relies on colour.
export default function ProjectStatusPill({ status }) {
  const s = status || "draft";
  return (
    <Badge tone={STATUS_TONE[s] || "neutral"} dot={s !== "draft"}>
      {statusLabel(s)}
    </Badge>
  );
}
