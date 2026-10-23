import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Activity,
  Building2,
  ClipboardList,
  Film,
  FolderKanban,
  KeyRound,
  Layers3,
  Mail,
  Package,
  Pencil,
  Phone,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { usePageCrumbs } from "../../../layouts/ShellContext";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import RowActions from "../../../shared/ui/RowActions";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import Alert from "../../../shared/ui/Alert";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import TabBar, { TabPanel } from "../../../shared/ui/TabBar";

import { getCustomerById, createCustomerLogin, updateCustomer, deleteCustomer } from "../api";
import { listEnrollments, createEnrollment, generateJobsFromEnrollment } from "../../enrollments/api";
import CreateEnrollmentModal from "../../enrollments/components/CreateEnrollmentModal";
import { listProjects, createProject } from "../../projects/api";
import { listJobs, createJob } from "../../jobs/api";
import NewJobModal from "../../jobs/components/NewJobModal";
import ProjectFormModal from "../../projects/components/ProjectFormModal";
import { DEPARTMENT_LABEL, clientInitials, departmentOf, hasAgency, hasProcurement, logoSrc } from "../format";

import CustomerFormModal from "../components/CustomerFormModal";
import CreateLoginModal from "../components/CreateLoginModal";
import CustomerOverviewTab from "../tabs/CustomerOverviewTab";
import CustomerEnrollmentsTab from "../tabs/CustomerEnrollmentsTab";
import CustomerProjectsTab from "../tabs/CustomerProjectsTab";
import CustomerJobsTab from "../tabs/CustomerJobsTab";
import CustomerProductionsTab from "../tabs/CustomerProductionsTab";
import CustomerUsersTab from "../tabs/CustomerUsersTab";
import CustomerActivityTab from "../tabs/CustomerActivityTab";
import CustomerProcurementTab from "../tabs/CustomerProcurementTab";

/** Tabs the viewer can use for this client, in order. */
export function clientTabsFor(access, customer) {
  const agency = hasAgency(customer);
  return [
    { id: "overview", label: "Overview", icon: Building2 },
    agency && access.can("projects.read") && { id: "projects", label: "Projects", icon: FolderKanban },
    agency && access.can("enrollments.read") && { id: "enrollments", label: "Enrollments", icon: Layers3 },
    agency && access.can("jobs.read") && { id: "jobs", label: "Jobs", icon: ClipboardList },
    agency && access.can("jobs.read") && { id: "productions", label: "Productions", icon: Film },
    hasProcurement(customer) && access.can("procurement.read") && { id: "procurement", label: "Procurement", icon: Package },
    { id: "users", label: "Users", icon: Users },
    access.can("jobs.read") && { id: "activity", label: "Activity", icon: Activity },
  ].filter(Boolean);
}

// Client detail (PUI-3). Header, overview, projects, users and activity use the
// production design system. Enrollments, jobs, productions and procurement tabs
// keep their existing content (their modules migrate later).
export default function CustomerDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const access = useAccess();

  const canWrite = access.can("customers.write");
  const canDelete = access.can("customers.delete");

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);

  const tab = searchParams.get("tab") || "overview";
  const selectedEnrollmentId = searchParams.get("enrollment") || "";

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [jobQ, setJobQ] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState("");
  const [convertingEnrollmentId, setConvertingEnrollmentId] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [newEnrollOpen, setNewEnrollOpen] = useState(false);
  const [enrollBusy, setEnrollBusy] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  usePageCrumbs(customer ? [{ label: "Clients", to: "/portal/customers" }, { label: customer.companyName || "Client" }] : []);

  const setActiveTab = (next, extra = {}) => {
    const p = new URLSearchParams(searchParams);
    p.set("tab", next);
    if (extra.enrollment) p.set("enrollment", extra.enrollment);
    else p.delete("enrollment");
    setSearchParams(p);
  };

  const loadCustomer = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getCustomerById(id);
      setCustomer(res?.item || null);
      if (!res?.item) setLoadError({ status: 404 });
    } catch (e) {
      setLoadError({ status: e?.response?.status, message: e?.response?.data?.message });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const cid = customer?._id;

  const loadJobs = useCallback(async () => {
    if (!cid) return;
    setJobsLoading(true);
    setJobsError("");
    try {
      const res = await listJobs({ q: jobQ, customerId: cid, notWorkflowType: "video", limit: 50, page: 1 });
      const items = Array.isArray(res?.items) ? res.items : [];
      setJobs(items.filter((j) => String(j?.customerId?._id || j?.customerId) === String(cid)));
    } catch (e) {
      setJobsError(e?.response?.data?.message || "Jobs didn't load.");
    } finally {
      setJobsLoading(false);
    }
  }, [cid, jobQ]);

  const loadEnrollments = useCallback(async () => {
    if (!cid) return;
    setEnrollmentsLoading(true);
    setEnrollmentsError("");
    try {
      const res = await listEnrollments({ customerId: cid, limit: 100, page: 1, sort: "-createdAt" });
      setEnrollments(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setEnrollmentsError(e?.response?.data?.message || "Enrollments didn't load.");
    } finally {
      setEnrollmentsLoading(false);
    }
  }, [cid]);

  const loadProjects = useCallback(async () => {
    if (!cid) return;
    setProjectsLoading(true);
    setProjectsError("");
    try {
      const res = await listProjects({ customerId: cid, limit: 100, page: 1, sort: "-createdAt" });
      setProjects(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setProjectsError(e?.response?.data?.message || "Projects didn't load.");
    } finally {
      setProjectsLoading(false);
    }
  }, [cid]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const tabs = useMemo(() => (customer ? clientTabsFor(access, customer) : []), [access, customer]);
  const activeTab = tabs.some((t) => t.id === tab) ? tab : "overview";

  useEffect(() => {
    if (!cid) return;
    if (activeTab === "jobs") loadJobs();
    if (activeTab === "enrollments") loadEnrollments();
    if (activeTab === "projects") loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, cid]);

  const run = async (fn, ok, after) => {
    setBusy(true);
    try {
      const res = await fn();
      if (ok) toast.success(ok);
      await after?.(res);
    } catch (e) {
      toast.error(e?.response?.data?.message || "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleConvertEnrollmentToJobs = async (enrollmentId) => {
    if (!enrollmentId) return;
    setConvertingEnrollmentId(enrollmentId);
    try {
      const res = await generateJobsFromEnrollment(enrollmentId);
      const count = res?.count || res?.items?.length || res?.jobs?.length || res?.created || 0;
      toast.success(`${count} job${count === 1 ? "" : "s"} created from the enrollment.`);
      await loadEnrollments();
      await loadJobs();
      setActiveTab("jobs");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Jobs weren't created. Try again.");
    } finally {
      setConvertingEnrollmentId("");
    }
  };

  const handleCreateEnrollment = async (payload) => {
    setEnrollBusy(true);
    try {
      const res = await createEnrollment({ ...payload, customerId: cid });
      setNewEnrollOpen(false);
      toast.success("Enrollment created.");
      const enrollmentId = res?.item?._id || res?._id;
      if (enrollmentId) nav(`/portal/enrollments/${enrollmentId}`);
      else await loadEnrollments();
    } catch (e) {
      toast.error(e?.response?.data?.message || "The enrollment wasn't created. Try again.");
    } finally {
      setEnrollBusy(false);
    }
  };

  if (loading && !customer) return <LoadingState rows={6} label="Loading client" />;
  if (loadError || !customer) {
    const status = loadError?.status;
    return (
      <ErrorState
        title={status === 404 ? "Client not found" : status === 403 ? "You don't have access to this client" : "This client didn't load"}
        message={status === 404 ? "It may have been removed, or the link is wrong." : status === 403 ? "Ask an administrator if you need it." : loadError?.message || undefined}
        onRetry={status === 404 || status === 403 ? undefined : loadCustomer}
      />
    );
  }

  const agency = hasAgency(customer);
  const src = logoSrc(customer);
  const canProject = agency && access.can("projects.write");
  const canEnroll = agency && access.can("enrollments.write");
  const canJob = agency && access.can("jobs.write");

  const more = [
    { key: "refresh", label: "Refresh", icon: RefreshCw, onSelect: () => loadCustomer() },
    canEnroll ? { key: "enroll", label: "New enrollment", icon: Layers3, onSelect: () => setNewEnrollOpen(true) } : null,
    canJob ? { key: "job", label: "Create job", icon: Plus, onSelect: () => setNewJobOpen(true) } : null,
    canWrite && !customer.ownerUserId ? { key: "login", label: "Create main login", icon: KeyRound, onSelect: () => setLoginOpen(true) } : null,
    canWrite || canDelete ? { key: "sep", separator: true } : null,
    canWrite ? { key: "toggle", label: customer.isActive ? "Deactivate client" : "Reactivate client", icon: Power, onSelect: () => setToggleOpen(true) } : null,
    canDelete ? { key: "delete", label: "Delete permanently", icon: Trash2, tone: "muted", onSelect: () => setDeleteOpen(true) } : null,
  ];

  return (
    <>
      <div className="px-stack" style={{ gap: 20 }}>
        <header className="px-record-head">
          <div className="px-record-id">
            <div className="px-record-tags">
              <Badge tone={customer.isActive ? "ok" : "neutral"} dot={Boolean(customer.isActive)}>
                {customer.isActive ? "Active" : "Inactive"}
              </Badge>
              <span className="px-code">{DEPARTMENT_LABEL[departmentOf(customer)]}</span>
              {customer.code ? <span className="px-code">{customer.code}</span> : null}
            </div>
            <div className="px-cell-with-logo" style={{ marginTop: 8 }}>
              <span className="px-logo px-logo--lg" aria-hidden="true">
                {src ? <img src={src} alt="" /> : clientInitials(customer.companyName)}
              </span>
              <h1 style={{ margin: 0 }}>{customer.companyName || "Client"}</h1>
            </div>
            <ul className="px-record-meta" aria-label="Client contact">
              <li>
                <UserRound size={15} aria-hidden="true" />
                {customer.contactName || "No contact"}
              </li>
              {customer.primaryEmail ? (
                <li>
                  <Mail size={15} aria-hidden="true" />
                  <a href={`mailto:${customer.primaryEmail}`}>{customer.primaryEmail}</a>
                </li>
              ) : null}
              {customer.phone ? (
                <li>
                  <Phone size={15} aria-hidden="true" />
                  {customer.phone}
                </li>
              ) : null}
            </ul>
          </div>
          <div className="px-record-actions">
            {canWrite ? (
              <Button variant="outline" onClick={() => setEditOpen(true)} disabled={busy}>
                <Pencil size={15} aria-hidden="true" />
                Edit
              </Button>
            ) : null}
            {canProject ? (
              <Button onClick={() => setNewProjectOpen(true)} disabled={busy}>
                <Plus size={15} aria-hidden="true" />
                New project
              </Button>
            ) : null}
            <RowActions label={customer.companyName || "client"} actions={more} />
          </div>
        </header>

        {!customer.isActive && access.isInternal ? (
          <Alert tone="info" icon={Power} title="This client is inactive">
            Its history is kept. {canWrite ? "Reactivate it from the More actions menu." : ""}
          </Alert>
        ) : null}

        <div>
          <TabBar idPrefix="client" label="Client sections" value={activeTab} onChange={(t) => setActiveTab(t)} tabs={tabs} />
          <TabPanel idPrefix="client" id={activeTab} className="px-tabpanel--spaced">
            {activeTab === "overview" ? (
              <CustomerOverviewTab
                customer={customer}
                isInternal={access.isInternal}
                canReadCrm={access.can("crm.read")}
                onCreateLogin={canWrite ? () => setLoginOpen(true) : undefined}
              />
            ) : null}
            {activeTab === "projects" ? (
              <CustomerProjectsTab
                projectsLoading={projectsLoading}
                projectsError={projectsError}
                projects={projects}
                onRetry={loadProjects}
                onNewProject={canProject ? () => setNewProjectOpen(true) : undefined}
              />
            ) : null}
            {activeTab === "enrollments" ? (
              <CustomerEnrollmentsTab
                enrollmentsLoading={enrollmentsLoading}
                enrollmentsError={enrollmentsError}
                enrollments={enrollments}
                selectedEnrollmentId={selectedEnrollmentId}
                busy={busy}
                convertingEnrollmentId={convertingEnrollmentId}
                onNewEnrollment={canEnroll ? () => setNewEnrollOpen(true) : undefined}
                onOpenJobs={(item) => {
                  setActiveTab("jobs", { enrollment: item?._id });
                  loadJobs();
                }}
                onConvert={canJob ? handleConvertEnrollmentToJobs : undefined}
              />
            ) : null}
            {activeTab === "jobs" ? (
              <CustomerJobsTab
                jobQ={jobQ}
                setJobQ={setJobQ}
                jobsLoading={jobsLoading}
                jobsError={jobsError}
                jobs={jobs}
                busy={busy}
                onLoadJobs={loadJobs}
                onOpenNewJob={canJob ? () => setNewJobOpen(true) : undefined}
                onOpenJob={(jobId) => nav(`/portal/jobs/${jobId}`, { state: { returnTo: `/portal/customers/${cid}` } })}
              />
            ) : null}
            {activeTab === "productions" ? <CustomerProductionsTab customerId={cid} /> : null}
            {activeTab === "procurement" ? <CustomerProcurementTab customer={customer} /> : null}
            {activeTab === "users" ? (
              <CustomerUsersTab customer={customer} canAdd={canWrite} canRemove={access.can("iam.users.delete")} />
            ) : null}
            {activeTab === "activity" ? <CustomerActivityTab customerId={cid} /> : null}
          </TabPanel>
        </div>
      </div>

      {canWrite ? (
        <>
          <CustomerFormModal
            open={editOpen}
            mode="edit"
            initial={customer}
            busy={busy}
            onClose={() => setEditOpen(false)}
            onSubmit={(payload) => run(() => updateCustomer(cid, payload), "Client updated.", async () => {
              setEditOpen(false);
              await loadCustomer();
            })}
          />
          <CreateLoginModal
            open={loginOpen}
            customer={customer}
            busy={busy}
            onClose={() => setLoginOpen(false)}
            onSubmit={(payload) => run(() => createCustomerLogin(cid, payload), "Login created and linked to the client.", async () => {
              setLoginOpen(false);
              await loadCustomer();
            })}
          />
          <ConfirmDialog
            open={toggleOpen}
            icon={Power}
            tone={customer.isActive ? "warn" : "info"}
            title={customer.isActive ? "Deactivate this client?" : "Reactivate this client?"}
            confirmLabel={customer.isActive ? "Deactivate client" : "Reactivate client"}
            onClose={() => setToggleOpen(false)}
            onConfirm={async () => {
              try {
                await updateCustomer(cid, { isActive: !customer.isActive });
                toast.success(customer.isActive ? "Client deactivated." : "Client reactivated.");
                setToggleOpen(false);
                await loadCustomer();
              } catch (e) {
                toast.error(e?.response?.data?.message || "The status didn't change. Try again.");
              }
            }}
            details={
              customer.isActive
                ? ["The client is marked inactive. Nothing is deleted.", "Projects, services, invoices and files stay as they are.", "Its portal users can still sign in. To stop that, deactivate their accounts in Users and roles, or remove them from the Users tab.", "You can reactivate the client at any time."]
                : ["The client is marked active again."]
            }
          >
            {`"${customer.companyName}"`}
          </ConfirmDialog>
        </>
      ) : null}

      {canDelete ? (
        <ConfirmDialog
          open={deleteOpen}
          icon={Trash2}
          tone="bad"
          danger
          title="Delete this client permanently?"
          confirmLabel="Delete permanently"
          onClose={() => setDeleteOpen(false)}
          onConfirm={async () => {
            try {
              await deleteCustomer(cid);
              toast.success("Client deleted.");
              setDeleteOpen(false);
              nav("/portal/customers");
            } catch (e) {
              toast.error(e?.response?.data?.message || "The client wasn't deleted. Try again.");
            }
          }}
          details={[
            "The client record is erased and can't be restored.",
            "Its projects, invoices, jobs, files and portal users are not deleted. They will refer to a client that no longer exists.",
            "To keep the history, deactivate the client instead.",
          ]}
        >
          {`"${customer.companyName}"`}
        </ConfirmDialog>
      ) : null}

      {canProject ? (
        <ProjectFormModal
          open={newProjectOpen}
          onClose={() => setNewProjectOpen(false)}
          busy={busy}
          initialCustomer={customer}
          onSubmit={(payload) =>
            run(() => createProject({ ...payload, customerId: cid }), "Project created.", async (res) => {
              setNewProjectOpen(false);
              const projectId = res?.item?._id || res?._id;
              if (projectId) nav(`/portal/projects/${projectId}`);
              else await loadProjects();
            })
          }
        />
      ) : null}

      {canJob ? (
        <NewJobModal
          open={newJobOpen}
          onClose={() => {
            setNewJobOpen(false);
            if (activeTab === "jobs") loadJobs();
          }}
          listCustomers={async () => ({ items: [customer] })}
          listProjects={listProjects}
          listEnrollments={listEnrollments}
          createJob={(payload) => createJob({ ...payload, customerId: cid })}
          initialCustomer={customer}
          lockCustomer={true}
        />
      ) : null}

      {canEnroll ? (
        <CreateEnrollmentModal
          open={newEnrollOpen}
          initialCustomerId={cid}
          onClose={() => setNewEnrollOpen(false)}
          onSubmit={handleCreateEnrollment}
          busy={enrollBusy}
        />
      ) : null}
    </>
  );
}
