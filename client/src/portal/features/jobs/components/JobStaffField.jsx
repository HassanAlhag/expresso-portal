import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import Alert from "../../../shared/ui/Alert";
import SearchField from "../../../shared/ui/SearchField";
import { useAccess } from "../../../shared/hooks/useAccess";
import { listUsers } from "../../iam/users/api";
import { idOf, personName } from "../format";

/**
 * Staff assignment field (PI tail). The staff list comes from the user
 * directory (GET /api/users), which needs iam.users.read. A user without it
 * is told so plainly instead of seeing an empty list, and current
 * assignments are shown and kept (the caller must not send `assignees`
 * when `canChoose` is false).
 */
export function useCanChooseStaff() {
  return useAccess().can("iam.users.read");
}

export default function JobStaffField({ label = "Assigned staff", value = [], onChange, disabled = false, active = true }) {
  const canChoose = useCanChooseStaff();
  const [state, setState] = useState({ status: "idle", users: [] });
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!active || !canChoose) return undefined;
    let cancelled = false;
    setState({ status: "loading", users: [] });
    listUsers({ isInternal: "true", isActive: "true", limit: 100 })
      .then((r) => !cancelled && setState({ status: "ready", users: r?.users || r?.items || [] }))
      .catch(() => !cancelled && setState({ status: "failed", users: [] }));
    return () => {
      cancelled = true;
    };
  }, [active, canChoose]);

  const selectedIds = useMemo(() => new Set(value.map(idOf)), [value]);
  const shown = useMemo(() => {
    const lq = q.trim().toLowerCase();
    return lq ? state.users.filter((u) => `${personName(u)} ${u.email || ""}`.toLowerCase().includes(lq)) : state.users;
  }, [state.users, q]);

  const toggle = (u) => {
    const id = idOf(u);
    onChange?.(selectedIds.has(id) ? value.filter((v) => idOf(v) !== id) : [...value, u]);
  };

  const chips = value.length ? (
    <div className="px-chip-list" aria-label={`${label}: current`}>
      {value.map((v) => (
        <span key={idOf(v)} className="px-filter-chip" data-static={!canChoose || disabled ? "true" : undefined}>
          {personName(v) || "Staff member"}
          {canChoose && !disabled ? (
            <button type="button" className="px-chip-x" onClick={() => toggle(v)} aria-label={`Remove ${personName(v) || "staff member"}`}>
              <X size={12} aria-hidden="true" />
            </button>
          ) : null}
        </span>
      ))}
    </div>
  ) : null;

  if (!canChoose) {
    return (
      <fieldset className="px-form-section">
        <legend>{label}</legend>
        {chips || <p className="px-muted" style={{ margin: 0 }}>No staff assigned.</p>}
        <Alert title="Staff can't be chosen here">
          Choosing staff needs access to the user directory, which your role doesn't include. {value.length ? "The current assignments are kept." : "Someone with that access can assign staff later."}
        </Alert>
      </fieldset>
    );
  }

  return (
    <fieldset className="px-form-section">
      <legend>{`${label} (${value.length} chosen)`}</legend>
      {chips}
      <SearchField label="Find a staff member" value={q} onChange={setQ} placeholder="Name or email" />
      <div className="px-checklist" role="group" aria-label="Staff members">
        {state.status === "loading" ? (
          <span className="px-muted" style={{ padding: "8px 0" }}>Loading staff…</span>
        ) : state.status === "failed" ? (
          <span className="px-muted" style={{ padding: "8px 0" }}>The staff list didn't load. Current assignments are kept.</span>
        ) : shown.length ? (
          shown.map((u) => (
            <label key={u._id} className="px-check">
              <input type="checkbox" disabled={disabled} checked={selectedIds.has(idOf(u))} onChange={() => toggle(u)} />
              {personName(u) || "Staff member"}
            </label>
          ))
        ) : (
          <span className="px-muted" style={{ padding: "8px 0" }}>{state.users.length ? "No staff match." : "No active staff found."}</span>
        )}
      </div>
    </fieldset>
  );
}
