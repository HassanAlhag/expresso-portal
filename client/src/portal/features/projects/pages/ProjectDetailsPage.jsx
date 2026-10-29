import AgreementPanel from "../../../shared/operating/AgreementPanel";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, Archive, Building2, ClipboardList, FileText, Layers, Wallet } from "lucide-react";

import { useToast } from "../../../shared/ui/Toast";
import { usePageCrumbs } from "../../../layouts/ShellContext";
import { useAccess } from "../../../shared/hooks/useAccess";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import Alert from "../../../shared/ui/Alert";
import Button from "../../../shared/ui/Button";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import TabBar, { TabPanel } from "../../../shared/ui/TabBar";

import { getProject, listProjects, archiveProject, updateProject } from "../api";
import { PROJECT_TABS } from "../constants";
import { customerOf } from "../format";
import { listJobs, createJob } from "../../jobs/api";
import NewJobModal from "../../jobs/components/NewJobModal";

import ProjectHeader from "../components/ProjectHeader";
import ProjectFormModal from "../components/ProjectFormModal";
import ProjectOverviewTab from "../tabs/ProjectOverviewTab";
import ProjectScopeTab from "../tabs/ProjectScopeTab";
import ProjectJobsTab from "../tabs/ProjectJobsTab";
import ProjectFilesTab from "../tabs/ProjectFilesTab";
import ProjectBillingTab from "../tabs/ProjectBillingTab";
import ProjectActivityTab from "../tabs/ProjectActivityTab";

function addDays(value, days) {
  const base = value ? new Date(value) : new Date();
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + Number(days || 0));
  return base.toISOString().slice(0, 10);
}

const NO_CLIENT = "Link a client to this project before creating jobs.";

/** Tabs the signed-in user can use, in order. Overview is always there. */
export function projectTabsFor(access) {
  return [
    { id: PROJECT_TABS.OVERVIEW, label: "Overview", icon: Building2 },
    access.can("jobs.read") && { id: PROJECT_TABS.JOBS, label: "Jobs", icon: ClipboardList },
    access.can("jobs.read") && { id: PROJECT_TABS.SCOPE, label: "Scope", icon: Layers },
    access.can("files.read") && { id: PROJECT_TABS.FILES, label: "Files", icon: FileText },
    access.can("billing.read") && { id: PROJECT_TABS.BILLING, label: "Billing", icon: Wallet },
    access.can("jobs.read") && { id: PROJECT_TABS.ACTIVITY, label: "Activity", icon: Activity },
  ].filter(Boolean);
}

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function ProjectDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const access = useAccess();

  const canEdit = access.can("projects.write");
  const canArchive = access.can("projects.delete");
  const canReadJobs = access.can("jobs.read");
  const canCreateJobs = access.can("jobs.write");
  const tabs = useMemo(() => projectTabsFor(access), [access]);

  const [tab, setTab] = useState(PROJECT_TABS.OVERVIEW);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [jobQ, setJobQ] = useState("");
  const debouncedJobQ = useDebounced(jobQ);

  const [newJobOpen, setNewJobOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [planGenerating, setPlanGenerating] = useState(false);

  usePageCrumbs(project ? [{ label: "Projects", to: "/portal/projects" }, { label: project.name || "Project" }] : []);

  const loadProject = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getProject(id);
      setProject(res?.item || null);
      if (!res?.item) setLoadError({ status: 404 });
    } catch (e) {
      setLoadError({ status: e?.response?.status, message: e?.response?.data?.message });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const customer = customerOf(project);
  const customerId = customer?._id || "";

  const loadJobs = useCallback(async () => {
    if (!project?._id || !canReadJobs) return;
    setJobsLoading(true);
    setJobsError("");
    try {
      const params = { q: debouncedJobQ.trim(), projectId: project._id, limit: 30, page: 1 };
      if (customerId) params.customerId = customerId;
      const res = await listJobs(params);
      setJobs(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setJobsError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setJobsLoading(false);
    }
  }, [project?._id, customerId, debouncedJobQ, canReadJobs]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Keep the selected tab valid for this user.
  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab(PROJECT_TABS.OVERVIEW);
  }, [tabs, tab]);

  const createBlockedReason = customerId ? "" : NO_CLIENT;
  const openNewJob = () => {
    if (!customerId) {
      toast.warning(NO_CLIENT);
      return;
    }
    setNewJobOpen(true);
  };

  const handleEdit = async (payload) => {
    setBusy(true);
    try {
      await updateProject(id, payload);
      toast.success("Project updated.");
      setEditOpen(false);
      await loadProject();
    } catch (e) {
      toast.error(e?.response?.data?.message || "The changes weren't saved. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmArchive = async () => {
    try {
      await archiveProject(id);
      toast.success("Project archived. Its jobs, invoices, files and history are kept.");
      setArchiveOpen(false);
      nav("/portal/projects");
    } catch (e) {
      toast.error(e?.response?.data?.message || "The project wasn't archived. Try again.");
    }
  };

  const handleGeneratePlanJobs = async (planJobs = []) => {
    if (!customerId) {
      toast.warning(NO_CLIENT);
      return;
    }
    if (!planJobs.length) return;
    setPlanGenerating(true);
    setBusy(true);
    try {
      for (const job of planJobs) {
        await createJob({
          customerId,
          projectId: project._id,
          title: job.title,
          type: job.type || "other",
          status: "brief",
          priority: project.priority === "urgent" ? "high" : "normal",
          dueDate: addDays(project.startDate || project.createdAt, job.dueDays),
          notes: job.notes || "",
        });
      }
      toast.success(`${planJobs.length} job${planJobs.length === 1 ? "" : "s"} created.`);
      await loadJobs();
      setTab(PROJECT_TABS.JOBS);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Some jobs weren't created. Check the Jobs tab and try again.");
      await loadJobs();
    } finally {
      setPlanGenerating(false);
      setBusy(false);
    }
  };

  const listCustomersForModal = async () => ({ items: customer ? [customer] : [] });
  const listProjectsForModal = async ({ q = "", customerId: cid = "" } = {}) => {
    const res = await listProjects({ q, customerId: cid || customerId, limit: 20, page: 1, sort: "-createdAt" });
    return { items: res?.items || [] };
  };
  const createJobForModal = async (payload) => createJob({ ...payload, customerId, projectId: project?._id });

  if (loading && !project) return <LoadingState rows={6} label="Loading project" />;

  if (loadError || !project) {
    const status = loadError?.status;
    return (
      <ErrorState
        title={status === 404 ? "Project not found" : status === 403 ? "You don't have access to this project" : "This project didn't load"}
        message={
          status === 404
            ? "It may have been removed, or the link is wrong."
            : status === 403
            ? "Ask an administrator if you need it."
            : loadError?.message || undefined
        }
        onRetry={status === 404 || status === 403 ? undefined : loadProject}
      />
    );
  }

  const archived = project.status === "archived";
  const counts = { [PROJECT_TABS.JOBS]: canReadJobs && !jobsLoading && !debouncedJobQ ? jobs.length : undefined };

  return (
    <>
      <div className="px-stack" style={{ gap: 20 }}>
        <ProjectHeader
          project={project}
          busy={busy}
          canOpenClient={access.canOpen("/portal/customers")}
          onEdit={canEdit ? () => setEditOpen(true) : undefined}
          onCreateJob={canCreateJobs ? openNewJob : undefined}
          createJobBlockedReason={createBlockedReason}
          onRefresh={() => {
            loadProject();
            loadJobs();
          }}
          onArchive={canArchive ? () => setArchiveOpen(true) : undefined}
        />

        {access.isInternal && canReadJobs && <AgreementPanel kind="project" owner={project} onChanged={loadProject} />}

        {archived ? (
          <Alert
            tone="info"
            icon={Archive}
            title="This project is archived"
            action={
              canEdit ? (
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                  Change status
                </Button>
              ) : null
            }
          >
            It's hidden from the default project list. Its jobs, invoices, files and history are kept.
            {canEdit ? " To bring it back, change its status." : ""}
          </Alert>
        ) : null}

        <div>
          <TabBar
            idPrefix="project"
            label="Project sections"
            value={tab}
            onChange={setTab}
            tabs={tabs.map((t) => ({ ...t, count: counts[t.id] }))}
          />
          <TabPanel idPrefix="project" id={tab} className="px-tabpanel--spaced">
            {tab === PROJECT_TABS.OVERVIEW ? (
              <ProjectOverviewTab
                project={project}
                jobs={jobs}
                jobsLoading={jobsLoading}
                showJobs={canReadJobs}
                onShowJobs={() => setTab(PROJECT_TABS.JOBS)}
                canOpenClient={access.canOpen("/portal/customers")}
                isInternal={access.isInternal}
              />
            ) : null}
            {tab === PROJECT_TABS.JOBS ? (
              <ProjectJobsTab
                loading={jobsLoading}
                error={jobsError}
                items={jobs}
                q={jobQ}
                setQ={setJobQ}
                onRetry={loadJobs}
                busy={busy}
                onCreate={canCreateJobs ? openNewJob : undefined}
                createBlockedReason={createBlockedReason}
              />
            ) : null}
            {tab === PROJECT_TABS.SCOPE ? (
              <ProjectScopeTab
                  managed={project.operatingModelVersion === 1}
                project={project}
                customer={customer}
                jobs={jobs}
                loading={jobsLoading}
                error={jobsError}
                onRetry={loadJobs}
                busy={busy}
                generating={planGenerating}
                canCreateJobs={canCreateJobs && project.operatingModelVersion !== 1}
                onCreateJob={openNewJob}
                createBlockedReason={createBlockedReason}
                onGeneratePlanJobs={handleGeneratePlanJobs}
              />
            ) : null}
            {tab === PROJECT_TABS.FILES ? <ProjectFilesTab project={project} canUpload={access.can("files.write")} /> : null}
            {tab === PROJECT_TABS.BILLING ? (
              <ProjectBillingTab projectId={project._id} canOpenBilling={access.canOpen("/portal/billing")} />
            ) : null}
            {tab === PROJECT_TABS.ACTIVITY ? <ProjectActivityTab projectId={project._id} /> : null}
          </TabPanel>
        </div>
      </div>

      <ConfirmDialog
        open={archiveOpen}
        title="Archive this project?"
        icon={Archive}
        confirmLabel="Archive project"
        onConfirm={confirmArchive}
        onClose={() => setArchiveOpen(false)}
        details={[
          "Its jobs, invoices, files and history are kept. Nothing is deleted.",
          "It leaves the default project list. Choose the Archived status filter to find it.",
          "Someone who can edit projects can bring it back by changing its status.",
        ]}
      >
        {`"${project.name || "This project"}" will be archived.`}
      </ConfirmDialog>

      {canCreateJobs ? (
        <NewJobModal
          open={newJobOpen}
          onClose={() => setNewJobOpen(false)}
          listCustomers={listCustomersForModal}
          listProjects={listProjectsForModal}
          createJob={async (payload) => {
            const res = await createJobForModal(payload);
            loadJobs();
            return res;
          }}
          initialCustomer={customer}
          initialProject={project}
          initialEnrollment={null}
          lockCustomer={true}
          lockProject={true}
        />
      ) : null}

      {canEdit ? (
        <ProjectFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEdit}
          busy={busy}
          initialCustomer={customer}
          initialProject={project}
        />
      ) : null}
    </>
  );
}
