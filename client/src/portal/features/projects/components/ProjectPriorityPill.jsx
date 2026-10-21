import React from "react";
import { Flag } from "lucide-react";
import { PRIORITY_TONE, priorityLabel } from "../format";

// Priority is secondary to status: plain text with a flag, coloured only for
// high and urgent.
export default function ProjectPriorityPill({ priority }) {
  const p = priority || "medium";
  const tone = PRIORITY_TONE[p];
  return (
    <span className="px-priority" data-tone={tone === "idle" ? undefined : tone}>
      <Flag size={13} aria-hidden="true" />
      {priorityLabel(p)}
      <span className="sr-only"> priority</span>
    </span>
  );
}
