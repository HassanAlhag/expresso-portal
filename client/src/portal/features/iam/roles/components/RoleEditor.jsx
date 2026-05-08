import React, { useEffect, useMemo, useState } from "react";
import RightDrawer from "../../../../shared/ui/RightDrawer";
import Button from "../../../../shared/ui/Button";
import Input from "../../../../shared/ui/Input";
import Badge from "../../../../shared/ui/Badge";
import { ChevronDown, ChevronRight, CheckSquare, Square } from "lucide-react";
import { createRole, updateRole } from "../api";
import { PERMISSION_CATALOG } from "../../../../config/permissions";

function DomainGroup({ domain, active, onToggle }) {
  const [open, setOpen] = useState(true);
  const domainKeys    = domain.permissions.map((p) => p.key);
  const activeInGroup = domainKeys.filter((k) => active.includes(k)).length;
  const allSelected   = activeInGroup === domainKeys.length;
  const someSelected  = activeInGroup > 0 && !allSelected;

  const toggleAll = (e) => {
    e.stopPropagation();
    onToggle(domainKeys, !allSelected);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <div
        className="flex cursor-pointer items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 transition hover:bg-slate-100"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleAll} className="flex h-5 w-5 items-center justify-center rounded text-slate-400 transition hover:text-indigo-600">
            {allSelected ? (
              <CheckSquare size={16} className="text-indigo-600" />
            ) : someSelected ? (
              <CheckSquare size={16} className="text-slate-300" />
            ) : (
              <Square size={16} />
            )}
          </button>
          <span className="text-[12px] font-extrabold tracking-[0.14em] text-slate-700">{domain.label}</span>
          {activeInGroup > 0 && (
            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-black text-indigo-700">
              {activeInGroup}/{domainKeys.length}
            </span>
          )}
        </div>
        {open ? <ChevronDown size={13} className="shrink-0 text-slate-400" /> : <ChevronRight size={13} className="shrink-0 text-slate-400" />}
      </div>

      {open && (
        <div className="divide-y divide-slate-50 px-2 py-1">
          {domain.permissions.map((perm) => {
            const isActive = active.includes(perm.key);
            return (
              <label key={perm.key} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => onToggle([perm.key], !isActive)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-indigo-600"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black tracking-[0.1em] text-slate-800">{perm.label}</span>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{perm.key}</code>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{perm.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RoleEditor({ open, initial, onClose, onSaved, busy, setBusy }) {
  const isEdit = Boolean(initial?._id || initial?.key);

  const [key, setKey]                 = useState("");
  const [label, setLabel]             = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch]           = useState("");
  const [error, setError]             = useState("");

  useEffect(() => {
    if (!open) return;
    setError(""); setSearch("");
    setKey(initial?.key || "");
    setLabel(initial?.label || initial?.name || "");
    setDescription(initial?.description || "");
    setPermissions(Array.isArray(initial?.permissions) ? initial.permissions : []);
  }, [open, initial]);

  const canSave = useMemo(() => Boolean(key.trim()) && Boolean(label.trim()), [key, label]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PERMISSION_CATALOG;
    return PERMISSION_CATALOG.map((d) => ({
      ...d,
      permissions: d.permissions.filter(
        (p) => p.key.includes(q) || p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      ),
    })).filter((d) => d.permissions.length > 0);
  }, [search]);

  const allKeys = useMemo(() => PERMISSION_CATALOG.flatMap((d) => d.permissions.map((p) => p.key)), []);

  const handleToggle = (keys, add) => {
    setPermissions((prev) => {
      const set = new Set(prev);
      keys.forEach((k) => (add ? set.add(k) : set.delete(k)));
      return [...set];
    });
  };

  const save = async () => {
    setError("");
    setBusy(true);
    try {
      const payload = { key: key.trim(), label: label.trim(), description: description.trim(), permissions };
      isEdit ? await updateRole(initial._id || initial.key, payload) : await createRole(payload);
      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to save role");
    } finally {
      setBusy(false);
    }
  };

  return (
    <RightDrawer
      open={open}
      title={isEdit ? "Edit Role" : "New Role"}
      subtitle={isEdit ? "Update details and permission assignments." : "Create a new role with granular permissions."}
      onClose={onClose}
    >
      <div className="grid gap-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-extrabold text-rose-700">{error}</div>
        )}

        <Input label="ROLE KEY" value={key} onChange={(e) => setKey(e.target.value)}
          placeholder="e.g. hr_manager" hint="Lowercase with underscores. Cannot be changed on system roles."
          disabled={isEdit && initial?.isSystem}
        />

        <Input label="LABEL" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. HR Manager" />

        <div className="grid gap-1.5">
          <label className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">DESCRIPTION</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary of what this role can do…"
            className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Permission builder */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-extrabold tracking-[0.14em] text-slate-700">PERMISSIONS</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
                {permissions.length} / {allKeys.length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <button type="button" onClick={() => handleToggle(allKeys, true)} className="font-bold text-indigo-600 hover:underline">All</button>
              <span className="text-slate-300">·</span>
              <button type="button" onClick={() => setPermissions([])} className="font-bold text-slate-400 hover:underline">None</button>
            </div>
          </div>

          <div className="border-b border-slate-100 px-3 py-2">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permissions…"
              className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-200 focus:ring-1 focus:ring-indigo-100"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto p-3">
            <div className="grid gap-2">
              {filteredCatalog.map((domain) => (
                <DomainGroup key={domain.domain} domain={domain} active={permissions} onToggle={handleToggle} />
              ))}
              {filteredCatalog.length === 0 && (
                <p className="py-6 text-center text-sm italic text-slate-400">No permissions match your search.</p>
              )}
            </div>
          </div>
        </div>

        {/* Selected summary */}
        {permissions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {permissions.map((p) => (
              <Badge key={p} tone="neutral" className="font-mono text-[10px]">{p}</Badge>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={!canSave || busy}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create role"}
          </Button>
        </div>
      </div>
    </RightDrawer>
  );
}
