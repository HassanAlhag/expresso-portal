// src/portal/features/customers/pages/CustomerDetailsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import Badge from "../../../shared/ui/Badge";
import { useToast } from "../../../shared/ui/Toast";

import {
  ArrowLeft,
  Building2,
  ClipboardList,
  Film,
  UserPlus,
  ExternalLink,
  Activity,
  RefreshCw,
  Plus,
  BriefcaseBusiness,
  Layers3,
  Pencil,
  Briefcase,
  ShoppingCart,
  Layers,
  Package,
} from "lucide-react";

import CustomerFormModal from "../components/CustomerFormModal";
import { getCustomerById, createCustomerLogin, updateCustomer } from "../api";
import {
  listEnrollments,
  generateJobsFromEnrollment,
} from "../../enrollments/api";
import { listProjects } from "../../projects/api";
import { listJobs, createJob } from "../../jobs/api";
import NewJobModal from "../../jobs/components/NewJobModal";

import CustomerTabButton from "../tabs/CustomerTabButton";
import CustomerOverviewTab from "../tabs/CustomerOverviewTab";
import CustomerEnrollmentsTab from "../tabs/CustomerEnrollmentsTab";
import CustomerProjectsTab from "../tabs/CustomerProjectsTab";
import CustomerJobsTab from "../tabs/CustomerJobsTab";
import CustomerProductionsTab from "../tabs/CustomerProductionsTab";
import CustomerLoginsTab from "../tabs/CustomerLoginsTab";
import CustomerActivityTab from "../tabs/CustomerActivityTab";
import CustomerProcurementTab from "../tabs/CustomerProcurementTab";

const DEPT_META = {
  digital_agency: {
    label: "Digital Agency",
    icon: Briefcase,
    classes: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  procurement: {
    label: "Procurement",
    icon: ShoppingCart,
    classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  both: {
    label: "Digital & Procurement",
    icon: Layers,
    classes: "border-violet-200 bg-violet-50 text-violet-700",
  },
};


export default function CustomerDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [tab, setTab] = useState(searchParams.get("tab") || "overview");
  const selectedEnrollmentId = searchParams.get("enrollment") || "";

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState(null);

  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [jobs, setJobs] = useState([]);
  const [jobQ, setJobQ] = useState("");

  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [convertingEnrollmentId, setConvertingEnrollmentId] = useState("");

  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [projects, setProjects] = useState([]);

  const [newJobOpen, setNewJobOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const setActiveTab = (nextTab, extra = {}) => {
    setTab(nextTab);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", nextTab);

    if (extra.enrollment) {
      nextParams.set("enrollment", extra.enrollment);
    } else {
      nextParams.delete("enrollment");
    }

    setSearchParams(nextParams);
  };

  const loadCustomer = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCustomerById(id);
      const item = res?.item || null;
      setCustomer(item);
      setLoginName(item?.contactName || "");
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load client"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = async (payload) => {
    if (!customer?._id) return;

    setBusy(true);
    try {
      await updateCustomer(customer._id, payload);
      setEditOpen(false);
      await loadCustomer();
      toast.success("Client updated successfully.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const loadJobs = async () => {
    if (!customer?._id) return;

    setJobsLoading(true);
    setJobsError("");

    try {
      const res = await listJobs({
        q: jobQ,
        customerId: customer._id,
        limit: 50,
        page: 1,
      });

      const items = Array.isArray(res?.items) ? res.items : [];
      const filtered = items.filter((j) => {
        const cid = j?.customerId?._id || j?.customerId;
        return String(cid) === String(customer._id);
      });

      setJobs(filtered);
    } catch (e) {
      setJobsError(
        e?.response?.data?.message || e?.message || "Failed to load jobs"
      );
    } finally {
      setJobsLoading(false);
    }
  };


  const loadEnrollments = async () => {
    if (!customer?._id) return;

    setEnrollmentsLoading(true);
    setEnrollmentsError("");

    try {
      const res = await listEnrollments({
        customerId: customer._id,
        limit: 100,
        page: 1,
        sort: "-createdAt",
      });

      setEnrollments(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setEnrollmentsError(
        e?.response?.data?.message || e?.message || "Failed to load enrollments"
      );
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!customer?._id) return;

    setProjectsLoading(true);
    setProjectsError("");

    try {
      const res = await listProjects({
        customerId: customer._id,
        limit: 100,
        page: 1,
        sort: "-createdAt",
      });

      setProjects(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setProjectsError(
        e?.response?.data?.message || e?.message || "Failed to load projects"
      );
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleConvertEnrollmentToJobs = async (enrollmentId) => {
    if (!enrollmentId) return;

    setConvertingEnrollmentId(enrollmentId);
    try {
      const res = await generateJobsFromEnrollment(enrollmentId);
      const count = res?.jobs?.length || res?.created || 0;
      toast.success(`${count} job(s) generated from enrollment.`);
      await loadEnrollments();
      await loadJobs();
      setActiveTab("jobs");
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to generate jobs"
      );
    } finally {
      setConvertingEnrollmentId("");
    }
  };

  useEffect(() => {
    loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const urlTab = searchParams.get("tab") || "overview";
    setTab(urlTab);
  }, [searchParams]);

  useEffect(() => {
    if (!customer?._id) return;

    if (tab === "jobs") loadJobs();
    if (tab === "enrollments") loadEnrollments();
    if (tab === "projects") loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, customer?._id]);

  const title = useMemo(() => customer?.companyName || "Client", [customer]);

  const dept = customer?.department || "digital_agency";
  const showAgencyTabs = dept === "digital_agency" || dept === "both";
  const showProcurementTab = dept === "procurement" || dept === "both";

  const createLogin = async () => {
    if (!customer?._id) return;

    setBusy(true);
    try {
      await createCustomerLogin(customer._id, {
        email: loginEmail,
        fullName: loginName,
        tempPassword,
      });
      setLoginEmail("");
      setTempPassword("");
      await loadCustomer();
      toast.success("Login created and linked.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Create login failed");
    } finally {
      setBusy(false);
    }
  };

  const listCustomersForModal = async () => ({
    items: customer ? [customer] : [],
  });

  const createJobForModal = async (payload) => {
    return createJob({
      ...payload,
      customerId: customer?._id,
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
        {error}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 text-sm font-black text-slate-700 shadow-sm">
        Client not found.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => nav("/portal/customers")}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-black text-slate-900 transition hover:bg-black/[0.03]"
            >
              <ArrowLeft size={14} />
              Back
            </button>

            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-3xl border border-black/10 bg-white">
                {customer.logoUrl ? (
                  <img
                    src={customer.logoUrl}
                    alt={customer.companyName}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <Building2 size={20} />
                )}
              </div>

              <div className="min-w-0">
                <div className="truncate text-2xl font-black tracking-tight text-slate-900">
                  {title}
                </div>
                <div className="truncate text-sm text-slate-600">
                  {customer.contactName || "—"} • {customer.primaryEmail || "—"}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={customer.isActive ? "success" : "danger"}>
                    {customer.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                  <Badge tone="neutral">/{customer.slug || "—"}</Badge>
                  <Badge tone={customer.ownerUserId ? "info" : "neutral"}>
                    {customer.ownerUserId ? "LOGIN LINKED" : "NO LOGIN"}
                  </Badge>
                  {(() => {
                    const meta = DEPT_META[dept];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${meta.classes}`}>
                        <Icon size={11} />
                        {meta.label}
                      </span>
                    );
                  })()}
                </div>

                {(customer.crmDealId || customer.crmAccountId) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {customer.crmDealId && (
                      <button
                        type="button"
                        onClick={() => nav(`/portal/crm/deals/${customer.crmDealId._id || customer.crmDealId}`)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-indigo-700 transition hover:bg-indigo-100"
                      >
                        Source: CRM deal
                        {customer.crmDealId.title ? ` · ${customer.crmDealId.title}` : ""}
                        <ExternalLink size={11} />
                      </button>
                    )}
                    {customer.crmAccountId && (
                      <button
                        type="button"
                        onClick={() => nav(`/portal/crm/accounts/${customer.crmAccountId._id || customer.crmAccountId}`)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-600 transition hover:bg-slate-100"
                      >
                        CRM account
                        {customer.crmAccountId.name ? ` · ${customer.crmAccountId.name}` : ""}
                        <ExternalLink size={11} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <CustomerTabButton
                active={tab === "overview"}
                onClick={() => setActiveTab("overview")}
                Icon={Building2}
              >
                Overview
              </CustomerTabButton>

              {showAgencyTabs && (
                <CustomerTabButton
                  active={tab === "enrollments"}
                  onClick={() => setActiveTab("enrollments")}
                  Icon={Layers3}
                >
                  Enrollments
                </CustomerTabButton>
              )}

              {showAgencyTabs && (
                <CustomerTabButton
                  active={tab === "projects"}
                  onClick={() => setActiveTab("projects")}
                  Icon={BriefcaseBusiness}
                >
                  Projects
                </CustomerTabButton>
              )}

              {showAgencyTabs && (
                <CustomerTabButton
                  active={tab === "jobs"}
                  onClick={() => setActiveTab("jobs")}
                  Icon={ClipboardList}
                >
                  Jobs
                </CustomerTabButton>
              )}

              {showAgencyTabs && (
                <CustomerTabButton
                  active={tab === "productions"}
                  onClick={() => setActiveTab("productions")}
                  Icon={Film}
                >
                  Productions
                </CustomerTabButton>
              )}

              {showProcurementTab && (
                <CustomerTabButton
                  active={tab === "procurement"}
                  onClick={() => setActiveTab("procurement")}
                  Icon={Package}
                >
                  Procurement
                </CustomerTabButton>
              )}

              <CustomerTabButton
                active={tab === "logins"}
                onClick={() => setActiveTab("logins")}
                Icon={UserPlus}
              >
                Logins
              </CustomerTabButton>

              <CustomerTabButton
                active={tab === "activity"}
                onClick={() => setActiveTab("activity")}
                Icon={Activity}
              >
                Activity
              </CustomerTabButton>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                loadCustomer();
                if (tab === "jobs") loadJobs();
                if (tab === "enrollments") loadEnrollments();
                if (tab === "projects") loadProjects();
              }}
              disabled={busy}
            >
              <RefreshCw size={16} />
              Refresh
            </Button>

            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
              disabled={busy}
            >
              <Pencil size={16} />
              Edit client
            </Button>

            {showAgencyTabs && (
              <Button onClick={() => setNewJobOpen(true)} disabled={busy}>
                <Plus size={16} />
                Create Job
              </Button>
            )}
          </div>
        </div>
      </div>

      {tab === "overview" ? <CustomerOverviewTab customer={customer} /> : null}

      {tab === "enrollments" && showAgencyTabs ? (
        <CustomerEnrollmentsTab
          enrollmentsLoading={enrollmentsLoading}
          enrollmentsError={enrollmentsError}
          enrollments={enrollments}
          selectedEnrollmentId={selectedEnrollmentId}
          busy={busy}
          convertingEnrollmentId={convertingEnrollmentId}
          onOpenJobs={(item) => {
            setActiveTab("jobs", { enrollment: item?._id });
            loadJobs();
          }}
          onConvert={handleConvertEnrollmentToJobs}
        />
      ) : null}

      {tab === "projects" && showAgencyTabs ? (
        <CustomerProjectsTab
          projectsLoading={projectsLoading}
          projectsError={projectsError}
          projects={projects}
          onOpenProject={(projectId) => nav(`/portal/projects/${projectId}`)}
        />
      ) : null}

      {tab === "jobs" && showAgencyTabs ? (
        <CustomerJobsTab
          jobQ={jobQ}
          setJobQ={setJobQ}
          jobsLoading={jobsLoading}
          jobsError={jobsError}
          jobs={jobs}
          busy={busy}
          onLoadJobs={loadJobs}
          onOpenNewJob={() => setNewJobOpen(true)}
          onOpenJob={(jobId) => nav(`/portal/jobs/${jobId}`)}
        />
      ) : null}

      {tab === "productions" && showAgencyTabs ? <CustomerProductionsTab customerId={customer._id} /> : null}

      {tab === "procurement" && showProcurementTab ? (
        <CustomerProcurementTab customer={customer} />
      ) : null}

      {tab === "logins" ? (
        <CustomerLoginsTab
          customer={customer}
          busy={busy}
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginName={loginName}
          setLoginName={setLoginName}
          tempPassword={tempPassword}
          setTempPassword={setTempPassword}
          onCreateLogin={createLogin}
        />
      ) : null}

      {tab === "activity" ? <CustomerActivityTab /> : null}

      <CustomerFormModal
        open={editOpen}
        mode="edit"
        initial={customer}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditCustomer}
        busy={busy}
      />

      <NewJobModal
        open={newJobOpen}
        onClose={() => {
          setNewJobOpen(false);
          if (tab === "jobs") loadJobs();
        }}
        listCustomers={listCustomersForModal}
        createJob={createJobForModal}
        initialCustomer={customer}
        lockCustomer={true}
      />
    </div>
  );
}
