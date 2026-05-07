import React from "react";
import Card from "../../../../shared/ui/Card";
import EmptyState from "../../../../shared/ui/EmptyState";
import { Activity } from "lucide-react";

export default function ActivityTab({ user }) {
  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          USER ACTIVITY
        </div>
        <div className="mt-2 text-sm text-slate-600">
          This area will show role changes, password resets, login events,
          activation/deactivation, and administrative actions for this user.
        </div>
      </Card>

      <EmptyState
        icon={Activity}
        title="No activity loaded yet"
        message={`Next step: connect audit records for ${
          user?.fullName || "this user"
        } from the backend activity log.`}
      />
    </div>
  );
}
