import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, ClipboardCheck, ExternalLink, FileText, ReceiptText, RefreshCw, Send, UserRound, Wallet, XCircle } from "lucide-react";

import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { usePageCrumbs } from "../../../layouts/ShellContext";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Panel from "../../../shared/ui/Panel";
import KeyValue from "../../../shared/ui/KeyValue";
import Timeline from "../../../shared/ui/Timeline";
import Alert from "../../../shared/ui/Alert";
import RowActions from "../../../shared/ui/RowActions";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";

import { getExpense, updateExpense } from "../api";
import { EXPENSE_STATUS_LABEL, EXPENSE_STATUS_TONE, date, expenseCategoryLabel, humanize, isOwnRecord, money, monthLabel } from "../format";
import ExpenseClaimFormModal from "../components/ExpenseClaimFormModal";
import ExpenseActionDialogs from "../components/ExpenseActionDialogs";
import { expenseActionsFor } from "../components/expenseActions";

const person = (u) => (u && typeof u === "object" ? u.fullName || u.email || "" : "");
// Only web links open from the page; anything else is shown as text.
const safeUrl = (u) => (/^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "");

// Expense claim detail (PUI-4). The API returns a claim only to approvers and
// to the person it belongs to; actions follow the same rules as the list.
export default function ExpenseClaimDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [action, setAction] = useState(null);

  usePageCrumbs(item ? [{ label: "Expense claims", to: "/portal/hr/expenses" }, { label: item.title || "Claim" }] : []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getExpense(id);
      setItem(res?.item || null);
      if (!res?.item) setLoadError({ status: 404 });
    } catch (e) {
      setLoadError({ status: e?.response?.status, message: e?.response?.data?.message });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !item) return <LoadingState rows={6} label="Loading expense claim" />;
  if (loadError || !item) {
    const s = loadError?.status;
    return (
      <ErrorState
        title={s === 404 ? "Expense claim not found" : s === 403 ? "You don't have access to this claim" : "This claim didn't load"}
        message={s === 404 ? "It may have been deleted, or it isn't one you can see." : s === 403 ? "Ask an administrator if you need it." : loadError?.message || undefined}
        onRetry={s === 404 || s === 403 ? undefined : load}
      />
    );
  }

  const mine = isOwnRecord(access, item);
  const actions = expenseActionsFor(access, item, {
    confirm: (kind) => setAction({ kind, item }),
    reject: () => setAction({ kind: "reject", item }),
    register: () => setAction({ kind: "register", item }),
    edit: () => {
      setFormError("");
      setEditOpen(true);
    },
  });
  // The next step in the workflow goes on a button; everything else in the menu.
  const primaryKey = ["approve", "register", "paid"].find((k) => actions.some((a) => a.key === k));
  const primary = actions.find((a) => a.key === primaryKey);
  const menu = [
    { key: "refresh", label: "Refresh", icon: RefreshCw, onSelect: () => load() },
    ...actions.filter((a) => a.key !== primaryKey && a.key !== "edit"),
  ];
  const edit = actions.find((a) => a.key === "edit");
  const receipt = safeUrl(item.receiptUrl);

  const history = [
    { key: "submitted", icon: Send, content: <>Submitted{item.staffName ? ` for ${item.staffName}` : ""}</>, when: date(item.createdAt), dateTime: item.createdAt },
    item.approvedAt ? { key: "approved", icon: CheckCircle2, tone: "ok", content: <>Approved{person(item.approvedBy) ? ` by ${person(item.approvedBy)}` : ""}</>, when: date(item.approvedAt), dateTime: item.approvedAt } : null,
    item.status === "rejected" ? { key: "rejected", icon: XCircle, tone: "bad", content: <>Rejected{item.rejectionReason ? `: ${item.rejectionReason}` : ""}</> } : null,
    item.registeredAt ? { key: "registered", icon: ClipboardCheck, tone: "info", content: <>Registered to {monthLabel(item.registeredMonth)}{person(item.registeredBy) ? ` by ${person(item.registeredBy)}` : ""}</>, when: date(item.registeredAt), dateTime: item.registeredAt } : null,
    item.paidAt ? { key: "paid", icon: Wallet, tone: "ok", content: <>Paid</>, when: date(item.paidAt), dateTime: item.paidAt } : null,
  ].filter(Boolean);

  return (
    <>
      <div className="px-stack" style={{ gap: 20 }}>
        <header className="px-record-head">
          <div className="px-record-id">
            <div className="px-record-tags">
              <Badge tone={EXPENSE_STATUS_TONE[item.status] || "neutral"} dot>{EXPENSE_STATUS_LABEL[item.status] || humanize(item.status)}</Badge>
              <span className="px-code">{expenseCategoryLabel(item.category)}</span>
            </div>
            <h1>{item.title || "Untitled claim"}</h1>
            <ul className="px-record-meta" aria-label="Claim summary">
              <li>
                <UserRound size={15} aria-hidden="true" />
                {item.staffName || "Unnamed"}
                {mine ? " (you)" : ""}
              </li>
              <li>
                <CalendarDays size={15} aria-hidden="true" />
                Spent {date(item.expenseDate)}
              </li>
              <li>
                <ReceiptText size={15} aria-hidden="true" />
                {money(item.amount, item.currency)}
              </li>
            </ul>
          </div>
          <div className="px-record-actions">
            {edit ? (
              <Button variant="outline" onClick={edit.onSelect}>
                <edit.icon size={15} aria-hidden="true" />
                Edit
              </Button>
            ) : null}
            {primary ? (
              <Button onClick={primary.onSelect}>
                <primary.icon size={15} aria-hidden="true" />
                {primary.label}
              </Button>
            ) : null}
            <RowActions label={item.title || "claim"} actions={menu} />
          </div>
        </header>

        {item.status === "rejected" ? (
          <Alert tone="bad" icon={XCircle} title="This claim was rejected">
            {item.rejectionReason || "No reason was given."}
          </Alert>
        ) : item.status === "submitted" && mine && access.can("hr.expenses.approve") && access.role !== "super_admin" ? (
          <Alert tone="info" title="This is your own claim">
            Someone else with approval rights needs to decide on it.
          </Alert>
        ) : null}

        <div className="px-grid px-cols-detail">
          <div className="px-stack">
            <Panel title="Claim">
              <KeyValue
                items={[
                  { label: "Amount", value: money(item.amount, item.currency) },
                  { label: "Category", value: expenseCategoryLabel(item.category) },
                  { label: "Expense date", value: date(item.expenseDate) },
                  { label: "Claim month", value: monthLabel(item.claimMonth) },
                  { label: "Description", value: item.description },
                ]}
              />
            </Panel>
            <Panel title="History">
              <Timeline label="Claim history" items={history} />
            </Panel>
            {item.notes ? (
              <Panel title="Notes">
                <p className="px-prose">{item.notes}</p>
              </Panel>
            ) : null}
          </div>

          <div className="px-stack">
            <Panel title="Payment">
              <KeyValue
                className="px-kv--side"
                items={[
                  { label: "Payment", value: item.paymentStatus === "paid" ? "Paid" : ["registered"].includes(item.status) ? "Not paid yet" : "Not registered yet" },
                  { label: "Registered to", value: monthLabel(item.registeredMonth), hidden: !item.registeredMonth },
                  { label: "Paid on", value: date(item.paidAt), hidden: !item.paidAt },
                ]}
              />
            </Panel>
            <Panel title="Details">
              <KeyValue
                className="px-kv--side"
                items={[
                  { label: "Staff", value: item.staffName },
                  { label: "Email", value: item.staffUserId?.email, hidden: !item.staffUserId?.email },
                  { label: "Department", value: humanize(item.department, "") },
                  { label: "Approved by", value: person(item.approvedBy), hidden: !item.approvedBy },
                  { label: "Registered by", value: person(item.registeredBy), hidden: !item.registeredBy },
                ]}
              />
            </Panel>
            <Panel title="Receipt">
              {receipt ? (
                <a className="px-btn px-btn--outline px-btn--sm" href={receipt} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} aria-hidden="true" />
                  Open receipt
                </a>
              ) : item.receiptUrl ? (
                <p className="px-muted" style={{ margin: 0, wordBreak: "break-all" }}>{item.receiptUrl}</p>
              ) : (
                <div className="px-inline-empty">
                  <FileText size={18} aria-hidden="true" />
                  <span>No receipt attached.</span>
                </div>
              )}
            </Panel>
          </div>
        </div>
      </div>

      {edit ? (
        <ExpenseClaimFormModal
          open={editOpen}
          initial={item}
          busy={formBusy}
          error={formError}
          onClose={() => setEditOpen(false)}
          onSubmit={async (payload) => {
            setFormBusy(true);
            setFormError("");
            try {
              await updateExpense(item._id, payload);
              toast.success("Claim updated.");
              setEditOpen(false);
              await load();
            } catch (e) {
              setFormError(e?.response?.data?.message || "That didn't save. Check the details and try again.");
            } finally {
              setFormBusy(false);
            }
          }}
        />
      ) : null}
      <ExpenseActionDialogs
        action={action}
        onClose={() => setAction(null)}
        onDone={(kind) => (kind === "delete" ? nav("/portal/hr/expenses") : load())}
      />
    </>
  );
}
