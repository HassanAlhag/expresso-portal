import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, AlertTriangle, Clock, CheckCircle2, Zap, Ticket as TicketIcon } from "lucide-react";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import PageHeader from "../../../shared/ui/PageHeader";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import ViewToggle from "../../../shared/ui/ViewToggle";
import SegmentTabs from "../../../shared/ui/SegmentTabs";
import TicketStatusPill from "../components/TicketStatusPill";
import TicketTypeBadge from "../components/TicketTypeBadge";
import TicketFormModal from "../components/TicketFormModal";
import {
  listTickets,
  createTicket,
  getTicketStats,
} from "../api";
import { useToast } from "../../../shared/ui/Toast";
import {
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  SORT_OPTIONS,
  TYPE_OPTIONS,
  BOARD_COLUMNS,
} from "../constants";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dueLabel(dueDate, status) {
  if (!dueDate) return null;
  const terminal = ["resolved", "closed"];
  if (terminal.includes(status)) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  const days = Math.floor(diff / 86400000);
  if (diff < 0) return { text: `${Math.abs(days)}d overdue`, cls: "text-rose-600 bg-rose-50 border-rose-200" };
  if (days === 0) return { text: "Due today", cls: "text-orange-700 bg-orange-50 border-orange-200" };
  if (days === 1) return { text: "Due tomorrow", cls: "text-amber-700 bg-amber-50 border-amber-200" };
  return { text: `Due ${fmtDate(dueDate)}`, cls: "text-slate-500 bg-slate-50 border-slate-200" };
}

const PRIORITY_COLOR = {
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
  high:   "border-orange-200 bg-orange-50 text-orange-700",
  medium: "border-indigo-100 bg-indigo-50 text-indigo-700",
  low:    "border-slate-200 bg-slate-50 text-slate-600",
};

// ─── sub-components ─────────────────────────────────────────────────────────

function TicketRow({ ticket, onClick }) {
  const due = dueLabel(ticket.dueDate, ticket.status);
  const assignee = ticket.assignedTo?.fullName || ticket.assignedToId?.fullName;
  const client = ticket.customerId?.companyName || ticket.clientId?.companyName;
  return (
    <button
      onClick={onClick}
      className="group w-full text-left px-4 py-3.5 hover:bg-black/[0.02] transition border-b border-slate-100 last:border-0"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {ticket.ref && (
              <span className="font-mono text-xs font-bold text-slate-400">{ticket.ref}</span>
            )}
            <TicketTypeBadge type={ticket.type} showIcon={false} />
            <span className="text-sm font-bold text-slate-900 truncate">{ticket.title}</span>
          </div>

          {(client || ticket.description) && (
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
              {client ? <span className="font-semibold text-slate-600">{client} · </span> : null}
              {ticket.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <TicketStatusPill status={ticket.status} />
            {ticket.priority && (
              <span className={["inline-flex rounded-full border px-2 py-0.5 text-xs font-bold", PRIORITY_COLOR[ticket.priority]].join(" ")}>
                {ticket.priority.toUpperCase()}
              </span>
            )}
            {ticket.category && (
              <span className="text-xs text-slate-400">{ticket.category.replaceAll("_", " ")}</span>
            )}
            {due && (
              <span className={["inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", due.cls].join(" ")}>
                <Clock size={10} />
                {due.text}
              </span>
            )}
            {assignee && (
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {assignee}
              </span>
            )}
            {Array.isArray(ticket.tags) && ticket.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className="text-xs text-slate-400">
            {ticket.lastActivityAt ? fmtDate(ticket.lastActivityAt) : ""}
          </div>
          {ticket.approvalStatus === "pending" && (
            <span className="mt-1 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
              Pending approval
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function KanbanBoard({ tickets, onCardClick }) {
  const byStatus = useMemo(() => {
    const map = {};
    BOARD_COLUMNS.forEach((col) => { map[col.status] = []; });
    tickets.forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [tickets]);

  const colorBorder = {
    emerald: "border-emerald-200",
    indigo:  "border-indigo-200",
    orange:  "border-orange-200",
    amber:   "border-amber-200",
    violet:  "border-violet-200",
    rose:    "border-rose-200",
    slate:   "border-slate-200",
  };

  const colorHeader = {
    emerald: "bg-emerald-50 text-emerald-800",
    indigo:  "bg-indigo-50 text-indigo-800",
    orange:  "bg-orange-50 text-orange-800",
    amber:   "bg-amber-50 text-amber-800",
    violet:  "bg-violet-50 text-violet-800",
    rose:    "bg-rose-50 text-rose-800",
    slate:   "bg-slate-50 text-slate-600",
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {BOARD_COLUMNS.map((col) => {
        const cards = byStatus[col.status] || [];
        return (
          <div
            key={col.status}
            className={["flex-shrink-0 w-64 rounded-xl border flex flex-col", colorBorder[col.color]].join(" ")}
          >
            <div className={["flex items-center justify-between px-3 py-2.5 rounded-t-xl border-b", colorHeader[col.color], colorBorder[col.color]].join(" ")}>
              <span className="text-xs font-bold">{col.label}</span>
              <span className="text-xs font-black">{cards.length}</span>
            </div>
            <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto max-h-[520px]">
              {cards.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">Empty</div>
              ) : (
                cards.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => onCardClick(t._id)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:shadow-sm hover:border-indigo-200 transition"
                  >
                    {t.ref && <div className="font-mono text-xs text-slate-400 mb-1">{t.ref}</div>}
                    <div className="text-sm font-semibold text-slate-800 line-clamp-2">{t.title}</div>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <TicketTypeBadge type={t.type} showIcon={false} />
                      {t.priority && (
                        <span className={["rounded-full border px-1.5 py-0.5 text-xs font-bold", PRIORITY_COLOR[t.priority]].join(" ")}>
                          {t.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {t.dueDate && dueLabel(t.dueDate, t.status) && (
                      <div className={["mt-1.5 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs", dueLabel(t.dueDate, t.status).cls].join(" ")}>
                        <Clock size={9} />
                        {dueLabel(t.dueDate, t.status).text}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── main page ──────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [activeType, setActiveType] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [sort, setSort] = useState("-lastActivityAt");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("list");

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const limit = view === "board" ? 200 : 20;

  const typeTabs = useMemo(() => [
    { value: "", label: "All", count: Object.values(stats?.byType || {}).reduce((a, b) => a + b, 0) },
    ...TYPE_OPTIONS.map((t) => ({ ...t, count: stats?.byType?.[t.value] || 0 })),
  ], [stats]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, statsRes] = await Promise.all([
        listTickets({ q, status, category, priority, type: activeType, sort, page, limit }),
        getTicketStats(),
      ]);
      setItems(res?.items || []);
      setMeta({ page: res?.page || 1, pages: res?.pages || 1, total: res?.total ?? 0 });
      setStats(statsRes);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [q, status, category, priority, activeType, sort, page, limit]);

  useEffect(() => { load(); }, [load]);

  const resetFilters = () => {
    setQ(""); setStatus(""); setCategory(""); setPriority("");
    setSort("-lastActivityAt"); setPage(1); setActiveType("");
  };

  const onCreate = async (payload) => {
    setBusy(true);
    try {
      const res = await createTicket(payload);
      setCreateOpen(false);
      const id = res?.item?._id || res?._id;
      if (id) nav(`/portal/tickets/${id}`);
      else { setPage(1); load(); }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const openCount     = stats?.byStatus?.open || 0;
  const urgentCount   = stats?.byPriority?.urgent || 0;
  const overdueCount  = stats?.overdue || 0;
  const resolvedCount = (stats?.byStatus?.resolved || 0) + (stats?.byStatus?.closed || 0);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="OPERATIONS"
        title="Tickets"
        subtitle="Support, change requests, internal tasks, and procurement."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Tickets" }]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)} disabled={busy}>
              <Plus size={15} />
              New ticket
            </Button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={TicketIcon}    label="Open"     value={openCount}     color="emerald" />
        <StatCard icon={Zap}           label="Urgent"   value={urgentCount}   color="rose"    />
        <StatCard icon={AlertTriangle} label="Overdue"  value={overdueCount}  color="amber"   />
        <StatCard icon={CheckCircle2}  label="Resolved" value={resolvedCount} color="slate"   />
      </div>

      {/* Type tabs */}
      <SegmentTabs
        tabs={typeTabs}
        value={activeType}
        onChange={(t) => { setActiveType(t); setPage(1); }}
      />

      {/* Filter bar */}
      <FilterBar
        searchValue={q}
        onSearchChange={(v) => { setQ(v); setPage(1); }}
        searchPlaceholder="Search tickets…"
        filters={[
          { label: "Status",   value: status,   onChange: (v) => { setStatus(v);   setPage(1); }, options: STATUS_OPTIONS   },
          { label: "Category", value: category, onChange: (v) => { setCategory(v); setPage(1); }, options: CATEGORY_OPTIONS },
          { label: "Priority", value: priority, onChange: (v) => { setPriority(v); setPage(1); }, options: PRIORITY_OPTIONS },
          { label: "Sort",     value: sort,     onChange: (v) => { setSort(v);                 }, options: SORT_OPTIONS     },
        ]}
        onClear={resetFilters}
        right={<ViewToggle value={view} onChange={setView} />}
      />

      {/* Content */}
      {loading ? (
        <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-sm grid gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title="No tickets found"
          message="Try adjusting filters or create a new ticket."
          actionLabel="New ticket"
          onAction={() => setCreateOpen(true)}
        />
      ) : view === "board" ? (
        <KanbanBoard tickets={items} onCardClick={(id) => nav(`/portal/tickets/${id}`)} />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
          {items.map((t) => (
            <TicketRow key={t._id} ticket={t} onClick={() => nav(`/portal/tickets/${t._id}`)} />
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <span className="text-xs text-slate-500">
              Page <b>{meta.page}</b> of <b>{meta.pages}</b> · {meta.total} total
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={meta.page <= 1}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(meta.pages, p + 1))} disabled={meta.page >= meta.pages}>Next</Button>
            </div>
          </div>
        </div>
      )}

      <TicketFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={onCreate} busy={busy} />
    </div>
  );
}
