import React from "react";
import EmptyState from "../../../shared/ui/EmptyState";
import { Activity } from "lucide-react";

export default function CustomerActivityTab() {
  return (
    <div className="rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
      <EmptyState
        icon={Activity}
        title="Activity timeline coming soon"
        message="Edits, job creation, approval events, and delivery updates for this client will appear here."
      />
    </div>
  );
}
