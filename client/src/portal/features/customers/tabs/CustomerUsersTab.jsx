import React, { useEffect, useState } from "react";
import {
  UserPlus,
  Trash2,
  Shield,
  Mail,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { listCustomerUsers, createCustomerUser } from "../api";
import { deleteUser } from "../../iam/users/api";
import { useToast } from "../../../shared/ui/Toast";
import Skeleton from "../../../shared/ui/Skeleton";

const CLIENT_ROLES = [
  { value: "client",              label: "Client",              hint: "Basic access — projects, files, billing, tickets" },
  { value: "staff_client",        label: "Staff Client",        hint: "Extended access — projects, files, billing, messages" },
  { value: "client_admin",        label: "Client Admin",        hint: "Full client access — all above + procurement, brand kit" },
  { value: "procurement_client",  label: "Procurement Client",  hint: "Procurement, files, billing, tickets" },
];

const ROLE_COLORS = {
  client:             "bg-slate-100 text-slate-600",
  staff_client:       "bg-sky-50 text-sky-700",
  client_admin:       "bg-indigo-50 text-indigo-700",
  procurement_client: "bg-amber-50 text-amber-700",
};

const EMPTY_FORM = { email: "", fullName: "", tempPassword: "", role: "client" };

function CreateUserModal({ customerId, onCreated, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.tempPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const r = await createCustomerUser(customerId, form);
      toast.success("User created successfully");
      onCreated(r.user);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">Add Company User</h3>
            <p className="mt-0.5 text-[12px] text-slate-400">Creates a portal account linked to this company</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-slate-600">Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="user@company.com"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-[#6F7FD9]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-slate-600">Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Optional — defaults to company name"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-[#6F7FD9]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-slate-600">Role *</label>
            <div className="space-y-2">
              {CLIENT_ROLES.map((r) => (
                <label key={r.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-indigo-300 has-[:checked]:border-[#6F7FD9] has-[:checked]:bg-indigo-50/50">
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={() => set("role", r.value)}
                    className="mt-0.5 accent-[#6F7FD9]"
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">{r.label}</p>
                    <p className="text-[11px] text-slate-400">{r.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-slate-600">Temporary Password *</label>
            <div className="relative">
              <input
                required
                type={showPw ? "text" : "password"}
                value={form.tempPassword}
                onChange={(e) => set("tempPassword", e.target.value)}
                placeholder="Min 8 characters"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-10 text-[13px] outline-none focus:border-[#6F7FD9]"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {form.tempPassword.length > 0 && form.tempPassword.length < 8 && (
              <p className="mt-1 text-[11px] text-rose-500">Password must be at least 8 characters</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-[13px] text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-[#6F7FD9] px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50 hover:bg-[#5a6bc8]"
            >
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <UserPlus size={13} />}
              {saving ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserRow({ user, onDelete, isOwner }) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteUser(user._id);
      toast.success("User deleted");
      onDelete(user._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  const roleLabel = CLIENT_ROLES.find((r) => r.value === user.role)?.label || user.role;
  const roleColor = ROLE_COLORS[user.role] || "bg-slate-100 text-slate-600";

  return (
    <div className="flex items-center gap-4 border-b border-slate-50 px-5 py-3.5 last:border-b-0 hover:bg-slate-50/60 transition-colors">
      {/* Avatar */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#6F7FD9]/10 text-[13px] font-bold text-[#6F7FD9]">
        {(user.fullName || user.email || "?")[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-slate-800">{user.fullName || "—"}</p>
          {isOwner && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Primary</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[12px] text-slate-400">
          <Mail size={10} />
          <span className="truncate">{user.email}</span>
        </div>
      </div>

      {/* Role badge */}
      <span className={`hidden flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex items-center gap-1 ${roleColor}`}>
        <Shield size={9} />
        {roleLabel}
      </span>

      {/* Status */}
      <div className="flex-shrink-0">
        {user.isActive ? (
          <CheckCircle2 size={15} className="text-emerald-500" />
        ) : (
          <XCircle size={15} className="text-slate-300" />
        )}
      </div>

      {/* Delete */}
      <div className="flex-shrink-0">
        {confirming ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-rose-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
            >
              {deleting ? "…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg px-2.5 py-1 text-[11px] text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
            title="Delete user"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function CustomerUsersTab({ customer }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!customer?._id) return;
    setLoading(true);
    listCustomerUsers(customer._id)
      .then((r) => setUsers(r?.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customer?._id]);

  function handleCreated(newUser) {
    setUsers((prev) => [...prev, newUser]);
    setCreateOpen(false);
  }

  function handleDeleted(id) {
    setUsers((prev) => prev.filter((u) => u._id !== id));
  }

  return (
    <div className="rounded-[28px] border border-black/[0.07] bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[14px] font-bold text-slate-900">Portal Users</p>
          <p className="text-[12px] text-slate-400">All accounts linked to this company</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#6F7FD9] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#5a6bc8] transition"
        >
          <UserPlus size={14} />
          Add User
        </button>
      </div>

      {/* User list */}
      {loading ? (
        <div className="space-y-1 p-5">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <UserPlus size={32} className="mb-3 text-slate-200" strokeWidth={1.5} />
          <p className="text-[13px] font-semibold text-slate-400">No users yet</p>
          <p className="text-[12px] text-slate-300">Click "Add User" to create the first login</p>
        </div>
      ) : (
        <div>
          {users.map((u) => (
            <UserRow
              key={u._id}
              user={u}
              isOwner={String(u._id) === String(customer?.ownerUserId)}
              onDelete={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* Stats footer */}
      {!loading && users.length > 0 && (
        <div className="flex items-center gap-4 border-t border-slate-100 px-5 py-3 text-[12px] text-slate-400">
          <span>{users.length} user{users.length !== 1 ? "s" : ""} total</span>
          <span>·</span>
          <span>{users.filter((u) => u.isActive).length} active</span>
        </div>
      )}

      {createOpen && (
        <CreateUserModal
          customerId={customer._id}
          onCreated={handleCreated}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}
