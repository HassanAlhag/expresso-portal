import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../shared/ui/Card";
import { useToast } from "../../../shared/ui/Toast";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";

import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { getProject, listProjects, archiveProject } from "../api";
import { PROJECT_TABS } from "../constants";

import { listJobs, createJob } from "../../jobs/api";
import NewJobModal from "../../jobs/components/NewJobModal";

import ProjectHeader from "../components/ProjectHeader";
import ProjectOverviewTab from "../tabs/ProjectOverviewTab";
import ProjectJobsTab from "../tabs/ProjectJobsTab";
import ProjectFilesTab from "../tabs/ProjectFilesTab";
import ProjectBillingTab from "../tabs/ProjectBillingTab";
import ProjectActivityTab from "../tabs/ProjectActivityTab";

import { Layers3 } from "lucide-react";

export default function ProjectDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [tab, setTab] = useState(PROJECT_TABS.OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmState, setConfirmState] = useState(null);

  const [project, setProject] = useState(null);

  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [jobs, setJobs] = useState([]);
  const [jobQ, setJobQ] = useState("");
  const [newJobOpen, setNewJobOpen] = useState(false);

  const loadProject = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getProject(id);
      setProject(res?.item || null);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load project"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    if (!project?._id) return;

    const resolvedCustomerId =
      project?.customerId?._id || project?.customerId || "";

    setJobsLoading(true);
    setJobsError("");

    try {
      const params = {
        q: jobQ,
        projectId: project._id,
        limit: 30,
        page: 1,
      };

      if (resolvedCustomerId) {
        params.customerId = resolvedCustomerId;
      }

      const res = await listJobs(params);
      setJobs(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setJobsError(
        e?.response?.data?.message || e?.message || "Failed to load jobs"
      );
    } finally {
      setJobsLoading(false);
    }
  };

  const handleArchive = () => {
    setConfirmState({
      title: "Delete project",
      message: `Delete "${project?.name}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        setConfirmState(null);
        try {
          await archiveProject(id);
          nav("/portal/projects");
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
          setBusy(false);
        }
      },
    });
  };

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!project?._id) return;
    if (tab === PROJECT_TABS.JOBS) loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, project?._id]);

  const title = useMemo(() => project?.name || "Project", [project]);
  const customer = project?.customerId || null;
  const canCreateJob = Boolean(customer?._id && project?._id);

  const listCustomersForModal = async () => ({
    items: customer ? [customer] : [],
  });

  const listProjectsForModal = async ({ q = "", customerId = "" } = {}) => {
    const targetCustomerId = customerId || customer?._id;

    const res = await listProjects({
      q,
      customerId: targetCustomerId,
      limit: 20,
      page: 1,
      sort: "-createdAt",
    });

    return { items: res?.items || [] };
  };

  const createJobForModal = async (payload) => {
    return createJob({
      ...payload,
      customerId: customer?._id,
      projectId: project?._id,
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-6 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">
        {error}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm font-extrabold text-slate-700">
        Project not found.
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />

      <div className="grid gap-5">
        <ProjectHeader
          project={project}
          customer={customer}
          title={title}
          tab={tab}
          setTab={setTab}
          busy={busy}
          onBack={() => nav("/portal/projects")}
          onRefresh={() => {
            loadProject();
            if (tab === PROJECT_TABS.JOBS) loadJobs();
          }}
          onCreateJob={() => {
            if (!canCreateJob) {
              toast.warning(
                "This project does not have a linked client yet. Link a client before creating jobs."
              );
              return;
            }
            setNewJobOpen(true);
          }}
          onArchive={handleArchive}
        />

        {tab === PROJECT_TABS.OVERVIEW ? (
          <ProjectOverviewTab project={project} customer={customer} />
        ) : null}

        {tab === PROJECT_TABS.SCOPE ? (
          <Card className="p-0 overflow-hidden">
            <EmptyState
              icon={Layers3}
              title="Project scope is not fully structured yet"
              message={
                project?.projectMode === "contracted"
                  ? "This contracted project can later connect to enrollment scope or a dedicated project scope module."
                  : "This project is being used as a flexible work container. Next step is to build a dedicated project scope module, separate from enrollments."
              }
              actionLabel={canCreateJob ? "Create Job" : undefined}
              onAction={canCreateJob ? () => setNewJobOpen(true) : undefined}
            />
          </Card>
        ) : null}

        {tab === PROJECT_TABS.JOBS ? (
          <ProjectJobsTab
            loading={jobsLoading}
            error={jobsError}
            items={jobs}
            q={jobQ}
            setQ={setJobQ}
            busy={busy}
            onApply={loadJobs}
            onCreate={() => {
              if (!canCreateJob) {
                toast.warning("This project does not have a linked client yet. Link a client before creating jobs.");
                return;
              }
              setNewJobOpen(true);
            }}
            onOpenJob={(job) => nav(`/portal/jobs/${job._id}`)}
          />
        ) : null}

        {tab === PROJECT_TABS.FILES ? (
          <ProjectFilesTab project={project} />
        ) : null}

        {tab === PROJECT_TABS.BILLING ? <ProjectBillingTab projectId={project._id} customerId={customer?._id} /> : null}
        {tab === PROJECT_TABS.ACTIVITY ? <ProjectActivityTab /> : null}
      </div>

      <NewJobModal
        open={newJobOpen}
        onClose={() => setNewJobOpen(false)}
        listCustomers={listCustomersForModal}
        listProjects={listProjectsForModal}
        createJob={createJobForModal}
        initialCustomer={customer}
        initialProject={project}
        initialEnrollment={null}
        lockCustomer={true}
        lockProject={true}
      />
    </>
  );
}
