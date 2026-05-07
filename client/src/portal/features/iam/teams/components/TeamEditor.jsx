import React, { useEffect, useMemo, useState } from "react";
import RightDrawer from "../../../../shared/ui/RightDrawer";
import Button from "../../../../shared/ui/Button";
import Input from "../../../../shared/ui/Input";
import SmartSelect from "../../../../shared/ui/SmartSelect";
import { createTeam, updateTeam } from "../api";
import { listUsers } from "../../users/api";

export default function TeamEditor({
  open,
  initial,
  onClose,
  onSaved,
  busy,
  setBusy,
}) {
  const isEdit = Boolean(initial?._id);

  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [leadUser, setLeadUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");
    setKey(initial?.key || "");
    setLabel(initial?.label || "");
    setDescription(initial?.description || "");
    setIsActive(initial?.isActive !== false);
    setLeadUser(initial?.leadUserId || null);
  }, [open, initial]);

  const canSave = useMemo(() => {
    return Boolean(key.trim()) && Boolean(label.trim());
  }, [key, label]);

  const save = async () => {
    setError("");
    setBusy(true);

    try {
      const payload = {
        key: key.trim(),
        label: label.trim(),
        description: description.trim(),
        isActive,
        leadUserId: leadUser?._id || null,
      };

      if (isEdit) {
        await updateTeam(initial._id, payload);
      } else {
        await createTeam(payload);
      }

      onSaved?.();
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to save team"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <RightDrawer
      open={open}
      title={isEdit ? "Edit team" : "New team"}
      subtitle={isEdit ? "Update team details." : "Create a new team."}
      onClose={onClose}
    >
      <div className="grid gap-4">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-extrabold text-rose-700">
            {error}
          </div>
        ) : null}

        <Input
          label="Team key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="e.g. creative"
          hint="Machine key, lowercase recommended."
        />

        <Input
          label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Creative"
        />

        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="mb-2 text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
            DESCRIPTION
          </div>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary about this team..."
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-black/5"
          />
        </div>

        <SmartSelect
          label="TEAM LEAD"
          value={leadUser}
          onChange={setLeadUser}
          loadOptions={({ q, limit }) => listUsers({ q, limit }).then(r => ({ items: r.items || [] }))}
          renderValue={(u) => <span className="font-extrabold text-slate-900">{u.fullName}</span>}
          renderOption={(u) => (
            <div>
              <div className="text-sm font-extrabold text-slate-900">{u.fullName}</div>
              <div className="text-xs text-slate-500">{u.email}</div>
            </div>
          )}
          placeholder="Select team lead (optional)…"
        />

        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
            STATUS
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-slate-900">
              {isActive ? "Active" : "Inactive"}
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className="h-10 rounded-2xl border border-black/10 bg-white px-4 text-sm font-extrabold hover:bg-black/[0.03]"
            >
              Toggle
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave || busy}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create team"}
          </Button>
        </div>
      </div>
    </RightDrawer>
  );
}
