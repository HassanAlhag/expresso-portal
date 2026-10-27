import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckSquare,
  Layers,
  LockKeyhole,
  Search,
  Shield,
  Square,
} from "lucide-react";

import Modal from "../../../../shared/ui/Modal";
import Button from "../../../../shared/ui/Button";
import Input from "../../../../shared/ui/Input";
import Badge from "../../../../shared/ui/Badge";
import { createRole, updateRole } from "../api";
import { isExternalDeniedKey, usePermissionCatalog } from "../../../../shared/hooks/usePermissionCatalog";

function PermissionRow({ permission, active, locked, onToggle, readOnly = false }) {
  return (
    <button
      type="button"
      disabled={locked || readOnly}
      aria-pressed={active}
      title={locked ? "Client and vendor roles cannot hold this permission" : undefined}
      onClick={() => onToggle([permission.key], !active)}
      className={[
        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
        locked
          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
          : active
            ? "border-indigo-200 bg-indigo-50/70 shadow-sm"
            : "border-slate-200 bg-white hover:border-indigo-100 hover:bg-slate-50",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border",
          active
            ? "border-indigo-500 bg-indigo-600 text-white"
            : "border-slate-200 bg-white text-slate-400",
        ].join(" ")}
      >
        {active ? <Check size={14} strokeWidth={3} /> : null}
      </span>

      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-slate-900">
            {permission.label}
          </span>
          <code className="rounded-md bg-white/80 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-500">
            {permission.key}
          </code>
          {locked ? (
            <Badge tone="neutral" size="xs">
              Staff roles only
            </Badge>
          ) : null}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {permission.description}
        </span>
      </span>
    </button>
  );
}

function DomainPanel({ domain, active, isLocked, onToggle, readOnly = false }) {
  const keys = domain.permissions
    .map((permission) => permission.key)
    .filter((permissionKey) => !isLocked(permissionKey));
  const selectedCount = keys.filter((key) => active.includes(key)).length;
  const allSelected = selectedCount === keys.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-slate-950">
              {domain.label}
            </h3>
            <Badge tone={selectedCount ? "info" : "neutral"} size="xs">
              {selectedCount}/{keys.length}
            </Badge>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {domain.domain}
          </p>
        </div>

        {readOnly ? null : <button
          type="button"
          onClick={() => onToggle(keys, !allSelected)}
          disabled={keys.length === 0}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
        >
          {allSelected || someSelected ? (
            <CheckSquare size={15} className={allSelected ? "text-indigo-600" : "text-slate-400"} />
          ) : (
            <Square size={15} className="text-slate-400" />
          )}
          {allSelected ? "Clear group" : "Select group"}
        </button>}
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {domain.permissions.map((permission) => (
          <PermissionRow
            key={permission.key}
            permission={permission}
            active={active.includes(permission.key)}
            locked={isLocked(permission.key)}
            onToggle={onToggle}
            readOnly={readOnly}
          />
        ))}
      </div>
    </section>
  );
}

export default function RoleEditor({
  open,
  initial,
  onClose,
  onSaved,
  busy,
  setBusy,
  // PI closure: without iam.roles.write the editor opens view-only (no
  // toggles, no save); the API refuses role changes without it anyway.
  readOnly = false,
}) {
  const isSynthetic = Boolean(initial?.synthetic);
  // A synthetic role has no real DB document yet — save via POST (createRole).
  // A persisted role edit uses PATCH (updateRole) with its real ObjectId.
  const isEdit = Boolean(initial?._id || initial?.key) && !isSynthetic;

  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState([]);
  // true = Expresso team role, false = client/vendor role, null = not chosen.
  const [isInternal, setIsInternal] = useState(null);
  const [query, setQuery] = useState("");
  const [activeDomain, setActiveDomain] = useState("all");
  const [error, setError] = useState("");
  const {
    catalog,
    externalDeniedPrefixes,
    loading: catalogLoading,
    error: catalogError,
  } = usePermissionCatalog();

  const allKeys = useMemo(
    () => catalog.flatMap((domain) => domain.permissions.map((permission) => permission.key)),
    [catalog]
  );

  // Client/vendor roles can never hold internal-only permissions. The API
  // refuses them; the editor shows them as locked so the choice is clear.
  const isLocked = useMemo(
    () => (permissionKey) =>
      isInternal === false && isExternalDeniedKey(permissionKey, externalDeniedPrefixes),
    [isInternal, externalDeniedPrefixes]
  );

  useEffect(() => {
    if (!open) return;
    setError("");
    setQuery("");
    setActiveDomain("all");
    setKey(initial?.key || "");
    setLabel(initial?.label || initial?.name || "");
    setDescription(initial?.description || "");
    setPermissions(Array.isArray(initial?.permissions) ? initial.permissions : []);
    setIsInternal(typeof initial?.isInternal === "boolean" ? initial.isInternal : null);
  }, [open, initial]);

  // System roles have a fixed classification; custom roles must choose one.
  const audienceLocked = Boolean(initial?.isSystem);

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();

    return catalog
      .filter((domain) => activeDomain === "all" || domain.domain === activeDomain)
      .map((domain) => ({
        ...domain,
        permissions: domain.permissions.filter((permission) => {
          if (!q) return true;
          return [
            domain.label,
            domain.domain,
            permission.key,
            permission.label,
            permission.description,
          ].some((value) => String(value || "").toLowerCase().includes(q));
        }),
      }))
      .filter((domain) => domain.permissions.length > 0);
  }, [catalog, activeDomain, query]);

  const selectedByDomain = useMemo(
    () =>
      catalog.map((domain) => {
        const keys = domain.permissions.map((permission) => permission.key);
        return {
          ...domain,
          selected: keys.filter((permissionKey) => permissionSet.has(permissionKey)).length,
          total: keys.length,
        };
      }),
    [catalog, permissionSet]
  );

  const canSave = key.trim() && label.trim() && (audienceLocked || isInternal !== null);

  const handleToggle = (keys, add) => {
    if (readOnly) return;
    setPermissions((prev) => {
      const next = new Set(prev);
      keys.forEach((permissionKey) => {
        if (add && isLocked(permissionKey)) return;
        if (add) next.add(permissionKey);
        else next.delete(permissionKey);
      });
      // Keep catalog order, and never silently drop a key this screen does
      // not list (previously any toggle dropped keys missing from the copy).
      const known = new Set(allKeys);
      return [
        ...allKeys.filter((permissionKey) => next.has(permissionKey)),
        ...[...next].filter((permissionKey) => !known.has(permissionKey)),
      ];
    });
  };

  const save = async () => {
    if (readOnly) return;
    setError("");
    setBusy(true);

    try {
      const payload = {
        key: key.trim().toLowerCase().replace(/\s+/g, "_"),
        label: label.trim(),
        description: description.trim(),
        permissions:
          isInternal === false
            ? permissions.filter((permissionKey) => !isExternalDeniedKey(permissionKey, externalDeniedPrefixes))
            : permissions,
        ...(audienceLocked || isInternal === null ? {} : { isInternal }),
      };

      if (isEdit) {
        await updateRole(initial._id, payload);
      } else {
        await createRole(payload);
      }

      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to save role");
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs font-semibold text-slate-500">
        {isSynthetic
          ? "Default role — saving will persist it to the database with your chosen permissions."
          : `${permissions.length} permission${permissions.length === 1 ? "" : "s"} selected`}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {readOnly ? null : (
          <Button onClick={save} disabled={!canSave || busy || catalogLoading || Boolean(catalogError)} loading={busy}>
            {isEdit ? "Save changes" : "Create role"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      title={readOnly ? "Role Access (view only)" : isEdit ? "Role Access" : "Create Role"}
      subtitle={readOnly ? "Your role can view roles but not change them." : isEdit ? "Review details and tune permissions in one place." : "Create a custom role with precise module access."}
      onClose={onClose}
      width="1180px"
      footer={footer}
    >
      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="grid content-start gap-4">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-extrabold text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white">
                <Shield size={19} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-base font-black text-slate-950">
                  {label || "Untitled role"}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge tone={initial?.isSystem ? "warning" : "info"} size="xs">
                    {initial?.isSystem ? "System" : "Custom"}
                  </Badge>
                  {isSynthetic ? <Badge tone="neutral" size="xs">Default</Badge> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <Input
              label="ROLE KEY"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="project_manager"
              disabled={(isEdit && initial?.isSystem) || readOnly}
              hint={initial?.isSystem && !isSynthetic ? "System role keys are locked." : "Use lowercase words with underscores."}
            />

            <Input
              label="LABEL"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Project Manager"
              readOnly={readOnly}
            />

            <fieldset className="grid gap-2" disabled={audienceLocked || readOnly}>
              <legend className="mb-1 text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                WHO USES THIS ROLE
              </legend>
              {[
                {
                  value: true,
                  title: "Expresso team (internal)",
                  hint: "Sees records across all clients, within the permissions below.",
                },
                {
                  value: false,
                  title: "Client or vendor (external)",
                  hint: "Limited to their own company. Internal-only modules are never available.",
                },
              ].map((option) => (
                <label
                  key={String(option.value)}
                  className={[
                    "flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm",
                    isInternal === option.value
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-slate-200 bg-white",
                    audienceLocked ? "cursor-not-allowed opacity-70" : "",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="role-audience"
                    className="mt-1"
                    checked={isInternal === option.value}
                    onChange={() => setIsInternal(option.value)}
                  />
                  <span>
                    <span className="block font-bold text-slate-900">{option.title}</span>
                    <span className="block text-xs text-slate-500">{option.hint}</span>
                  </span>
                </label>
              ))}
              {audienceLocked ? (
                <p className="text-xs text-slate-500">System roles keep a fixed audience.</p>
              ) : null}
            </fieldset>

            <div className="grid gap-1.5">
              <label className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                DESCRIPTION
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                readOnly={readOnly}
                placeholder="Short summary of what this role can do."
                className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
              <Layers size={16} />
              Permission Coverage
            </div>
            <div className="grid gap-2">
              {selectedByDomain.map((domain) => {
                const pct = domain.total ? (domain.selected / domain.total) * 100 : 0;
                return (
                  <button
                    type="button"
                    key={domain.domain}
                    onClick={() => setActiveDomain(domain.domain)}
                    className={[
                      "rounded-xl border p-3 text-left transition",
                      activeDomain === domain.domain
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-xs font-black text-slate-800">
                        {domain.label}
                      </span>
                      <span className="text-xs font-black text-slate-500">
                        {domain.selected}/{domain.total}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                <LockKeyhole size={16} />
                Permissions
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Select the exact actions this role can perform.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveDomain("all")}
                className={[
                  "h-9 rounded-xl border px-3 text-xs font-black transition",
                  activeDomain === "all"
                    ? "border-indigo-200 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                All groups
              </button>
              {readOnly ? null : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(allKeys, true)}
                  >
                    Select all
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPermissions([])}
                  >
                    Clear
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search permission, module, or key..."
              className="h-8 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="mt-4 grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
            {catalogLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
                Loading permissions…
              </div>
            ) : null}

            {catalogError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-extrabold text-rose-700">
                {catalogError}
              </div>
            ) : null}

            {filteredCatalog.map((domain) => (
              <DomainPanel
                key={domain.domain}
                domain={domain}
                active={permissions}
                isLocked={isLocked}
                onToggle={handleToggle}
                readOnly={readOnly}
              />
            ))}

            {!catalogLoading && !catalogError && filteredCatalog.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
                No permissions match this search.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </Modal>
  );
}
