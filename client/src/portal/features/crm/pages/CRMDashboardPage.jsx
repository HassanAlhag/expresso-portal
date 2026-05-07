import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import StatCard from "../../../shared/ui/StatCard";

const DEAL_STAGES = [
  "discovery",
  "qualified",
  "proposal",
  "negotiation",
  "verbal_commitment",
  "won",
  "lost",
];

const STAGE_LABELS = {
  discovery: "Discovery",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  verbal_commitment: "Verbal Commit",
  won: "Won",
  lost: "Lost",
};

const LEAD_STATUS_LABELS = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  unqualified: "Unqualified",
  converted: "Converted",
};

function getToken() {
  return (
    localStorage.getItem("portal_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

async function apiGet(path) {
  const token = getToken();
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.message || "Request failed");
  return data;
}

function formatMoney(value, currency = "AED") {
  return `${currency} ${Number(value || 0).toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

function getDealValue(deal) {
  return Number(deal?.value || 0);
}

function getStatusClass(status) {
  switch (status) {
    case "new":
    case "discovery":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "contacted":
    case "qualified":
      return "border-purple-100 bg-purple-50 text-purple-700";
    case "proposal":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "negotiation":
    case "verbal_commitment":
      return "border-orange-100 bg-orange-50 text-orange-700";
    case "won":
    case "converted":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "lost":
    case "unqualified":
      return "border-red-100 bg-red-50 text-red-700";
    default:
      return "border-slate-100 bg-slate-50 text-slate-700";
  }
}

function getOwnerName(item) {
  return item?.ownerUserId?.fullName || item?.ownerUserId?.email || "Unassigned";
}

export default function CRMDashboardPage() {
  const nav = useNavigate();

  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [totals, setTotals] = useState({ leads: 0, deals: 0, accounts: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const [leadsRes, dealsRes, accountsRes] = await Promise.all([
        apiGet("/api/crm/leads?limit=8&includeConverted=true&sort=-createdAt"),
        apiGet("/api/crm/deals?limit=50&sort=-createdAt"),
        apiGet("/api/crm/accounts?limit=8&sort=-createdAt"),
      ]);
      setLeads(leadsRes.items || []);
      setDeals(dealsRes.items || []);
      setAccounts(accountsRes.items || []);
      setTotals({
        leads: leadsRes.total || 0,
        deals: dealsRes.total || 0,
        accounts: accountsRes.total || 0,
      });
    } catch (err) {
      setError(err.message || "Failed to load CRM dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line
  }, []);

  const openDeals = useMemo(() => deals.filter((d) => d.status === "open"), [deals]);
  const wonDeals = useMemo(() => deals.filter((d) => d.stage === "won" || d.status === "won"), [deals]);
  const pipelineValue = useMemo(() => openDeals.reduce((s, d) => s + getDealValue(d), 0), [openDeals]);
  const wonValue = useMemo(() => wonDeals.reduce((s, d) => s + getDealValue(d), 0), [wonDeals]);

  const pipelineStages = useMemo(() =>
    DEAL_STAGES.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      return {
        stage,
        label: STAGE_LABELS[stage] || stage,
        count: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + getDealValue(d), 0),
      };
    }),
    [deals]
  );

  const convertedLeadsCount = useMemo(() => leads.filter((l) => l.status === "converted").length, [leads]);
  const hotOpportunities = useMemo(() => openDeals.filter((d) => Number(d.value || 0) > 0).slice(0, 4), [openDeals]);

  const followUps = useMemo(() => {
    const leadTasks = leads
      .filter((l) => l.status !== "converted")
      .slice(0, 3)
      .map((l) => ({
        title: `Follow up with ${l.companyName || l.fullName}`,
        subtitle: l.email || l.phone || "No contact details",
        type: l.email ? "Email" : "Call",
        icon: l.email ? Mail : Phone,
      }));
    const dealTasks = openDeals.slice(0, 2).map((d) => ({
      title: `Move "${d.title}" forward`,
      subtitle: `${STAGE_LABELS[d.stage] || d.stage} · ${formatMoney(d.value, d.currency)}`,
      type: "Deal",
      icon: CalendarClock,
    }));
    return [...leadTasks, ...dealTasks].slice(0, 5);
  }, [leads, openDeals]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CRM"
        title="Sales Pipeline"
        subtitle="Leads, deals, accounts and follow-up actions in one view."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "CRM" }, { label: "Dashboard" }]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadDashboard} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button onClick={() => nav("/portal/crm/leads")}>
              <Plus size={14} />
              New lead
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <Loader2 className="animate-spin" size={20} />
            Loading CRM data…
          </div>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Users} label="Total Leads" value={totals.leads} color="indigo"
              sub={`${convertedLeadsCount} converted`} />
            <StatCard icon={BriefcaseBusiness} label="Open Deals" value={openDeals.length} color="violet"
              sub={`${totals.deals} total`} />
            <StatCard icon={CircleDollarSign} label="Pipeline" value={formatMoney(pipelineValue)} color="emerald"
              sub="Open deal value" />
            <StatCard icon={Building2} label="Accounts" value={totals.accounts} color="rose"
              sub="CRM records" />
          </div>

          {/* Pipeline + Follow-ups */}
          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            {/* Pipeline stages */}
            <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10.5px] font-black uppercase tracking-[0.2em] text-slate-400">Pipeline</div>
                  <h2 className="mt-1 text-lg font-black text-slate-900">Deal Stages</h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Open value: {formatMoney(pipelineValue)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => nav("/portal/crm/deals")}>
                  Manage deals
                  <ArrowUpRight size={14} />
                </Button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
                {pipelineStages.map((s) => (
                  <div
                    key={s.stage}
                    className="rounded-[18px] border border-black/[0.06] bg-slate-50 p-3"
                  >
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] ${getStatusClass(s.stage)}`}>
                      {s.label}
                    </span>
                    <div className="mt-3 text-2xl font-black text-slate-900">{s.count}</div>
                    <div className="text-xs text-slate-500">deals</div>
                    <div className="mt-2 rounded-xl bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 border border-black/5">
                      {formatMoney(s.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-ups */}
            <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10.5px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</div>
                  <h2 className="mt-1 text-lg font-black text-slate-900">Follow-ups</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Suggested from leads and open deals.</p>
                </div>
                <Clock3 size={20} className="text-slate-300" />
              </div>

              <div className="mt-5 grid gap-2.5">
                {followUps.length ? (
                  followUps.map((task, i) => {
                    const Icon = task.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 rounded-[18px] border border-black/[0.06] bg-slate-50 p-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-slate-900">{task.title}</div>
                          <div className="mt-0.5 truncate text-xs text-slate-500">{task.subtitle}</div>
                          <span className="mt-1.5 inline-flex rounded-full border border-black/10 bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600">
                            {task.type}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[18px] border border-dashed border-black/10 bg-slate-50 p-5 text-center text-sm text-slate-400">
                    No follow-up tasks.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Leads table */}
          <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[10.5px] font-black uppercase tracking-[0.2em] text-slate-400">Leads</div>
                <h2 className="mt-1 text-lg font-black text-slate-900">Recent Leads</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => nav("/portal/crm/leads")}>
                View all
                <ArrowUpRight size={14} />
              </Button>
            </div>

            <div className="mt-5 overflow-hidden rounded-[20px] border border-black/[0.06]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Lead", "Company", "Contact", "Source", "Owner", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {leads.length ? (
                      leads.map((lead) => (
                        <tr
                          key={lead._id}
                          className="cursor-pointer transition hover:bg-slate-50"
                          onClick={() => nav(`/portal/crm/leads/${lead._id}`)}
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-900">
                            {lead.fullName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                            {lead.companyName || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                            {lead.email || lead.phone || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-slate-600">
                            {lead.source || "manual"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                            {getOwnerName(lead)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] ${getStatusClass(lead.status)}`}>
                              {LEAD_STATUS_LABELS[lead.status] || lead.status || "New"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                          No leads found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom 3 KPI cards + Accounts */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={20} className="text-emerald-500" />
                <span className="font-black text-slate-900">Won Deals</span>
              </div>
              <div className="mt-4 text-3xl font-black text-slate-900">{formatMoney(wonValue)}</div>
              <div className="mt-1 text-sm text-slate-500">
                From {wonDeals.length} won deal{wonDeals.length !== 1 ? "s" : ""}
              </div>
            </div>

            <div className="rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <CalendarClock size={20} className="text-indigo-500" />
                <span className="font-black text-slate-900">Pending Follow-ups</span>
              </div>
              <div className="mt-4 text-3xl font-black text-slate-900">{followUps.length}</div>
              <div className="mt-1 text-sm text-slate-500">Calls, emails, and deal updates</div>
            </div>

            <div className="rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <TrendingUp size={20} className="text-orange-500" />
                <span className="font-black text-slate-900">Hot Opportunities</span>
              </div>
              <div className="mt-4 text-3xl font-black text-slate-900">{hotOpportunities.length}</div>
              <div className="mt-1 text-sm text-slate-500">Open deals with active value</div>
            </div>
          </div>

          {/* Recent Accounts */}
          <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[10.5px] font-black uppercase tracking-[0.2em] text-slate-400">Accounts</div>
                <h2 className="mt-1 text-lg font-black text-slate-900">Recent Accounts</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => nav("/portal/crm/accounts")}>
                View all
                <ArrowUpRight size={14} />
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {accounts.length ? (
                accounts.map((account) => (
                  <div
                    key={account._id}
                    className="cursor-pointer rounded-[20px] border border-black/[0.06] bg-slate-50 p-4 transition hover:bg-slate-100"
                    onClick={() => nav(`/portal/crm/accounts/${account._id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">{account.name}</div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">
                          {account.industry || "No industry"}
                        </div>
                      </div>
                      <Building2 size={16} className="shrink-0 text-slate-300" />
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <div className="truncate">{account.email || account.phone || "No contact"}</div>
                      <div className="truncate">
                        {[account.city, account.country].filter(Boolean).join(", ") || "No location"}
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] ${getStatusClass(account.status)}`}>
                        {account.status || "active"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-black/10 bg-slate-50 p-5 text-sm text-slate-400 sm:col-span-2 xl:col-span-4">
                  No accounts found.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
