import { Link } from "react-router-dom";
import { identity, localDate } from "../../../shared/operating/api";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MessageSquare,
  RefreshCw,
  BarChart2,
  Users,
  Clock,
  CalendarDays,
  TrendingUp,
  Eye,
  Heart,
  UserPlus,
  Pencil,
} from "lucide-react";

import Card from "../../../shared/ui/Card";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import PageHeader from "../../../shared/ui/PageHeader";
import StatCard from "../../../shared/ui/StatCard";
import RightDrawer from "../../../shared/ui/RightDrawer";
import { useToast } from "../../../shared/ui/Toast";
import Modal from "../../../shared/ui/Modal";
import Input from "../../../shared/ui/Input";
import Select from "../../../shared/ui/Select";

import { listJobs, updateJob, addApproval, updatePostMetrics } from "../../jobs/api";
import { listCustomers } from "../../customers/api";
import { listSocialMetrics, upsertSocialMetrics } from "../api";
import { useAccess } from "../../../shared/hooks/useAccess";
import { getAssetUrl } from "../../../shared/utils/assetUrl";

// ── Constants ─────────────────────────────────────────────────────────────────

const SOCIAL_TYPES = ["post", "carousel", "story", "reel", "video", "photo"];

const PLATFORMS = [
  { value: "",          label: "All Platforms", color: "text-slate-500" },
  { value: "instagram", label: "Instagram",     color: "text-pink-500" },
  { value: "facebook",  label: "Facebook",      color: "text-blue-600" },
  { value: "tiktok",    label: "TikTok",         color: "text-slate-800" },
  { value: "linkedin",  label: "LinkedIn",      color: "text-sky-600" },
  { value: "youtube",   label: "YouTube",       color: "text-red-500" },
  { value: "twitter",   label: "Twitter / X",  color: "text-slate-700" },
  { value: "snapchat",  label: "Snapchat",      color: "text-yellow-400" },
];

const PLATFORM_SHORT = {
  instagram: "IG",
  facebook:  "FB",
  tiktok:    "TT",
  linkedin:  "IN",
  youtube:   "YT",
  twitter:   "X",
  snapchat:  "SC",
};

const STATUS_DOT = {
  brief:           "bg-slate-300",
  content_ready:   "bg-sky-400",
  script:          "bg-sky-400",
  pre_production:  "bg-sky-400",
  designing:       "bg-indigo-400",
  shooting:        "bg-indigo-400",
  editing:         "bg-indigo-400",
  internal_review: "bg-amber-400",
  client_review:   "bg-orange-400",
  approved:        "bg-emerald-400",
  scheduled:       "bg-teal-400",
  published:       "bg-violet-500",
  delivered:       "bg-emerald-600",
  on_hold:         "bg-rose-400",
  archived:        "bg-slate-200",
};

const STATUS_TONE = {
  brief: "neutral", content_ready: "info", script: "info", pre_production: "info",
  designing: "info", shooting: "info", editing: "info",
  internal_review: "warning", client_review: "warning",
  approved: "success", scheduled: "success", published: "success", delivered: "success",
  on_hold: "error", archived: "neutral",
};

const APPROVAL_STATUSES = [
  { value: "approved",           label: "Approved",          color: "text-emerald-600" },
  { value: "changes_requested",  label: "Changes Requested", color: "text-orange-600"  },
  { value: "client_note",        label: "Client Note",       color: "text-sky-600"     },
  { value: "internal_note",      label: "Internal Note",     color: "text-slate-500"   },
];

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function fmt(n) {
  return Number(n || 0).toLocaleString("en");
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() }; // month 0-indexed
}

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfWeek(year, month) {
  // Returns 0=Mon … 6=Sun
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7;
}

function calendarGrid(year, month) {
  const total = daysInMonth(year, month);
  const start = firstDayOfWeek(year, month);
  const cells = [];
  for (let i = 0; i < start; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

function dueDateDay(job) {
  const date = job.operatingModelVersion === 1 ? job.scheduledPublicationDate : job.dueDate;
  if (!date) return null;
  return new Date(date).getDate();
}

function isToday(year, month, day) {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

// ── Post chip (calendar cell) ──────────────────────────────────────────────

function PostChip({ job, onClick }) {
  const dot = STATUS_DOT[job.status] || "bg-slate-300";
  const platformLabel = PLATFORM_SHORT[job.platform] || "POST";
  return (
    <button
      onClick={() => onClick(job)}
      className="w-full text-left flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] hover:bg-white/80 transition-colors group"
    >
      <span className={`shrink-0 h-2 w-2 rounded-full ${dot}`} />
      <span className="truncate text-slate-700 font-medium leading-tight">
        {platformLabel} · {job.title || job.caption?.slice(0, 30) || "Post"}
        {job.operatingModelVersion === 1 && identity(job.originDeliveryPeriodId) !== identity(job.workDeliveryPeriodId) ? " · Carry-in" : ""}
        {job.operating?.blockers?.some((b) => !b.endedAt) ? " · Blocked" : ""}
      </span>
    </button>
  );
}

// ── Post Detail Drawer ──────────────────────────────────────────────────────

function ApprovalHistoryItem({ entry }) {
  const cfg = APPROVAL_STATUSES.find((s) => s.value === entry.status);
  return (
    <div className="flex gap-3 text-sm">
      <div className="flex flex-col items-center">
        <div className={`h-2 w-2 rounded-full mt-1.5 ${STATUS_DOT[entry.status] || "bg-slate-300"}`} />
        <div className="flex-1 w-px bg-slate-100 mt-1" />
      </div>
      <div className="pb-3 flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${cfg?.color || "text-slate-600"}`}>{cfg?.label || entry.status}</span>
          <span className="text-xs text-slate-400">{fmtDate(entry.at || entry.createdAt)}</span>
          {entry.createdBy?.fullName && (
            <span className="text-xs text-slate-400">by {entry.createdBy.fullName}</span>
          )}
        </div>
        {entry.note && <p className="text-slate-500 text-xs mt-0.5">{entry.note}</p>}
      </div>
    </div>
  );
}

function PostDrawer({ job, open, onClose, onApprovalAdded, onStatusChange, canWrite = false }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteType, setNoteType] = useState("internal_note");

  useEffect(() => {
    if (open) { setNote(""); setNoteOpen(false); }
  }, [open, job?._id]);

  if (!job) return null;

  const thumb = job.coverMedia?.thumbnailUrl || job.coverMedia?.url
    || job.draftMediaId?.thumbnailUrl || job.draftMediaId?.url || null;
  const status = job.status || "";
  const isClientReview = status === "client_review" && job.operatingModelVersion !== 1;

  const doApproval = async (apStatus) => {
    if (!canWrite) return;
    setBusy(true);
    try {
      const res = await addApproval(job._id, { status: apStatus, note });
      onApprovalAdded(res.item);

      // Also update job status
      let newStatus = null;
      if (apStatus === "approved") newStatus = "approved";
      if (apStatus === "changes_requested") newStatus = "editing";
      if (newStatus) {
        const updated = await updateJob(job._id, { status: newStatus });
        onStatusChange(updated.item);
      }

      setNote("");
      setNoteOpen(false);
      toast.success(apStatus === "approved" ? "Post approved!" : "Changes requested.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const doNote = async () => {
    if (!canWrite || !note.trim()) return;
    setBusy(true);
    try {
      const res = await addApproval(job._id, { status: noteType, note });
      onApprovalAdded(res.item);
      setNote("");
      setNoteOpen(false);
      toast.success("Note added.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to add note.");
    } finally {
      setBusy(false);
    }
  };

  const approvals = (job.approvals || []).slice().reverse();

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={job.title || "Post Details"}
      subtitle={job.customerId?.companyName || ""}
      right={
        <Badge tone={STATUS_TONE[status] || "neutral"} className="capitalize text-xs">
          {status.replace(/_/g, " ")}
        </Badge>
      }
    >
      <div className="p-5 grid gap-5">

        {/* Thumbnail */}
        {thumb && (
          <div className="rounded-xl overflow-hidden bg-slate-100 max-h-48 flex items-center justify-center">
            <img src={getAssetUrl(thumb)} alt="" className="max-h-48 w-full object-cover" />
          </div>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Platform</p>
            <p className="font-medium capitalize text-slate-700">
              {PLATFORM_SHORT[job.platform] ? `${PLATFORM_SHORT[job.platform]} · ` : ""}{job.platform || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Type</p>
            <p className="font-medium capitalize text-slate-700">{job.type || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Due Date</p>
            <p className="font-medium text-slate-700">{fmtDate(job.dueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Priority</p>
            <p className="font-medium capitalize text-slate-700">{job.priority || "normal"}</p>
          </div>
        </div>

        {/* Caption */}
        {job.caption && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Caption</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl px-4 py-3">
              {job.caption}
            </p>
          </div>
        )}

        {/* Notes */}
        {job.notes && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Notes</p>
            <p className="text-sm text-slate-600">{job.notes}</p>
          </div>
        )}

        {job.operatingModelVersion === 1 && <div className="px-stack"><Link to={`/portal/jobs/${job._id}`}>Open managed review and delivery</Link><p>Origin: {job.originDeliveryPeriodId?.periodStart ? localDate(job.originDeliveryPeriodId.periodStart, job.originDeliveryPeriodId.timezone) : "Original service period"}. Work period: {job.workDeliveryPeriodId?.periodStart ? localDate(job.workDeliveryPeriodId.periodStart, job.workDeliveryPeriodId.timezone) : "Assigned service period"}. Review: {job.status}.</p></div>}
        {/* Client Approval Actions (jobs.write) */}
        {isClientReview && canWrite && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 grid gap-3">
            <p className="text-sm font-semibold text-orange-800 flex items-center gap-2">
              <Clock size={14} /> Awaiting Your Approval
            </p>
            <p className="text-xs text-orange-700">Review this post and let us know if it's ready to publish.</p>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                onClick={() => doApproval("approved")}
                loading={busy}
              >
                <CheckCircle2 size={14} /> Approve
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-100"
                onClick={() => doApproval("changes_requested")}
                loading={busy}
              >
                <XCircle size={14} /> Request Changes
              </Button>
            </div>
          </div>
        )}

        {/* Add Note (jobs.write) */}
        {canWrite && job.operatingModelVersion !== 1 ? (
        <div>
          {!noteOpen ? (
            <button
              onClick={() => setNoteOpen(true)}
              className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
            >
              <MessageSquare size={13} /> Add a note
            </button>
          ) : (
            <div className="grid gap-2">
              <Select
                value={noteType}
                onChange={setNoteType}
              >
                {APPROVAL_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Write your note…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <div className="flex gap-2">
                <Button onClick={doNote} loading={busy} className="flex-1">Submit</Button>
                <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
        ) : null}

        {/* Approval History */}
        {approvals.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">History</p>
            <div>
              {approvals.map((entry, i) => (
                <ApprovalHistoryItem key={i} entry={entry} />
              ))}
            </div>
          </div>
        )}
      </div>
    </RightDrawer>
  );
}

// ── Metrics Form Modal ─────────────────────────────────────────────────────

const METRICS_EMPTY = { reach: "", impressions: "", engagementRate: "", likes: "", comments: "", shares: "", saves: "", followerCount: "", newFollowers: "", postsPublished: "", notes: "" };

function MetricsModal({ open, existing, customerId, period, platform, busy, onClose, onSubmit }) {
  const [form, setForm] = useState(METRICS_EMPTY);

  useEffect(() => {
    if (open) {
      setForm(existing
        ? Object.fromEntries(Object.entries(existing).map(([k, v]) => [k, v ?? ""]))
        : METRICS_EMPTY);
    }
  }, [open, existing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ customerId, period, platform, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, isNaN(v) || v === "" ? v : Number(v)])) });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Performance Metrics — ${platform || "overall"}`}
      width="560px"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button form="metrics-form" type="submit" loading={busy}>Save Metrics</Button>
        </div>
      }
    >
      <form id="metrics-form" onSubmit={handleSubmit} className="grid gap-4">
        <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-500">
          {period} · {platform || "Overall"}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Reach" type="number" value={form.reach} onChange={(e) => set("reach", e.target.value)} min={0} />
          <Input label="Impressions" type="number" value={form.impressions} onChange={(e) => set("impressions", e.target.value)} min={0} />
          <Input label="Engagement Rate (%)" type="number" value={form.engagementRate} onChange={(e) => set("engagementRate", e.target.value)} min={0} step="0.01" />
          <Input label="Likes" type="number" value={form.likes} onChange={(e) => set("likes", e.target.value)} min={0} />
          <Input label="Comments" type="number" value={form.comments} onChange={(e) => set("comments", e.target.value)} min={0} />
          <Input label="Shares" type="number" value={form.shares} onChange={(e) => set("shares", e.target.value)} min={0} />
          <Input label="Follower Count" type="number" value={form.followerCount} onChange={(e) => set("followerCount", e.target.value)} min={0} />
          <Input label="New Followers" type="number" value={form.newFollowers} onChange={(e) => set("newFollowers", e.target.value)} />
          <Input label="Posts Published" type="number" value={form.postsPublished} onChange={(e) => set("postsPublished", e.target.value)} min={0} />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </form>
    </Modal>
  );
}

// ── Analytics sub-components ─────────────────────────────────────────────────

function PlatformCard({ metricRow }) {
  const p = metricRow.platform;
  const short = PLATFORM_SHORT[p] || "ALL";
  const plat = PLATFORMS.find((x) => x.value === p);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">{short}</span>
        <span className="text-[13px] font-bold text-slate-800 capitalize">{plat?.label || p}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
          <p className="text-slate-400">Reach</p>
          <p className="mt-0.5 text-[15px] font-bold text-slate-800">{Number(metricRow.reach || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
          <p className="text-slate-400">Impressions</p>
          <p className="mt-0.5 text-[15px] font-bold text-slate-800">{Number(metricRow.impressions || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
          <p className="text-slate-400">Engagement</p>
          <p className="mt-0.5 text-[15px] font-bold text-indigo-600">{metricRow.engagementRate || 0}%</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
          <p className="text-slate-400">New Followers</p>
          <p className={`mt-0.5 text-[15px] font-bold ${(metricRow.newFollowers || 0) >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {(metricRow.newFollowers || 0) >= 0 ? "+" : ""}{Number(metricRow.newFollowers || 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

const POST_METRICS_EMPTY = { likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0, engagementRate: 0 };

function PostMetricsModal({ job, onSave, onClose }) {
  const [form, setForm] = useState({ ...POST_METRICS_EMPTY, ...(job?.postMetrics || {}) });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: Number(v) || 0 })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await updatePostMetrics(job._id, form);
      onSave(r.item);
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { k: "likes",         label: "Likes" },
    { k: "comments",      label: "Comments" },
    { k: "shares",        label: "Shares" },
    { k: "saves",         label: "Saves" },
    { k: "reach",         label: "Reach" },
    { k: "impressions",   label: "Impressions" },
    { k: "engagementRate", label: "Engagement Rate (%)" },
  ];

  return (
    <Modal open onClose={onClose} title={`Post Metrics — ${job?.title || "Post"}`} size="sm">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        {fields.map(({ k, label }) => (
          <div key={k}>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
            <Input
              type="number"
              min="0"
              step={k === "engagementRate" ? "0.01" : "1"}
              value={form[k]}
              onChange={(e) => set(k, e.target.value)}
            />
          </div>
        ))}
        <div className="col-span-2 flex justify-end gap-2 pt-1">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function FollowerGrowthChart({ growthData }) {
  if (!growthData || growthData.length === 0) {
    return <p className="py-6 text-center text-[12px] text-slate-400">No follower data available</p>;
  }
  const points = growthData.map((d) => d.followerCount || 0);
  const labels = growthData.map((d) => {
    const [y, m] = d.period.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short" });
  });
  const maxVal = Math.max(...points, 1);
  const W = 300, H = 100, PAD = 10;
  const xStep = (W - PAD * 2) / Math.max(points.length - 1, 1);
  const toX = (i) => PAD + i * xStep;
  const toY = (v) => PAD + (H - PAD * 2) * (1 - v / maxVal);
  const pathD = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(" ");
  const areaD = `${pathD} L ${toX(points.length - 1).toFixed(1)} ${H - PAD} L ${PAD} ${H - PAD} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
        <defs>
          <linearGradient id="fg-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6F7FD9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6F7FD9" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#fg-grad)" />
        <path d={pathD} fill="none" stroke="#6F7FD9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill="#6F7FD9" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-2">
        {labels.map((l, i) => (
          <span key={i} className="text-[10px] text-slate-400">{l}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ContentCalendarPage() {
  const toast = useToast();
  // PI closure: job approvals, notes, status and post metrics need jobs.write;
  // monthly social metrics need social.metrics.write (API). Independent.
  const access = useAccess();
  const canWriteJobs = access.can("jobs.write");
  const canWriteMetrics = access.can("social.metrics.write");

  const [{ year, month }, setYM] = useState(currentYearMonth);
  const [platform, setPlatform] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);

  const [jobs, setJobs]           = useState([]);
  const [unscheduled, setUnscheduled] = useState([]);
  const [metrics, setMetrics]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  const [metricsOpen, setMetricsOpen] = useState(false);
  const [metricsBusy, setMetricsBusy] = useState(false);

  const [activeTab, setActiveTab] = useState("calendar");
  const [growthData, setGrowthData] = useState([]);
  const [postMetricsJob, setPostMetricsJob] = useState(null);

  // Load 6-month follower growth when analytics tab is active
  useEffect(() => {
    if (activeTab !== "analytics") return;
    const periods = [];
    let y = year, m = month;
    for (let i = 0; i < 6; i++) {
      periods.push(`${y}-${String(m + 1).padStart(2, "0")}`);
      m -= 1;
      if (m < 0) { m = 11; y -= 1; }
    }
    Promise.all(
      periods.reverse().map((p) =>
        listSocialMetrics({ period: p, platform: "overall", ...(customerId ? { customerId } : {}) })
          .then((r) => {
            const item = (r?.items || []).find((x) => x.platform === "overall") || {};
            return { period: p, followerCount: item.followerCount || 0 };
          })
          .catch(() => ({ period: p, followerCount: 0 }))
      )
    ).then(setGrowthData);
  }, [activeTab, year, month, customerId]);

  // Load customers (for admin filter)
  useEffect(() => {
    listCustomers({ limit: 200 }).then((r) => setCustomers(r?.items || r?.customers || [])).catch(() => {});
  }, []);

  const period = `${year}-${String(month + 1).padStart(2, "0")}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const firstDay = new Date(year, month, 1).toISOString();
      const lastDay  = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const params = {
        scheduleFrom: firstDay,
        scheduleTo:   lastDay,
        limit:       200,
        sort:        "dueDate",
      };
      if (platform) params.platform = platform;
      if (customerId) params.customerId = customerId;

      const fetchPages = async (query) => {
        let all = [], page = 1, pages = 1;
        do { const r = await listJobs({ ...query, page, limit: 100 }); all.push(...(r.items || [])); pages = r.pages || 1; page += 1; } while (page <= pages);
        return { items: all };
      };
      const [jobsRes, unscheduledRes, metricsRes] = await Promise.all([
        fetchPages(params),
        fetchPages({ unscheduled: "true", ...(customerId ? { customerId } : {}), ...(platform ? { platform } : {}) }),
        listSocialMetrics({ period, ...(customerId ? { customerId } : {}) }),
      ]);

      // Filter to social media job types
      const allJobs = (jobsRes?.items || []).filter((j) => SOCIAL_TYPES.includes(j.type));
      setJobs(allJobs);
      setUnscheduled((unscheduledRes.items || []).filter((j) => SOCIAL_TYPES.includes(j.type) && j.operating?.disposition === "outstanding"));
      setMetrics(metricsRes?.items || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load calendar.");
    } finally {
      setLoading(false);
    }
  }, [year, month, platform, customerId, period, toast]);

  useEffect(() => { load(); }, [load]);

  // Group jobs by day
  const jobsByDay = useMemo(() => {
    const map = {};
    for (const j of jobs) {
      const day = dueDateDay(j);
      if (day) {
        if (!map[day]) map[day] = [];
        map[day].push(j);
      }
    }
    return map;
  }, [jobs]);

  // Upcoming posts (next 5 after today)
  const upcomingPosts = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return jobs
      .filter((j) => j.dueDate && new Date(j.dueDate) >= todayStart && j.status !== "published")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  }, [jobs]);

  // Stats from jobs
  const totalJobs = jobs.length;
  const pendingApproval = jobs.filter((j) => j.status === "client_review").length;
  const published  = jobs.filter((j) => j.status === "published").length;
  const scheduled  = jobs.filter((j) => j.status === "scheduled" || j.status === "approved").length;

  // Selected platform metrics. With "All Clients" selected, aggregate rows for the same platform.
  const selectedMetrics = useMemo(() => {
    const platformKey = platform || "overall";
    const rows = metrics.filter((m) => m.platform === platformKey);
    if (!rows.length) return null;
    if (customerId) return rows[0];

    const totals = rows.reduce(
      (acc, row) => {
        ["reach", "impressions", "likes", "comments", "shares", "saves", "newFollowers", "postsPublished"].forEach((key) => {
          acc[key] += Number(row[key] || 0);
        });
        acc.followerCount += Number(row.followerCount || 0);
        acc.engagementRate += Number(row.engagementRate || 0);
        return acc;
      },
      { reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, saves: 0, followerCount: 0, newFollowers: 0, postsPublished: 0, engagementRate: 0 }
    );

    return {
      platform: platformKey,
      ...totals,
      engagementRate: Math.round((totals.engagementRate / rows.length) * 100) / 100,
    };
  }, [customerId, metrics, platform]);

  const grid = calendarGrid(year, month);

  const handlePrevMonth = () => setYM(({ year: y, month: m }) => m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 });
  const handleNextMonth = () => setYM(({ year: y, month: m }) => m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 });

  const handleApprovalAdded = (updatedJob) => {
    setJobs((prev) => prev.map((j) => j._id === updatedJob._id ? updatedJob : j));
    setSelectedJob(updatedJob);
  };

  const handleStatusChange = (updatedJob) => {
    setJobs((prev) => prev.map((j) => j._id === updatedJob._id ? updatedJob : j));
    setSelectedJob(updatedJob);
  };

  const handleSaveMetrics = async (payload) => {
    if (!canWriteMetrics) return;
    setMetricsBusy(true);
    try {
      await upsertSocialMetrics(payload);
      setMetricsOpen(false);
      await load();
      toast.success("Metrics saved.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save metrics.");
    } finally {
      setMetricsBusy(false);
    }
  };

  const openMetricsModal = () => {
    if (!canWriteMetrics) return;
    if (!customerId) {
      toast.warning("Select a client before adding metrics.");
      return;
    }
    setMetricsOpen(true);
  };

  return (
    <div className="grid gap-6">
      {unscheduled.length > 0 && <Card className="p-4"><h2>Unscheduled managed work</h2><p>Choose a publication date on the Job. Contractual deadlines and origin periods are preserved.</p>{unscheduled.map((j) => <div key={j._id}><Link to={`/portal/jobs/${j._id}`}>{j.title}</Link>{identity(j.originDeliveryPeriodId) !== identity(j.workDeliveryPeriodId) ? " · Carry-in" : ""}{j.operating?.blockers?.some((b) => !b.endedAt) ? " · Blocked" : ""}</div>)}</Card>}
      <PageHeader
        eyebrow="DELIVERY"
        title="Content Calendar"
        subtitle="Social posts, approvals, publishing schedule, and platform performance."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Delivery" },
          { label: "Content Calendar" },
        ]}
        right={
          <div className="flex flex-wrap items-center gap-2">
            {customers.length > 0 && (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All Clients</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.companyName || c.contactName}</option>
                ))}
              </select>
            )}
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Tab switcher */}
      <div className="flex w-fit items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {[{ id: "calendar", label: "Calendar" }, { id: "analytics", label: "Analytics" }].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`h-9 rounded-xl px-4 text-[13px] font-black transition-all ${
              activeTab === t.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-indigo-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Platform filter chips */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPlatform(p.value)}
            className={[
              "h-9 rounded-xl border px-3 text-sm font-bold transition-all",
              platform === p.value
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600",
            ].join(" ")}
          >
            {p.value && PLATFORM_SHORT[p.value] ? `${PLATFORM_SHORT[p.value]} · ` : ""}{p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Total Posts" value={totalJobs} color="indigo" />
        <StatCard icon={Clock} label="Pending Approval" value={pendingApproval} color={pendingApproval ? "amber" : "slate"} />
        <StatCard icon={CheckCircle2} label="Scheduled" value={scheduled} color="blue" />
        <StatCard icon={TrendingUp} label="Published" value={published} color="emerald" />
      </div>

      {/* ── Analytics Tab ─────────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
        <div className="grid gap-5">
          {/* #7 Platform-wise cards */}
          <div>
            <h3 className="mb-3 text-[13px] font-bold text-slate-700">Platform Performance — {monthLabel(year, month)}</h3>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl border border-slate-100 p-4"><Skeleton className="h-32 w-full" /></div>)}
              </div>
            ) : metrics.filter((m) => m.platform !== "overall").length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                <BarChart2 size={28} className="mx-auto mb-2 text-slate-200" strokeWidth={1.5} />
                <p className="text-[13px] text-slate-400">No platform metrics for this month</p>
                {canWriteMetrics ? <button onClick={openMetricsModal} className="mt-2 text-[12px] text-indigo-600 hover:underline">+ Add metrics</button> : null}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {metrics.filter((m) => m.platform !== "overall").map((m) => (
                  <PlatformCard key={m._id || m.platform} metricRow={m} />
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* #8 Top Performing Posts */}
            <Card className="p-5">
              <h3 className="mb-3 text-[13px] font-bold text-slate-700 flex items-center gap-2">
                <TrendingUp size={14} className="text-indigo-500" /> Top Performing Posts
              </h3>
              {loading ? (
                <div className="grid gap-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
              ) : (
                (() => {
                  const scored = jobs
                    .filter((j) => j.postMetrics && (j.postMetrics.likes + j.postMetrics.comments + j.postMetrics.shares) > 0)
                    .map((j) => ({
                      ...j,
                      _score: (j.postMetrics?.likes || 0) + (j.postMetrics?.comments || 0) * 2 + (j.postMetrics?.shares || 0) * 3,
                    }))
                    .sort((a, b) => b._score - a._score)
                    .slice(0, 3);
                  return scored.length === 0 ? (
                    <div className="py-6 text-center">
                      <TrendingUp size={24} className="mx-auto mb-2 text-slate-200" strokeWidth={1.5} />
                      <p className="text-[12px] text-slate-400">No engagement data yet</p>
                      <p className="text-[11px] text-slate-300">Use the metrics edit button on a post to add data</p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {scored.map((j, rank) => {
                        const thumb = j.coverMedia?.thumbnailUrl || j.coverMedia?.url;
                        const ranks = ["1", "2", "3"];
                        return (
                          <div
                            key={j._id}
                            className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 cursor-pointer hover:bg-slate-100"
                            onClick={() => setSelectedJob(j)}
                          >
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-black text-indigo-700">
                              {ranks[rank] || rank + 1}
                            </span>
                            {thumb ? (
                              <img src={thumb} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center text-sm shrink-0">
                                {PLATFORM_SHORT[j.platform] || "POST"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-slate-800 truncate">{j.title || "Post"}</p>
                              <p className="text-[10px] text-slate-400">
                                Likes {j.postMetrics?.likes || 0} · Comments {j.postMetrics?.comments || 0} · Shares {j.postMetrics?.shares || 0}
                              </p>
                            </div>
                            {canWriteJobs ? (
                              <button
                                type="button"
                                title="Edit metrics"
                                aria-label={`Edit metrics for ${j.title || "post"}`}
                                onClick={(e) => { e.stopPropagation(); setPostMetricsJob(j); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition"
                              >
                                <Pencil size={12} />
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </Card>

            {/* #9 Follower Growth Chart */}
            <Card className="p-5">
              <h3 className="mb-3 text-[13px] font-bold text-slate-700 flex items-center gap-2">
                <Users size={14} className="text-indigo-500" /> Follower Growth (6 Months)
              </h3>
              <FollowerGrowthChart growthData={growthData} />
              {growthData.length > 0 && (
                <div className="mt-3 flex items-center justify-between text-[12px]">
                  <span className="text-slate-500">
                    Current: <strong className="text-slate-800">{Number(growthData[growthData.length - 1]?.followerCount || 0).toLocaleString()}</strong>
                  </span>
                  {growthData.length >= 2 && (() => {
                    const diff = (growthData[growthData.length - 1]?.followerCount || 0) - (growthData[growthData.length - 2]?.followerCount || 0);
                    return (
                      <span className={diff >= 0 ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"}>
                        {diff >= 0 ? "+" : ""}{diff.toLocaleString()} vs last month
                      </span>
                    );
                  })()}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "calendar" && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Calendar main */}
        <div className="grid gap-4">
          {/* Month nav */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="font-bold text-slate-800">{monthLabel(year, month)}</h2>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DOW.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400 uppercase py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            {loading ? (
              <div className="p-6">
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {grid.map((day, idx) => {
                  const posts = day ? (jobsByDay[day] || []) : [];
                  const isT   = day ? isToday(year, month, day) : false;
                  return (
                    <div
                      key={idx}
                      className={[
                        "min-h-[112px] border-b border-r border-slate-100 px-2 py-2",
                        idx % 7 === 6 ? "border-r-0" : "",
                        Math.floor(idx / 7) === Math.floor((grid.length - 1) / 7) ? "border-b-0" : "",
                        !day ? "bg-slate-50/40" : "",
                      ].join(" ")}
                    >
                      {day && (
                        <>
                          <span className={[
                            "inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full mb-0.5",
                            isT ? "bg-indigo-600 text-white" : "text-slate-500",
                          ].join(" ")}>
                            {day}
                          </span>
                          <div className="grid gap-0.5">
                            {posts.slice(0, 3).map((j) => (
                              <PostChip key={j._id} job={j} onClick={setSelectedJob} />
                            ))}
                            {posts.length > 3 && (
                              <span className="text-[10px] text-slate-400 px-1.5">
                                +{posts.length - 3} more
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="grid gap-4 content-start">
          {/* Stats */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <CalendarDays size={14} className="text-indigo-500" />
              This Month
            </h3>
            {loading ? (
              <div className="grid gap-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}
              </div>
            ) : (
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total posts</span>
                  <span className="font-bold text-slate-800">{totalJobs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400 inline-block" /> Pending approval</span>
                  <span className={`font-bold ${pendingApproval > 0 ? "text-orange-600" : "text-slate-800"}`}>{pendingApproval}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal-400 inline-block" /> Scheduled</span>
                  <span className="font-bold text-slate-800">{scheduled}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500 inline-block" /> Published</span>
                  <span className="font-bold text-slate-800">{published}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Upcoming posts */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Clock size={14} className="text-indigo-500" />
              Upcoming Posts
            </h3>
            {loading ? (
              <div className="grid gap-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : upcomingPosts.length === 0 ? (
              <p className="text-sm text-slate-400">No upcoming posts.</p>
            ) : (
              <div className="grid gap-2">
                {upcomingPosts.map((j) => {
                  const thumb = j.coverMedia?.thumbnailUrl || j.coverMedia?.url;
                  return (
                    <button
                      key={j._id}
                      onClick={() => setSelectedJob(j)}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 hover:bg-slate-100 px-3 py-2.5 transition-colors text-left w-full"
                    >
                      {thumb ? (
                        <img src={getAssetUrl(thumb)} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-lg shrink-0">
                          {PLATFORM_SHORT[j.platform] || "POST"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{j.title || j.caption?.slice(0, 40) || "Post"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 capitalize">{j.platform || "—"}</span>
                          <span className="text-[10px] text-slate-400">{fmtDate(j.dueDate)}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 h-2 w-2 rounded-full ${STATUS_DOT[j.status] || "bg-slate-300"}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Performance Metrics */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <BarChart2 size={14} className="text-indigo-500" />
                Performance
              </h3>
              {canWriteMetrics ? (
                <button
                  onClick={openMetricsModal}
                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Edit metrics"
                  aria-label="Edit monthly metrics"
                >
                  <Pencil size={13} />
                </button>
              ) : null}
            </div>
            {loading ? (
              <div className="grid gap-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 rounded-lg" />)}
              </div>
            ) : !selectedMetrics ? (
              <div className="text-center py-3">
                <p className="text-xs text-slate-400 mb-2">No data for {period}</p>
                {canWriteMetrics ? (
                  <button
                    onClick={openMetricsModal}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    + Add metrics
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1"><Eye size={11} /> Reach</span>
                  <span className="font-bold text-slate-800">{fmt(selectedMetrics.reach)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1"><TrendingUp size={11} /> Impressions</span>
                  <span className="font-bold text-slate-800">{fmt(selectedMetrics.impressions)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1"><Heart size={11} /> Engagement</span>
                  <span className="font-bold text-slate-800">{selectedMetrics.engagementRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1"><UserPlus size={11} /> New Followers</span>
                  <span className={`font-bold ${(selectedMetrics.newFollowers || 0) >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {(selectedMetrics.newFollowers || 0) >= 0 ? "+" : ""}{fmt(selectedMetrics.newFollowers)}
                  </span>
                </div>
                {selectedMetrics.followerCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><Users size={11} /> Followers</span>
                    <span className="font-bold text-slate-800">{fmt(selectedMetrics.followerCount)}</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
      }

      {/* Post Detail Drawer */}
      <PostDrawer
        open={!!selectedJob}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onApprovalAdded={handleApprovalAdded}
        onStatusChange={handleStatusChange}
        canWrite={canWriteJobs}
      />

      {/* Metrics Form */}
      <MetricsModal
        open={metricsOpen}
        existing={selectedMetrics}
        customerId={customerId}
        period={period}
        platform={platform || "overall"}
        busy={metricsBusy}
        onClose={() => setMetricsOpen(false)}
        onSubmit={handleSaveMetrics}
      />

      {/* Post Metrics Editor */}
      {postMetricsJob && canWriteJobs && (
        <PostMetricsModal
          job={postMetricsJob}
          onSave={(updated) => {
            setJobs((prev) => prev.map((j) => j._id === updated._id ? updated : j));
            setPostMetricsJob(null);
          }}
          onClose={() => setPostMetricsJob(null)}
        />
      )}
    </div>
  );
}
