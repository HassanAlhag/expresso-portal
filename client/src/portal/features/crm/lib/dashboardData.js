// CRM overview data (PUI-3). Every figure comes from the list endpoints'
// real totals or from complete result sets; nothing is estimated. Where a
// set is too large to total in the browser, the figure is withheld and the
// UI says so.
import { listLeads, listAccounts, listActivities } from "../api";
import { LEAD_STATUSES, OPEN_DEAL_STAGES, DEAL_STAGES, entityPath } from "../format";
import { loadStageColumns, summarizeStages } from "./dealStages";

const total = (fn, params) => fn({ ...params, limit: 1, page: 1 }).then((r) => Number(r?.total || 0));
const items = (r) => (Array.isArray(r?.items) ? r.items : []);
const PENDING_LIMIT = 200; // the activities API maximum

export async function loadCrmOverview() {
  const [leadEntries, stages, pendingRes, recentLeadsRes, accountsRes] = await Promise.all([
    Promise.all(LEAD_STATUSES.map(async (s) => [s, await total(listLeads, { status: s })])),
    loadStageColumns(),
    listActivities({ status: "pending", sort: "dueAt", limit: PENDING_LIMIT, page: 1 }),
    listLeads({ includeConverted: "true", sort: "-createdAt", limit: 5, page: 1 }),
    listAccounts({ sort: "-createdAt", limit: 5, page: 1 }),
  ]);
  return {
    leads: Object.fromEntries(leadEntries),
    stages,
    pending: items(pendingRes),
    pendingTotal: Number(pendingRes?.total ?? items(pendingRes).length),
    recentLeads: items(recentLeadsRes),
    accounts: items(accountsRes),
    accountTotal: Number(accountsRes?.total || 0),
  };
}

const DAY = 24 * 60 * 60 * 1000;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function deriveCrmOverview(data, now = new Date()) {
  const { leads, stages, pending, pendingTotal } = data;
  const summary = summarizeStages(stages);
  const openLeads = LEAD_STATUSES.filter((s) => s !== "converted").reduce((s, k) => s + (leads[k] || 0), 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueOf = (a) => (a.dueAt ? new Date(a.dueAt).getTime() : null);
  const overdue = pending.filter((a) => dueOf(a) !== null && dueOf(a) < today);
  const dueSoon = pending.filter((a) => dueOf(a) !== null && dueOf(a) >= today && dueOf(a) < today + 8 * DAY);
  const pendingComplete = pendingTotal <= pending.length;

  const won = stages.won || { items: [], total: 0 };
  const wonComplete = won.total <= won.items.length;
  const wonNotConverted = won.items.filter((d) => !d.customerId);

  const attention = [];
  overdue.slice(0, 5).forEach((a) =>
    attention.push({
      key: `a-${a._id}`,
      kind: "overdue",
      tone: "bad",
      title: a.subject || "Follow-up",
      sub: `Overdue since ${new Date(a.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}${a.entityType ? `, on a ${a.entityType}` : ""}`,
      to: entityPath(a.entityType, a.entityId),
      actionLabel: "Open",
    })
  );
  if (overdue.length > 5) {
    attention.push({ key: "more-overdue", kind: "overdue", tone: "bad", title: `${plural(overdue.length - 5, "more overdue follow-up")}`, sub: "Open each record's Activity tab to see them" });
  }
  if (wonNotConverted.length) {
    attention.push({
      key: "won",
      kind: "won",
      tone: "warn",
      title: `${plural(wonNotConverted.length, "won deal")} not yet converted to a client`,
      sub: wonNotConverted.slice(0, 2).map((d) => d.title).filter(Boolean).join(", ") + (wonComplete ? "" : " (among the 100 largest won deals)"),
      to: wonNotConverted.length === 1 ? `/portal/crm/deals/${wonNotConverted[0]._id}` : "/portal/crm/deals",
      actionLabel: wonNotConverted.length === 1 ? "Open deal" : "Open deals",
    });
  }
  if (leads.qualified) {
    attention.push({
      key: "qualified",
      kind: "lead",
      tone: "info",
      title: `${plural(leads.qualified, "qualified lead")} waiting to be converted`,
      sub: "Convert each one to a deal when it's ready",
      to: "/portal/crm/leads",
      actionLabel: "Open leads",
    });
  }

  const maxCount = Math.max(1, ...DEAL_STAGES.map((s) => stages[s]?.total || 0));
  const pipeline = DEAL_STAGES.map((s) => {
    const col = stages[s] || { items: [], total: 0 };
    const complete = col.total <= col.items.length;
    return {
      stage: s,
      count: col.total,
      value: complete ? col.items.reduce((v, d) => v + Number(d.value || 0), 0) : null,
      share: col.total / maxCount,
      open: OPEN_DEAL_STAGES.includes(s),
    };
  });

  return {
    summary,
    openLeads,
    attention,
    dueSoon: dueSoon.slice(0, 6),
    overdueCount: overdue.length,
    pendingComplete,
    pipeline,
  };
}
