import React, { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../../../shared/api/client";
import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import { useToast } from "../../../shared/ui/Toast";
import FilterBar from "../../../shared/ui/FilterBar";
import {
  Activity,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Shield,
  Users,
  MailPlus,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  PlusCircle,
  Lock,
  Key,
  Globe,
} from "lucide-react";

// ── helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)    return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fullDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function initials(email) {
  if (!email) return "?";
  const [local] = email.split("@");
  return local.slice(0, 2).toUpperCase();
}

// ── action metadata ──────────────────────────────────────────────────────────

const ACTION_META = {
  "user.created":         { label: "User created",          Icon: PlusCircle, color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  "user.updated":         { label: "User updated",          Icon: Edit,       color: "#6366f1", bg: "rgba(99,102,241,0.10)" },
  "user.deleted":         { label: "User deleted",          Icon: Trash2,     color: "#f43f5e", bg: "rgba(244,63,94,0.10)"  },
  "user.deactivated":     { label: "User deactivated",      Icon: Shield,     color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  "user.activated":       { label: "User activated",        Icon: Shield,     color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  "user.role_changed":    { label: "Role changed",          Icon: Shield,     color: "#a78bfa", bg: "rgba(167,139,250,0.10)"},
  "user.password_reset":  { label: "Password reset",        Icon: Key,        color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  "auth.login":           { label: "Login",                 Icon: LogIn,      color: "#60a5fa", bg: "rgba(96,165,250,0.10)" },
  "auth.logout":          { label: "Logout",                Icon: LogOut,     color: "#94a3b8", bg: "rgba(148,163,184,0.10)"},
  "auth.login_failed":    { label: "Login failed",          Icon: Lock,       color: "#f43f5e", bg: "rgba(244,63,94,0.10)"  },
  "invite.created":       { label: "Invite sent",           Icon: MailPlus,   color: "#6366f1", bg: "rgba(99,102,241,0.10)" },
  "invite.accepted":      { label: "Invite accepted",       Icon: MailPlus,   color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  "invite.cancelled":     { label: "Invite cancelled",      Icon: MailPlus,   color: "#f43f5e", bg: "rgba(244,63,94,0.10)"  },
  "role.created":         { label: "Role created",          Icon: Shield,     color: "#a78bfa", bg: "rgba(167,139,250,0.10)"},
  "role.updated":         { label: "Role updated",          Icon: Shield,     color: "#6366f1", bg: "rgba(99,102,241,0.10)" },
  "role.deleted":         { label: "Role deleted",          Icon: Shield,     color: "#f43f5e", bg: "rgba(244,63,94,0.10)"  },
  "team.created":         { label: "Team created",          Icon: Users,      color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  "team.updated":         { label: "Team updated",          Icon: Users,      color: "#6366f1", bg: "rgba(99,102,241,0.10)" },
};

function getActionMeta(action) {
  if (!action) return { label: action || "Unknown", Icon: Activity, color: "#94a3b8", bg: "rgba(148,163,184,0.10)" };
  if (ACTION_META[action]) return ACTION_META[action];
  // derive from prefix
  if (action.includes("login"))   return { label: action, Icon: LogIn,      color: "#60a5fa", bg: "rgba(96,165,250,0.10)"  };
  if (action.includes("delete"))  return { label: action, Icon: Trash2,     color: "#f43f5e", bg: "rgba(244,63,94,0.10)"   };
  if (action.includes("create"))  return { label: action, Icon: PlusCircle, color: "#10b981", bg: "rgba(16,185,129,0.10)"  };
  if (action.includes("update"))  return { label: action, Icon: Edit,       color: "#6366f1", bg: "rgba(99,102,241,0.10)"  };
  if (action.includes("user"))    return { label: action, Icon: User,       color: "#6366f1", bg: "rgba(99,102,241,0.10)"  };
  if (action.includes("role"))    return { label: action, Icon: Shield,     color: "#a78bfa", bg: "rgba(167,139,250,0.10)" };
  if (action.includes("team"))    return { label: action, Icon: Users,      color: "#10b981", bg: "rgba(16,185,129,0.10)"  };
  if (action.includes("invite"))  return { label: action, Icon: MailPlus,   color: "#6366f1", bg: "rgba(99,102,241,0.10)"  };
  return { label: action, Icon: Globe, color: "#94a3b8", bg: "rgba(148,163,184,0.10)" };
}

// ── sub-components ─────────────────────────────────────────────────────────────

function AuditEventRow({ event }) {
  const { label, Icon, color, bg } = getActionMeta(event.action);
  const [expanded, setExpanded] = useState(false);
  const hasMeta = event.meta && Object.keys(event.meta).length > 0;

  return (
    <div className="flex gap-4 py-4 border-b border-slate-100 last:border-0">
      {/* icon */}
      <div
        className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: bg, color }}
      >
        <Icon size={15} />
      </div>

      {/* content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[13px] font-bold text-slate-800">{label}</span>
            <span className="ml-2 font-mono text-[11px] text-slate-400">{event.action}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
            <span title={fullDate(event.createdAt)}>{timeAgo(event.createdAt)}</span>
          </div>
        </div>

        {/* actor row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {event.actorEmail && (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black text-white"
                style={{ background: "var(--brand)" }}
              >
                {initials(event.actorEmail)}
              </span>
              {event.actorEmail}
            </span>
          )}
          {event.ip && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
              <Globe size={11} />
              {event.ip}
            </span>
          )}
          <span className="text-[11px] text-slate-400">
            {fullDate(event.createdAt)}
          </span>
        </div>

        {/* meta expandable */}
        {hasMeta && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition"
          >
            <ChevronDown
              size={12}
              className={`transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
            />
            {expanded ? "Hide details" : "Show details"}
          </button>
        )}
        {hasMeta && expanded && (
          <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
            {JSON.stringify(event.meta, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

// ── action filter options ─────────────────────────────────────────────────────

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "auth",   label: "Auth (login/logout)" },
  { value: "user",   label: "User changes" },
  { value: "role",   label: "Role changes" },
  { value: "team",   label: "Team changes" },
  { value: "invite", label: "Invites" },
];

// ── page ─────────────────────────────────────────────────────────────────────

const LIMIT = 30;

export default function ActivityPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);

  const [q, setQ]               = useState("");
  const [action, setAction]     = useState("");

  const timer = useRef(null);

  const load = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:  String(opts.page  ?? page),
        limit: String(LIMIT),
        q:     opts.q      ?? q,
        action: opts.action ?? action,
      });
      const { data } = await api.get(`/audit?${params}`);
      setItems(data?.items  ?? []);
      setTotal(data?.total  ?? 0);
      setPages(data?.pages  ?? 1);
    } catch (err) {
      if (err?.response?.status === 404) {
        setItems([]);
        setTotal(0);
        setPages(1);
      } else {
        toast.error("Failed to load activity log.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, q, action, toast]);

  useEffect(() => { load(); }, [load]);

  // debounce q
  const handleQChange = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      load({ q: val, page: 1 });
    }, 350);
  };

  const handleActionChange = (val) => {
    setAction(val);
    setPage(1);
    load({ action: val, page: 1 });
  };

  const handlePageChange = (p) => {
    setPage(p);
    load({ page: p });
  };

  const handleClear = () => {
    setQ(""); setAction(""); setPage(1);
    load({ q: "", action: "", page: 1 });
  };

  return (
    <div className="grid gap-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <PageHeader
        eyebrow="REPORTING"
        title="Activity"
        subtitle="System-wide audit trail — every action, who did it, and when."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Activity" }]}
        right={
          <div className="flex items-center gap-2">
            {total > 0 && (
              <span className="text-xs font-extrabold text-slate-500">
                {total.toLocaleString()} events
              </span>
            )}
            <Button variant="outline" onClick={() => load()} disabled={loading} size="sm">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        }
      />

      <FilterBar
        searchValue={q}
        onSearchChange={handleQChange}
        searchPlaceholder="Search by action, email, IP…"
        filters={[
          { label: "action", value: action, onChange: handleActionChange, options: ACTION_OPTIONS },
        ]}
        onClear={handleClear}
      />

      {/* ── Timeline ────────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="grid gap-3 p-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-9 w-9 flex-shrink-0 rounded-xl" />
                <div className="flex-1 grid gap-2">
                  <Skeleton className="h-4 w-48 rounded-full" />
                  <Skeleton className="h-3 w-72 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity found"
            message="No audit events match your current filters."
          />
        ) : (
          <div className="px-5">
            {items.map((event) => (
              <AuditEventRow key={event._id} event={event} />
            ))}
          </div>
        )}
      </Card>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page <span className="font-extrabold text-slate-800">{page}</span>{" "}
            of <span className="font-extrabold text-slate-800">{pages}</span>
            {" "}· {total.toLocaleString()} total events
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft size={15} /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages || loading}
              onClick={() => handlePageChange(page + 1)}
            >
              Next <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
