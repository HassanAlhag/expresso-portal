// src/portal/features/iam/roles/components/RoleEditor.jsx
import React, { useEffect, useMemo, useState } from "react";
import RightDrawer from "../../../../shared/ui/RightDrawer";
import Button from "../../../../shared/ui/Button";
import Input from "../../../../shared/ui/Input";
import Badge from "../../../../shared/ui/Badge";
import { createRole, updateRole } from "../api";

const PERMISSION_GROUPS = [
  {
    title: "Dashboard",
    items: ["dashboard.view"],
  },
  {
    title: "Users",
    items: ["users.view", "users.manage"],
  },
  {
    title: "Clients",
    items: ["clients.view", "clients.manage"],
  },
  {
    title: "Projects",
    items: ["projects.view", "projects.manage"],
  },
  {
    title: "Jobs",
    items: ["jobs.view", "jobs.manage"],
  },
  {
    title: "Productions",
    items: ["productions.view", "productions.manage"],
  },
  {
    title: "Media",
    items: ["media.view", "media.manage"],
  },
  {
    title: "Reports",
    items: ["reports.view"],
  },
  {
    title: "Billing",
    items: ["billing.view"],
  },
];

function prettyPermission(p) {
  return String(p).replace(".", " / ").toUpperCase();
}

export default function RoleEditor({
  open,
  initial,
  onClose,
  onSaved,
  busy,
  setBusy,
}) {
  const isEdit = Boolean(initial?._id || initial?.key);

  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");
    setKey(initial?.key || "");
    setLabel(initial?.label || initial?.name || "");
    setDescription(initial?.description || "");
    setPermissions(
      Array.isArray(initial?.permissions) ? initial.permissions : []
    );
  }, [open, initial]);

  const canSave = useMemo(() => {
    return Boolean(key.trim()) && Boolean(label.trim());
  }, [key, label]);

  const togglePermission = (perm) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((x) => x !== perm) : [...prev, perm]
    );
  };

  const save = async () => {
    setError("");
    setBusy(true);

    try {
      const payload = {
        key: key.trim(),
        label: label.trim(),
        description: description.trim(),
        permissions,
      };

      if (isEdit) {
        await updateRole(initial._id || initial.key, payload);
      } else {
        await createRole(payload);
      }

      onSaved?.();
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to save role"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <RightDrawer
      open={open}
      title={isEdit ? "Edit role" : "New role"}
      subtitle={
        isEdit
          ? "Update role details and permissions."
          : "Create a new access role."
      }
      onClose={onClose}
    >
      <div className="grid gap-4">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-extrabold text-rose-700">
            {error}
          </div>
        ) : null}

        <Input
          label="Role key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="e.g. manager"
          hint="Machine key, usually lowercase with underscores."
        />

        <Input
          label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Manager"
        />

        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="mb-2 text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
            DESCRIPTION
          </div>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary of what this role can do..."
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-black/5"
          />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
            PERMISSIONS
          </div>

          <div className="mt-4 grid gap-4">
            {PERMISSION_GROUPS.map((group) => (
              <div
                key={group.title}
                className="rounded-2xl border border-black/10 p-4"
              >
                <div className="text-sm font-black text-slate-900">
                  {group.title}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((perm) => {
                    const active = permissions.includes(perm);

                    return (
                      <button
                        key={perm}
                        type="button"
                        onClick={() => togglePermission(perm)}
                        className={`rounded-full border px-3 py-2 text-xs font-black tracking-[0.12em] transition ${
                          active
                            ? "border-[var(--brand)] bg-[rgba(111,127,217,0.10)] text-slate-900"
                            : "border-black/10 bg-white text-slate-600 hover:bg-black/[0.03]"
                        }`}
                      >
                        {prettyPermission(perm)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {permissions.map((p) => (
              <Badge key={p} tone="neutral">
                {p}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave || busy}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create role"}
          </Button>
        </div>
      </div>
    </RightDrawer>
  );
}
