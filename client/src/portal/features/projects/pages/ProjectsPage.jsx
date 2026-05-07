import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/ui/Toast";
import Button from "../../../shared/ui/Button";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";

import {
  FolderKanban,
  Flag,
  RefreshCw,
  Users,
  FileClock,
  Plus,
} from "lucide-react";

import { listProjects, createProject } from "../api";
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_SORT_OPTIONS,
} from "../constants";
import ProjectList from "../components/ProjectList";
import ProjectFormModal from "../components/ProjectFormModal";

const PROJECT_MODE_OPTIONS = [
  { value: "", label: "All modes" },
  { value: "pre_contract", label: "Pre-contract" },
  { value: "contracted", label: "Contracted" },
  { value: "custom", label: "Custom" },
  { value: "internal", label: "Internal" },
];

export default function ProjectsPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("");
  const [projectMode, setProjectMode] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const limit = 12;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await listProjects({
        q,
        status,
        type,
        priority,
        projectMode,
        source,
        sort,
        page,
        limit,
      });

      setItems(res?.items || []);
      setMeta({
        page: res?.page || page,
        pages: res?.pages || 1,
        total: res?.total ?? 0,
      });
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [q, status, type, priority, projectMode, source, sort, page]);

  const statsData = useMemo(() => ({
    total: meta.total,
    active: items.filter((x) => x.status === "active").length,
    urgent: items.filter((x) => x.priority === "urgent").length,
    completed: items.filter((x) => x.status === "completed").length,
    preContract: items.filter((x) => x.projectMode === "pre_contract").length,
  }), [items, meta.total]);

  const onCreate = async (payload) => {
    setBusy(true);
    try {
      const res = await createProject(payload);
      setCreateOpen(false);
      setPage(1);
      await load();

      const id = res?.item?._id || res?._id;
      if (id) nav(`/portal/projects/${id}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const resetFilters = () => {
    setQ(""); setStatus(""); setType(""); setPriority("");
    setProjectMode(""); setSource(""); setSort("-createdAt"); setPage(1);
  };

  return (
    <>
      <div className="grid gap-4">
        <PageHeader
          eyebrow="MAIN"
          title="Projects"
          subtitle="Client work, custom requests, pre-contract, and internal initiatives."
          breadcrumb={[
            { label: "Portal", to: "/portal" },
            { label: "Projects" },
          ]}
          right={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={load} disabled={loading || busy}>
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
              <Button onClick={() => setCreateOpen(true)} disabled={busy}>
                <Plus size={14} />
                New project
              </Button>
            </div>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={FolderKanban} label="Total"       value={statsData.total}       color="indigo"  />
          <StatCard icon={Users}        label="Active"      value={statsData.active}      color="emerald" />
          <StatCard icon={Flag}         label="Urgent"      value={statsData.urgent}      color="rose"    />
          <StatCard icon={FileClock}    label="Pre-contract" value={statsData.preContract} color="amber"   />
          <StatCard icon={FolderKanban} label="Completed"   value={statsData.completed}   color="slate"   />
        </div>

        <FilterBar
          searchValue={q}
          onSearchChange={(v) => { setQ(v); setPage(1); }}
          searchPlaceholder="Search projects…"
          filters={[
            { label: "status",   value: status,      onChange: (v) => { setStatus(v);      setPage(1); }, options: PROJECT_STATUS_OPTIONS   },
            { label: "type",     value: type,        onChange: (v) => { setType(v);        setPage(1); }, options: PROJECT_TYPE_OPTIONS     },
            { label: "priority", value: priority,    onChange: (v) => { setPriority(v);    setPage(1); }, options: PROJECT_PRIORITY_OPTIONS  },
            { label: "mode",     value: projectMode, onChange: (v) => { setProjectMode(v); setPage(1); }, options: PROJECT_MODE_OPTIONS      },
            { label: "sort",     value: sort,        onChange: (v) => { setSort(v);        setPage(1); }, options: PROJECT_SORT_OPTIONS      },
          ]}
          onClear={resetFilters}
        />

        <ProjectList
          items={items}
          meta={meta}
          loading={loading}
          error={error}
          onCreate={() => setCreateOpen(true)}
          onOpen={(project) => nav(`/portal/projects/${project._id}`)}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(meta.pages, p + 1))}
        />
      </div>

      <ProjectFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreate}
        busy={busy}
      />
    </>
  );
}

