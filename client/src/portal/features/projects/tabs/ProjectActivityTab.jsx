import React from "react";
import EmptyState from "../../../shared/ui/EmptyState";
import { Activity } from "lucide-react";

export default function ProjectActivityTab() {
  return (
    <div className="rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
      <EmptyState
        icon={Activity}
        title="Activity timeline coming soon"
        message="Scope changes, job creation, approvals, and delivery events for this project will appear here."
      />
    </div>
  );
}
