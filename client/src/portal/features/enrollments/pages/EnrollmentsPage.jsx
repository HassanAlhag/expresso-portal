import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";

import { listEnrollments, createEnrollment, updateEnrollment } from "../api";
import CreateEnrollmentModal from "../components/CreateEnrollmentModal";
import EditEnrollmentModal from "../components/EditEnrollmentModal";

import {
  ClipboardList,
  Plus,
  RefreshCw,
  ChevronRight,
  BriefcaseBusiness,
  FolderKanban,
  Building2,
  Layers3,
} from "lucide-react";

const BRAND = "#6F7FD9";

function MetaPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
      {children}
    </span>
  );
}

function executionModeLabel(mode) {
  const raw = String(mode || "").trim();
  if (raw === "phased_project") return "Phased project";
  if (raw === "one_time") return "One-time";
  if (raw === "recurring") return "Recurring";
  return raw || "—";
}

function scopeSummary(item) {
  const finalScope = item?.finalScope || {};
  const groups = Array.isArray(finalScope.groups) ? finalScope.groups : [];

  const jobsCount = groups.reduce((sum, group) => {
    const jobs = Array.isArray(group?.jobs) ? group.jobs : [];
    return (
      sum +
      jobs.reduce(
        (jobSum, job) => jobSum + Math.max(1, Number(job?.quantity || 1)),
        0
      )
    );
  }, 0);

  const mode =
    item?.serviceTemplateId?.executionMode ||
    item?.finalScope?.mode ||
    "recurring";

  if (mode === "phased_project" || mode === "one_time") {
    if (groups.length === 0) return "No phases yet";
    if (jobsCount > 0) {
      return `${jobsCount} job(s) across ${groups.length} phase(s)`;
    }
    return `${groups.length} phase(s)`;
  }

  if (groups.length === 0) return "No outputs yet";
  if (jobsCount > 0) return `${jobsCount} output(s)`;
  return `${groups.length} group(s)`;
}

export default function EnrollmentsPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await listEnrollments();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load enrollments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (payload) => {
    setBusy(true);
    try {
      await createEnrollment(payload);
      setCreateOpen(false);
      await load();
      toast.success("Enrollment created successfully.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const onEdit = async (payload) => {
    if (!selectedEnrollment?._id) return;

    setBusy(true);
    try {
      await updateEnrollment(selectedEnrollment._id, payload);
      setEditOpen(false);
      setSelectedEnrollment(null);
      await load();
      toast.success("Enrollment updated successfully.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const customerName =
        item?.customerId?.companyName ||
        item?.customerId?.contactName ||
        item?.customerName ||
        "";

      const projectName = item?.projectId?.name || item?.projectName || "";

      const serviceName =
        item?.serviceTemplateId?.name || item?.serviceName || "";

      const mode =
        item?.serviceTemplateId?.executionMode ||
        item?.finalScope?.mode ||
        item?.executionMode ||
        "";

      const currentStatus = item?.status || "";

      const matchesQ =
        !q ||
        [customerName, projectName, serviceName, currentStatus, mode]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase());

      const matchesStatus = !status || currentStatus === status;

      return matchesQ && matchesStatus;
    });
  }, [items, q, status]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((x) => x.status === "active").length,
      recurring: items.filter(
        (x) =>
          (x?.serviceTemplateId?.executionMode || x?.finalScope?.mode) ===
          "recurring"
      ).length,
      phased: items.filter((x) =>
        ["phased_project", "one_time"].includes(
          x?.serviceTemplateId?.executionMode || x?.finalScope?.mode
        )
      ).length,
    };
  }, [items]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="COMMERCIAL"
        title="Enrollments"
        subtitle="Fixed client services and their active delivery scope."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Enrollments" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading || busy}>
              <RefreshCw size={16} />
              Refresh
            </Button>

            <Button
              onClick={() => setCreateOpen(true)}
              style={{ backgroundColor: BRAND }}
              disabled={busy}
            >
              <Plus size={16} />
              New enrollment
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList}    label="Total"         value={stats.total}     color="indigo"  />
        <StatCard icon={Layers3}          label="Active"        value={stats.active}    color="emerald" />
        <StatCard icon={BriefcaseBusiness} label="Recurring"   value={stats.recurring} color="blue"    />
        <StatCard icon={FolderKanban}     label="Project-Based" value={stats.phased}    color="violet"  />
      </div>

      <FilterBar
        searchValue={q}
        onSearchChange={(v) => setQ(v)}
        searchPlaceholder="Client, service, project, mode…"
        filters={[
          { label: "status", value: status, onChange: (v) => setStatus(v), options: [
            { value: "", label: "All status" },
            { value: "active", label: "Active" },
            { value: "paused", label: "Paused" },
            { value: "completed", label: "Completed" },
            { value: "archived", label: "Archived" },
          ]},
        ]}
        onClear={() => { setQ(""); setStatus(""); }}
      />

      {loading ? (
        <Card className="p-6">
          <div className="grid gap-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-0 overflow-hidden">
          <EmptyState
            icon={ClipboardList}
            title="No enrollments yet"
            message="Enrollments connect a client to one or more fixed service contracts."
            actionLabel="New enrollment"
            onAction={() => setCreateOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((item) => {
            const customerName =
              item?.customerId?.companyName ||
              item?.customerId?.contactName ||
              "Unknown client";

            const resolvedProject = item?.projectId || null;
            const projectName = resolvedProject?.name || "No linked project";
            const projectRouteId = resolvedProject?._id || null;
            const serviceName =
              item?.serviceTemplateId?.name || "Unknown service";

            const mode =
              item?.serviceTemplateId?.executionMode ||
              item?.finalScope?.mode ||
              "—";

            return (
              <div
                key={item._id}
                role="button"
                tabIndex={0}
                onClick={() => nav(`/portal/enrollments/${item._id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    nav(`/portal/enrollments/${item._id}`);
                  }
                }}
                className="group overflow-hidden rounded-[28px] border border-black/[0.07] bg-white p-0 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)]"
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <MetaPill>{item.status || "—"}</MetaPill>
                    <MetaPill>{executionModeLabel(mode)}</MetaPill>
                    {projectRouteId ? (
                      <MetaPill>Linked project</MetaPill>
                    ) : null}
                  </div>

                  <div className="mt-4 text-lg font-black text-slate-900">
                    {serviceName}
                  </div>

                  <div className="mt-3 grid gap-3 rounded-[20px] border border-black/5 bg-white/70 p-4">
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <Building2 size={16} className="text-slate-400" />
                      {customerName}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <FolderKanban size={16} className="text-slate-400" />
                      {projectName}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <BriefcaseBusiness size={16} className="text-slate-400" />
                      {scopeSummary(item)}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      View enrollment
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEnrollment(item);
                          setEditOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <ChevronRight
                        size={18}
                        className="text-slate-400 transition group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateEnrollmentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreate}
        busy={busy}
      />

      <EditEnrollmentModal
        open={editOpen}
        enrollment={selectedEnrollment}
        busy={busy}
        onClose={() => {
          setEditOpen(false);
          setSelectedEnrollment(null);
        }}
        onSubmit={onEdit}
      />
    </div>
  );
}
