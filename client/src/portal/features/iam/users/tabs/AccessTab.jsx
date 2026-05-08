import React, { useMemo, useState } from "react";
import Badge from "../../../../shared/ui/Badge";
import Button from "../../../../shared/ui/Button";
import { useToast } from "../../../../shared/ui/Toast";
import { Plus, X, ShieldCheck, ShieldOff, Shield } from "lucide-react";
import { updateUserPermissions } from "../api";
import { ALL_PERMISSION_KEYS, DEFAULT_ROLE_PERMISSIONS } from "../../../../config/permissions";

function roleTone(role) {
  if (role === "super_admin") return "danger";
  if (role === "admin")       return "info";
  if (role === "staff")       return "success";
  return "neutral";
}

function PermissionPicker({ exclude = [], onPick }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_PERMISSION_KEYS.filter(
      (k) => !exclude.includes(k) && (!q || k.includes(q))
    );
  }, [search, exclude]);

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
        placeholder="Search permission key…"
        className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-200 focus:ring-1 focus:ring-indigo-100"
      />
      <div className="mt-2 max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-3 text-center text-xs italic text-slate-400">No permissions found.</p>
        ) : (
          filtered.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onPick(k)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-mono text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
            >
              {k}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function AccessTab({ user: initialUser }) {
  const toast = useToast();
  const [user, setUser] = useState(initialUser);
  const [busy, setBusy] = useState(false);
  const [showExtraPicker, setShowExtraPicker]     = useState(false);
  const [showRevokedPicker, setShowRevokedPicker] = useState(false);

  const role  = user?.role || "";
  const extra   = useMemo(() => user?.extraPermissions   || [], [user]);
  const revoked = useMemo(() => user?.revokedPermissions || [], [user]);

  const roleBasePerms = useMemo(
    () => DEFAULT_ROLE_PERMISSIONS[role] || [],
    [role]
  );

  const effectivePerms = useMemo(() => {
    if (role === "super_admin") return ALL_PERMISSION_KEYS;
    const set = new Set([...roleBasePerms, ...extra]);
    revoked.forEach((p) => set.delete(p));
    return [...set].sort();
  }, [role, roleBasePerms, extra, revoked]);

  const save = async (nextExtra, nextRevoked) => {
    setBusy(true);
    try {
      const res = await updateUserPermissions(user._id, {
        extraPermissions:   nextExtra,
        revokedPermissions: nextRevoked,
      });
      setUser((u) => ({ ...u, ...res.user }));
      toast.success("Permissions updated.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to update permissions.");
    } finally {
      setBusy(false);
    }
  };

  const addExtra   = (key) => { save([...extra, key], revoked); setShowExtraPicker(false); };
  const removeExtra  = (key) => save(extra.filter((k) => k !== key), revoked);
  const addRevoked   = (key) => { save(extra, [...revoked, key]); setShowRevokedPicker(false); };
  const removeRevoked = (key) => save(extra, revoked.filter((k) => k !== key));

  return (
    <div className="grid gap-4">
      {/* Role card */}
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
        <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">ROLE</div>
        <div className="mt-3 flex items-center gap-3">
          <Shield size={18} className="text-slate-400" />
          <Badge tone={roleTone(role)}>
            {String(role || "—").replaceAll("_", " ").toUpperCase()}
          </Badge>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Base permissions are inherited from the role. Use the override panels below to grant or revoke specific permissions for this user without changing the role.
        </p>
      </div>

      {/* Effective permissions */}
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
            EFFECTIVE PERMISSIONS
            <span className="ml-2 font-normal normal-case text-slate-400">({effectivePerms.length})</span>
          </div>
          {role === "super_admin" && (
            <Badge tone="danger">ALL (super_admin)</Badge>
          )}
        </div>
        {effectivePerms.length === 0 ? (
          <p className="text-sm italic text-slate-400">No effective permissions.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {effectivePerms.map((p) => {
              const isExtra   = extra.includes(p);
              const tone = isExtra ? "success" : "neutral";
              return (
                <span key={p} title={isExtra ? "Granted individually" : "From role"}>
                  <Badge tone={tone} className="font-mono text-[10px]">{p}</Badge>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Extra grants */}
      <div className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-500" />
            <span className="text-[11px] font-black tracking-[0.22em] text-slate-700">
              EXTRA GRANTS
              <span className="ml-1.5 font-normal text-slate-400">({extra.length})</span>
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowExtraPicker((v) => !v)} disabled={busy}>
            <Plus size={13} /> Grant
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Permissions added to this user beyond their role.</p>

        {showExtraPicker && (
          <PermissionPicker exclude={[...extra, ...revoked, ...roleBasePerms]} onPick={addExtra} />
        )}

        {extra.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {extra.map((p) => (
              <span key={p} className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5">
                <span className="font-mono text-[10px] font-semibold text-emerald-700">{p}</span>
                <button type="button" onClick={() => removeExtra(p)} disabled={busy} className="text-emerald-400 hover:text-rose-500 transition">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        {extra.length === 0 && !showExtraPicker && (
          <p className="mt-2 text-xs italic text-slate-400">No individual grants.</p>
        )}
      </div>

      {/* Revocations */}
      <div className="rounded-[28px] border border-rose-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldOff size={15} className="text-rose-400" />
            <span className="text-[11px] font-black tracking-[0.22em] text-slate-700">
              REVOCATIONS
              <span className="ml-1.5 font-normal text-slate-400">({revoked.length})</span>
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowRevokedPicker((v) => !v)} disabled={busy}>
            <Plus size={13} /> Revoke
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Permissions removed from this user that their role would normally grant.</p>

        {showRevokedPicker && (
          <PermissionPicker exclude={[...revoked, ...extra]} onPick={addRevoked} />
        )}

        {revoked.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {revoked.map((p) => (
              <span key={p} className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5">
                <span className="font-mono text-[10px] font-semibold text-rose-600">{p}</span>
                <button type="button" onClick={() => removeRevoked(p)} disabled={busy} className="text-rose-400 hover:text-slate-500 transition">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        {revoked.length === 0 && !showRevokedPicker && (
          <p className="mt-2 text-xs italic text-slate-400">No individual revocations.</p>
        )}
      </div>
    </div>
  );
}
