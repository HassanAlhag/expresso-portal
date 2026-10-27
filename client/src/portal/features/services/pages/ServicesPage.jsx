import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import PageHeader from "../../../shared/ui/PageHeader";
import Badge from "../../../shared/ui/Badge";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useAccess } from "../../../shared/hooks/useAccess";

import {
  Plus,
  RefreshCw,
  Layers,
  Search,
  ArrowUpDown,
  Filter,
  LayoutGrid,
  List,
  Pencil,
  Archive,
  CheckCircle2,
  Clock3,
  FileText,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";

import {
  listServices,
  createService,
  updateService,
  deleteService,
} from "../api";
import { BRAND, STATUS_OPTIONS, SORT_OPTIONS } from "../constants";

import ServiceStatusPill from "../components/ServiceStatusPill";
import ServiceFormModal from "../components/ServiceFormModal";

// ── Creative type helpers ─────────────────────────────────────────────────────

const CREATIVE_CHIP = {
  post:     { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  reel:     { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200" },
  story:    { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200" },
  video:    { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  design:   { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200" },
  carousel: { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  page:     { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200" },
  phase:    { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  task:     { bg: "bg-slate-50",   text: "text-slate-500",   border: "border-slate-200" },
  other:    { bg: "bg-slate-50",   text: "text-slate-500",   border: "border-slate-200" },
};

function countCreativesByType(service) {
  const groups = Array.isArray(service?.scopeGroups) ? service.scopeGroups : [];
  const counts = {};
  for (const group of groups) {
    const jobs = Array.isArray(group?.jobs) ? group.jobs : [];
    for (const job of jobs) {
      const type = job.type || "task";
      const qty = Math.max(1, Number(job.quantity || 1));
      counts[type] = (counts[type] || 0) + qty;
    }
  }
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
}

function CreativeChip({ type, count }) {
  const style = CREATIVE_CHIP[type] || CREATIVE_CHIP.other;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-black capitalize",
        style.bg,
        style.text,
        style.border,
      ].join(" ")}
    >
      {count} {type}
    </span>
  );
}

function coverSrc(service) {
  const cov = service?.coverImageId;
  return cov?.thumbnailUrl || cov?.url || null;
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

function StatCard({ label, value, hint, Icon, tone = "brand" }) {
  const tones = {
    brand: "bg-[rgba(127,138,209,0.14)]",
    green: "bg-emerald-50",
    amber: "bg-amber-50",
    blue: "bg-sky-50",
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
            {label}
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900">{value}</div>
          {hint ? (
            <div className="mt-1 text-xs text-slate-500">{hint}</div>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={[
              "grid h-11 w-11 place-items-center rounded-2xl border border-black/10",
              tones[tone] || tones.brand,
            ].join(" ")}
          >
            <Icon size={18} className="text-slate-800" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function ViewToggle({ value, onChange }) {
  const itemClass = (active) =>
    [
      "inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-black transition",
      active
        ? "border border-[rgba(127,138,209,0.25)] bg-[rgba(127,138,209,0.14)] text-slate-900 shadow-sm"
        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
    ].join(" ");

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1">
      <button type="button" onClick={() => onChange("cards")} className={itemClass(value === "cards")}>
        <LayoutGrid size={16} />
        Cards
      </button>
      <button type="button" onClick={() => onChange("list")} className={itemClass(value === "list")}>
        <List size={16} />
        List
      </button>
    </div>
  );
}

function money(value) {
  if (typeof value !== "number") return null;
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
  } catch {
    return String(value);
  }
}

// ── ServiceCard ───────────────────────────────────────────────────────────────

function ServiceCard({ service, busy, nav, onEditQuick, onArchive, canWrite = false }) {
  const name = service.name || service.title || "Untitled";
  const slug = service.slug || "—";
  const summary = service.summary || service.description || "—";
  const price = money(service.price);
  const creatives = countCreativesByType(service);
  const thumb = coverSrc(service);

  return (
    <div className="group overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
      <button
        type="button"
        onClick={() => nav(`/portal/services/${service._id}`)}
        className="block w-full text-left"
      >
        {/* Cover image */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          {thumb ? (
            <img
              src={thumb}
              alt={name}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top_right,rgba(127,138,209,0.22),transparent_55%)]">
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-black/5 bg-white/70 text-slate-300">
                <ImageIcon size={26} />
              </div>
              <div className="text-sm font-black text-slate-300">
                {name.slice(0, 2).toUpperCase() || "SV"}
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3">
            <ServiceStatusPill status={service.status} />
          </div>
        </div>

        <div className="p-5">
          {/* Name + slug */}
          <div className="mt-1">
            <div className="line-clamp-1 text-lg font-black text-slate-900">{name}</div>
            <div className="mt-0.5 line-clamp-1 text-xs text-slate-400">/{slug}</div>
          </div>

          <div className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{summary}</div>

          {/* Creative type chips */}
          {creatives.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {creatives.slice(0, 5).map(([type, count]) => (
                <CreativeChip key={type} type={type} count={count} />
              ))}
              {creatives.length > 5 && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-black text-slate-400">
                  +{creatives.length - 5} more
                </span>
              )}
            </div>
          ) : (
            <div className="mt-3">
              <Badge tone="neutral">No creatives</Badge>
            </div>
          )}

          {/* Stats row */}
          <div className="mt-4 grid gap-3 rounded-[20px] border border-black/5 bg-slate-50/70 p-4 sm:grid-cols-2">
            <div>
              <div className="text-[11px] font-black tracking-[0.18em] text-slate-400">PRICING</div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {price || "—"}{" "}
                <span className="text-slate-500">
                  {service.billingCycle ? `/${service.billingCycle}` : ""}
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-black tracking-[0.18em] text-slate-400">SLA</div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {service.sla?.deliveryDays ?? "—"}d delivery
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Open service</div>
            <ChevronRight size={18} className="text-slate-400 transition group-hover:translate-x-1" />
          </div>
        </div>
      </button>

      {canWrite || onArchive ? (
      <div className="border-t border-black/5 bg-white/70 px-5 py-3">
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <>
              <Button variant="outline" size="sm" onClick={() => nav(`/portal/services/${service._id}/edit`)} disabled={busy}>
                <Pencil size={14} />
                Builder
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEditQuick(service)} disabled={busy}>
                Edit
              </Button>
            </>
          ) : null}
          {onArchive ? (
            <Button variant="outline" size="sm" onClick={() => onArchive(service)} disabled={busy} aria-label={`Archive ${name}`}>
              <Archive size={14} />
            </Button>
          ) : null}
        </div>
      </div>
      ) : null}
    </div>
  );
}

// ── ServiceRow (list view) ────────────────────────────────────────────────────

function ServiceRow({ service, busy, nav, onArchive, canWrite = false }) {
  const name = service.name || service.title || "Untitled";
  const slug = service.slug || "—";
  const summary = service.summary || service.description || "—";
  const price = money(service.price);
  const creatives = countCreativesByType(service);
  const thumb = coverSrc(service);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => nav(`/portal/services/${service._id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          nav(`/portal/services/${service._id}`);
        }
      }}
      className="group cursor-pointer px-5 py-5 transition hover:bg-slate-50/80"
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-black/[0.07] bg-slate-100">
          {thumb ? (
            <img src={thumb} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(127,138,209,0.2),transparent_60%)] text-slate-300">
              <Layers size={22} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-base font-black text-slate-900">{name}</div>
            <ServiceStatusPill status={service.status} />
            <span className="truncate text-xs text-slate-400">/{slug}</span>
          </div>

          <div className="mt-1.5 line-clamp-1 text-sm leading-6 text-slate-600">{summary}</div>

          {/* Creative chips */}
          {creatives.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {creatives.slice(0, 6).map(([type, count]) => (
                <CreativeChip key={type} type={type} count={count} />
              ))}
              {creatives.length > 6 && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-black text-slate-400">
                  +{creatives.length - 6}
                </span>
              )}
            </div>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>
              Pricing:{" "}
              <span className="font-extrabold text-slate-700">
                {price || "—"}
                {service.billingCycle ? ` / ${service.billingCycle}` : ""}
              </span>
            </span>
            <span>
              SLA:{" "}
              <span className="font-extrabold text-slate-700">
                {service.sla?.deliveryDays ?? "—"}d
              </span>
            </span>
            <span>
              Updated:{" "}
              <span className="font-extrabold text-slate-700">
                {service.updatedAt ? new Date(service.updatedAt).toLocaleDateString() : "—"}
              </span>
            </span>
          </div>
        </div>

        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {canWrite ? (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-[rgba(127,138,209,0.25)] hover:bg-[rgba(127,138,209,0.08)] hover:text-slate-900"
              onClick={() => nav(`/portal/services/${service._id}/edit`)}
              title="Edit in builder"
              aria-label={`Edit ${name} in builder`}
              disabled={busy}
            >
              <Pencil size={15} />
            </button>
          ) : null}
          {onArchive ? (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => onArchive(service)}
              title="Archive"
              aria-label={`Archive ${name}`}
              disabled={busy}
            >
              <Archive size={15} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const nav = useNavigate();
  const toast = useToast();
  // PI closure: create and edit need services.write; archiving calls
  // DELETE /api/service/:id, which needs services.delete.
  const access = useAccess();
  const canWrite = access.can("services.write");
  const canDelete = access.can("services.delete");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [view, setView] = useState("cards");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const limit = 12;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listServices({ q, status, sort, page, limit });
      const rows = Array.isArray(res?.items || res?.services)
        ? res.items || res.services
        : [];
      setItems(rows);
      setMeta({
        page: res?.page || page,
        pages: res?.pages || 1,
        total: res?.total ?? rows.length,
      });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [page, q, sort, status]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: meta.total || 0,
    activePage: items.filter((x) => x.status === "active").length,
    draftPage: items.filter((x) => x.status === "draft").length,
  }), [items, meta.total]);

  const handleCreate = async (payload) => {
    if (!canWrite) return;
    setBusy(true);
    try {
      const res = await createService(payload);
      setCreateOpen(false);
      setPage(1);
      await load();
      const id = res?.item?._id || res?._id;
      if (id) nav(`/portal/services/${id}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async (payload) => {
    if (!canWrite || !selected?._id) return;
    setBusy(true);
    try {
      await updateService(selected._id, payload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = (service) => {
    if (!canDelete || !service?._id) return;
    setConfirmState({
      title: "Archive service",
      message: `Archive "${service.name || "service"}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        setConfirmState(null);
        try {
          await deleteService(service._id);
          await load();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Archive failed");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CATALOG"
        title="Services"
        subtitle="Reusable service templates for sales, scope, delivery, and approvals."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Services" }]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading || busy}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            {canWrite ? (
              <Button onClick={() => setCreateOpen(true)} disabled={busy} style={{ backgroundColor: BRAND }}>
                <Plus size={16} />
                New service
              </Button>
            ) : null}
          </div>
        }
      />

      {!loading && !error ? (
        <div className="grid gap-4 xl:grid-cols-12">
          <Card className="xl:col-span-7 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="text-base font-black text-slate-900">Service Catalog</div>
                <div className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  Keep every agency offering here as a structured template. Reuse it later in projects, scope items, jobs, pricing, and approvals.
                </div>
              </div>
              <div className="shrink-0">
                <ViewToggle value={view} onChange={setView} />
              </div>
            </div>
          </Card>

          <div className="xl:col-span-5 grid gap-4 sm:grid-cols-3">
            <StatCard label="ACTIVE" value={stats.activePage} hint="ready to use" Icon={CheckCircle2} tone="green" />
            <StatCard label="DRAFT" value={stats.draftPage} hint="being prepared" Icon={Clock3} tone="amber" />
            <StatCard label="TOTAL" value={stats.total} hint="in catalog" Icon={FileText} tone="brand" />
          </div>
        </div>
      ) : null}

      <Card className="p-4">
        <div className="grid items-end gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="relative">
              <Input
                label="Search"
                value={q}
                onChange={(e) => { setPage(1); setQ(e.target.value); }}
                placeholder="Name, slug, summary…"
              />
              <div className="pointer-events-none absolute right-3 top-[38px] text-slate-400">
                <Search size={16} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="grid gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500">
                <Filter size={14} />
                Status
              </span>
              <select
                value={status}
                onChange={(e) => { setPage(1); setStatus(e.target.value); }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={`${o.value}-${o.label}`} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="lg:col-span-3">
            <label className="grid gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500">
                <ArrowUpDown size={14} />
                Sort
              </span>
              <select
                value={sort}
                onChange={(e) => { setPage(1); setSort(e.target.value); }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="lg:col-span-12 flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              onClick={() => { setQ(""); setStatus(""); setSort("-createdAt"); setPage(1); }}
              disabled={busy}
            >
              Clear
            </Button>
            <div className="ml-auto text-xs text-slate-500">
              Page <span className="font-extrabold">{meta.page}</span> /{" "}
              <span className="font-extrabold">{meta.pages}</span> • Total{" "}
              <span className="font-extrabold">{stats.total}</span>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-6">
          <div className="grid gap-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No services yet"
          message={canWrite ? "Create your first template to start building scope, projects, and execution." : "No service templates have been created yet."}
          actionLabel={canWrite ? "New service" : undefined}
          onAction={canWrite ? () => setCreateOpen(true) : undefined}
        />
      ) : view === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              busy={busy}
              nav={nav}
              onEditQuick={(item) => { setSelected(item); setEditOpen(true); }}
              onArchive={canDelete ? handleArchive : undefined}
              canWrite={canWrite}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-slate-200">
            {items.map((service) => (
              <ServiceRow
                key={service._id}
                service={service}
                busy={busy}
                nav={nav}
                onArchive={canDelete ? handleArchive : undefined}
                canWrite={canWrite}
              />
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <div className="text-xs text-slate-500">
              Showing page <span className="font-extrabold">{meta.page}</span> of{" "}
              <span className="font-extrabold">{meta.pages}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={meta.page <= 1}>
                Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(meta.pages, p + 1))} disabled={meta.page >= meta.pages}>
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      <ServiceFormModal
        open={createOpen}
        mode="create"
        busy={busy}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <ServiceFormModal
        open={editOpen}
        mode="edit"
        initial={selected}
        busy={busy}
        onClose={() => { setEditOpen(false); setSelected(null); }}
        onSubmit={handleEdit}
      />

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
}
