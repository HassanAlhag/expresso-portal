import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { Film, Video, Check, X } from "lucide-react";

import { PRODUCTION_STATUS_OPTIONS } from "../constants/production.constants";
import { createProductionJob, updateProductionJob } from "../jobs.api";
import { listCustomers } from "../../customers/api";
import { listProjects } from "../../projects/api";
import { listEnrollments } from "../../enrollments/api";
import { listUsers } from "../../iam/users/api";

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORM_OPTIONS = [
  { value: "", label: "Any / unset" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const TYPE_OPTIONS = [
  { value: "reel", label: "Reel", Icon: Film },
  { value: "video", label: "Video", Icon: Video },
];

const PRIORITY_CLS = {
  low: "border-slate-200 bg-white text-slate-500",
  normal: "border-slate-200 bg-white text-slate-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function workflowFromType(t) {
  if (["reel", "video"].includes(t)) return "video";
  if (t === "photo") return "photo";
  return "design";
}

function formatDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function resolveId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v?._id || "";
}

function buildForm(data, customer, project, enrollment) {
  return {
    customerId: data?.customerId?._id || data?.customerId || resolveId(customer),
    projectId: data?.projectId?._id || data?.projectId || resolveId(project),
    enrollmentId: data?.enrollmentId?._id || data?.enrollmentId || resolveId(enrollment),
    title: data?.title || "",
    type: data?.type || "reel",
    platform: data?.platform || "",
    status: data?.status || "brief",
    priority: data?.priority || "normal",
    dueDate: formatDate(data?.dueDate),
    shootDate: formatDate(data?.shootDate),
    brief: data?.brief || "",
    notes: data?.notes || "",
    websiteVisible: !!data?.websiteVisible,
    websiteFeatured: !!data?.websiteFeatured,
    assignees: Array.isArray(data?.assignees) ? data.assignees : [],
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div className="mb-3 text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-400">
      {children}
    </div>
  );
}

function NativeSelect({ label, value, onChange, options = [], disabled = false }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        {options.map((o) => (
          <option key={`${o.value}__${o.label}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StaffPicker({ selected, onChange }) {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listUsers({ limit: 100, isActive: true })
      .then((res) => setUsers(Array.isArray(res?.items) ? res.items : res?.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!q) return users;
    const lq = q.toLowerCase();
    return users.filter(
      (u) =>
        (u.fullName || u.name || "").toLowerCase().includes(lq) ||
        (u.email || "").toLowerCase().includes(lq)
    );
  }, [users, q]);

  const isSelected = (u) => selected.some((s) => (s._id || s) === u._id);

  const toggle = (u) => {
    if (isSelected(u)) {
      onChange(selected.filter((s) => (s._id || s) !== u._id));
    } else {
      onChange([...selected, u]);
    }
  };

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <button
              key={s._id || s}
              type="button"
              onClick={() => toggle(s)}
              className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-400 text-[8px] font-black text-white">
                {(s.fullName || s.name || "?").charAt(0).toUpperCase()}
              </span>
              {s.fullName || s.name || "User"}
              <X size={9} />
            </button>
          ))}
        </div>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search staff by name…"
        className="mb-2 h-9 w-full rounded-xl border border-black/10 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
      />

      <div className="max-h-44 divide-y divide-black/5 overflow-y-auto rounded-xl border border-black/10">
        {loading ? (
          <div className="p-3 text-center text-xs text-slate-400">Loading staff…</div>
        ) : filtered.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400">No staff found</div>
        ) : (
          filtered.map((u) => {
            const active = isSelected(u);
            return (
              <button
                key={u._id}
                type="button"
                onClick={() => toggle(u)}
                className={[
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left transition",
                  active ? "bg-indigo-50" : "hover:bg-slate-50",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black",
                    active ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600",
                  ].join(" ")}
                >
                  {(u.fullName || u.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">
                    {u.fullName || u.name}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {String(u.role || "").replace(/_/g, " ")}
                  </div>
                </div>
                {active && <Check size={14} className="flex-shrink-0 text-indigo-600" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ProductionJobFormModal({
  open,
  onClose,
  onSaved,
  mode = "create",
  initialData = null,
  initialCustomer = null,
  initialProject = null,
  initialEnrollment = null,
  lockCustomer = false,
  lockProject = false,
}) {
  const [form, setForm] = useState(() =>
    buildForm(initialData, initialCustomer, initialProject, initialEnrollment)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const statusOptions = useMemo(
    () => PRODUCTION_STATUS_OPTIONS.filter((x) => x.value),
    []
  );

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    setForm(buildForm(initialData, initialCustomer, initialProject, initialEnrollment));
    setError("");
  }, [initialData, initialCustomer, initialProject, initialEnrollment, open]);

  // Load customers
  useEffect(() => {
    if (!open) return;
    let dead = false;
    setLoadingCustomers(true);
    listCustomers({ limit: 100 })
      .then((res) => { if (!dead) setCustomers(Array.isArray(res?.items) ? res.items : []); })
      .catch(() => { if (!dead) setCustomers([]); })
      .finally(() => { if (!dead) setLoadingCustomers(false); });
    return () => { dead = true; };
  }, [open]);

  // Load projects when customer changes
  useEffect(() => {
    if (!form.customerId) { setProjects([]); setEnrollments([]); return; }
    let dead = false;
    setLoadingProjects(true);
    listProjects({ customerId: form.customerId, limit: 100 })
      .then((res) => { if (!dead) setProjects(Array.isArray(res?.items) ? res.items : []); })
      .catch(() => { if (!dead) setProjects([]); })
      .finally(() => { if (!dead) setLoadingProjects(false); });
    return () => { dead = true; };
  }, [form.customerId]);

  // Load enrollments when customer/project changes
  useEffect(() => {
    if (!form.customerId) { setEnrollments([]); return; }
    let dead = false;
    setLoadingEnrollments(true);
    const params = { customerId: form.customerId, limit: 100 };
    if (form.projectId) params.projectId = form.projectId;
    listEnrollments(params)
      .then((res) => { if (!dead) setEnrollments(Array.isArray(res?.items) ? res.items : []); })
      .catch(() => { if (!dead) setEnrollments([]); })
      .finally(() => { if (!dead) setLoadingEnrollments(false); });
    return () => { dead = true; };
  }, [form.customerId, form.projectId]);

  const customerOptions = useMemo(() => [
    { value: "", label: loadingCustomers ? "Loading clients…" : "Select client" },
    ...customers.map((c) => ({ value: c._id, label: c.companyName || c.contactName || c._id })),
  ], [customers, loadingCustomers]);

  const projectOptions = useMemo(() => [
    { value: "", label: loadingProjects ? "Loading projects…" : "Select project" },
    ...projects.map((p) => ({ value: p._id, label: p.name || p.title || p._id })),
  ], [projects, loadingProjects]);

  const enrollmentOptions = useMemo(() => [
    { value: "", label: loadingEnrollments ? "Loading…" : "None / standalone" },
    ...enrollments.map((e) => ({
      value: e._id,
      label: e.serviceTemplateId?.name || e.name || e._id,
    })),
  ], [enrollments, loadingEnrollments]);

  const handleClose = () => { if (busy) return; onClose?.(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.customerId) { setError("Client is required."); return; }
    setBusy(true);
    setError("");
    try {
      const payload = {
        customerId: form.customerId,
        projectId: form.projectId || undefined,
        enrollmentId: form.enrollmentId || undefined,
        title: form.title.trim(),
        type: form.type || "reel",
        workflowType: workflowFromType(form.type),
        platform: form.platform || "",
        status: form.status || "brief",
        priority: form.priority || "normal",
        dueDate: form.dueDate || null,
        shootDate: form.shootDate || null,
        brief: form.brief.trim(),
        notes: form.notes.trim(),
        websiteVisible: !!form.websiteVisible,
        websiteFeatured: !!form.websiteFeatured,
        assignees: form.assignees.map((a) => a._id || a),
      };
      let res;
      if (mode === "edit" && initialData?._id) {
        res = await updateProductionJob(initialData._id, payload);
      } else {
        res = await createProductionJob(payload);
      }
      onSaved?.(res);
      handleClose();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to ${mode === "edit" ? "update" : "create"} production.`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={mode === "edit" ? "Edit Production" : "New Production"}
      subtitle={
        mode === "edit"
          ? "Update workflow, team, and content details."
          : "Create a new reel, video, post, or content deliverable."
      }
      width="820px"
      footer={
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="prod-job-form" disabled={busy}>
            {busy
              ? mode === "edit" ? "Saving…" : "Creating…"
              : mode === "edit" ? "Save changes" : "Create production"}
          </Button>
        </div>
      }
    >
      <form id="prod-job-form" onSubmit={handleSubmit} className="grid gap-7">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* ── Title ──────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Title</SectionLabel>
          <Input
            placeholder="e.g. Sah Wallet Launch Reel – Week 3"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
          />
        </div>

        {/* ── Linking ────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Link to</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-3">
            <NativeSelect
              label="Client"
              value={form.customerId}
              onChange={(v) => {
                if (lockCustomer) return;
                setField("customerId", v);
                setField("projectId", "");
                setField("enrollmentId", "");
              }}
              options={customerOptions}
              disabled={lockCustomer || loadingCustomers}
            />
            <NativeSelect
              label="Project"
              value={form.projectId}
              onChange={(v) => { setField("projectId", v); setField("enrollmentId", ""); }}
              options={projectOptions}
              disabled={!form.customerId || lockProject || loadingProjects}
            />
            <NativeSelect
              label="Enrollment"
              value={form.enrollmentId}
              onChange={(v) => setField("enrollmentId", v)}
              options={enrollmentOptions}
              disabled={!form.customerId || loadingEnrollments}
            />
          </div>
        </div>

        {/* ── Content type ───────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Content type</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:w-64">
            {TYPE_OPTIONS.map(({ value, label, Icon }) => {
              const active = form.type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setField("type", value)}
                  className={[
                    "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition",
                    active
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-black/10 bg-white text-slate-500 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.75} />
                  <span className="text-[9px] font-black uppercase tracking-wide">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Details ────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Details</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <NativeSelect
              label="Platform"
              value={form.platform}
              onChange={(v) => setField("platform", v)}
              options={PLATFORM_OPTIONS}
            />
            <NativeSelect
              label="Status"
              value={form.status}
              onChange={(v) => setField("status", v)}
              options={statusOptions}
            />
            <Input
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setField("dueDate", e.target.value)}
            />
            <Input
              label="Shoot date"
              type="date"
              value={form.shootDate}
              onChange={(e) => setField("shootDate", e.target.value)}
            />
          </div>

          <div className="mt-3">
            <span className="mb-2 block text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-400">
              Priority
            </span>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setField("priority", p.value)}
                  className={[
                    "rounded-xl border px-4 py-2 text-xs font-bold transition",
                    form.priority === p.value
                      ? PRIORITY_CLS[p.value]
                      : "border-black/5 bg-slate-50 text-slate-500 hover:bg-white",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Assign staff ───────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Assign staff</SectionLabel>
          <StaffPicker
            selected={form.assignees}
            onChange={(v) => setField("assignees", v)}
          />
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Brief & notes</SectionLabel>
          <div className="grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-400">
                Brief
              </span>
              <textarea
                value={form.brief}
                onChange={(e) => setField("brief", e.target.value)}
                rows={3}
                placeholder="Creative direction, key messages, visual style…"
                className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-400">
                Internal notes
              </span>
              <textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                rows={2}
                placeholder="Team notes, reminders, execution details…"
                className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </label>
          </div>
        </div>

        {/* ── Website ────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Website presence</SectionLabel>
          <div className="flex flex-wrap gap-3">
            <label
              className={[
                "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition",
                form.websiteVisible
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-black/10 bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={form.websiteVisible}
                onChange={(e) => setField("websiteVisible", e.target.checked)}
                className="h-4 w-4 accent-indigo-600"
              />
              <div>
                <div className="text-sm font-bold text-slate-800">Show on website</div>
                <div className="text-xs text-slate-400">Publish to the public portfolio</div>
              </div>
            </label>
            <label
              className={[
                "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition",
                form.websiteFeatured
                  ? "border-amber-200 bg-amber-50"
                  : "border-black/10 bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={form.websiteFeatured}
                onChange={(e) => setField("websiteFeatured", e.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
              <div>
                <div className="text-sm font-bold text-slate-800">Featured</div>
                <div className="text-xs text-slate-400">Highlight on homepage or showcase</div>
              </div>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
