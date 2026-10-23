import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ClipboardList, MailWarning, RefreshCw, SearchX, XCircle } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import SearchField from "../../../shared/ui/SearchField";
import SelectField from "../../../shared/ui/SelectField";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import Pagination from "../../../shared/ui/Pagination";
import KeyValue from "../../../shared/ui/KeyValue";
import Alert from "../../../shared/ui/Alert";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import LoadingState from "../../../shared/ui/LoadingState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { approveVendorApplication, getVendorApplication, listVendorApplications, rejectVendorApplication } from "../api";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE, date, options, safeUrl } from "../format";

const LIMIT = 15;
const total = (r) => Number(r?.total ?? 0);

export function buildApplicationParams({ q, status, page }) {
  const p = { page, limit: LIMIT };
  if (q) p.q = q;
  if (status) p.status = status;
  return p;
}

// Vendor applications (PUI-4, internal, procurement.approve). Approving
// creates the vendor and emails an invitation; rejecting records a reason.
export default function VendorApplicationsPage() {
  const toast = useToast();
  const access = useAccess();
  const canDecide = access.can("procurement.approve");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState({ status: "idle", item: null });
  const [invitation, setInvitation] = useState(null);
  const [dialog, setDialog] = useState(null); // approve | reject
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listVendorApplications(buildApplicationParams({ q: dq.trim(), status, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, status, page]);

  const loadCounts = useCallback(async () => {
    try {
      const res = await Promise.all(APPLICATION_STATUSES.map((s) => listVendorApplications({ status: s, limit: 1 })));
      setCounts(Object.fromEntries(APPLICATION_STATUSES.map((s, i) => [s, total(res[i])])));
    } catch {
      setCounts(null);
    }
  }, []);

  const loadDetail = useCallback(async (id) => {
    if (!id) return;
    setDetail({ status: "loading", item: null });
    try {
      const res = await getVendorApplication(id);
      setDetail({ status: res?.item ? "ready" : "failed", item: res?.item || null });
    } catch {
      setDetail({ status: "failed", item: null });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);
  useEffect(() => {
    setPage(1);
  }, [dq]);
  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const select = (id) => {
    setInvitation(null);
    setSelectedId(id === selectedId ? null : id);
  };
  const refresh = () => Promise.all([load(), loadCounts(), selectedId ? loadDetail(selectedId) : null]);

  const metrics = counts
    ? APPLICATION_STATUSES.map((s) => ({
        key: s,
        label: APPLICATION_STATUS_LABEL[s],
        value: counts[s],
        note: s === "pending" ? "Waiting for a decision" : s === "approved" ? "Now vendors" : "With a recorded reason",
        noteTone: s === "pending" && counts[s] ? "warn" : undefined,
        onClick: () => { setStatus(status === s ? "" : s); setPage(1); },
        pressed: status === s,
      }))
    : [];

  const guarded = async (fn) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await fn();
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const approve = () =>
    guarded(async () => {
      try {
        const res = await approveVendorApplication(detail.item._id);
        setInvitation(res?.invitation || { emailSent: false });
        toast.success("Application approved. The vendor has been created.");
        setDialog(null);
        await refresh();
      } catch (e) {
        toast.error(e?.response?.data?.message || "The application wasn't approved. Try again.");
      }
    });

  const reject = () =>
    guarded(async () => {
      try {
        await rejectVendorApplication(detail.item._id, { reason: reason.trim() });
        toast.success("Application rejected.");
        setDialog(null);
        await refresh();
      } catch (e) {
        toast.error(e?.response?.data?.message || "The application wasn't rejected. Try again.");
      }
    });

  const a = detail.item;
  const site = safeUrl(a?.website);
  let content;
  if (error) content = <ErrorState title="Applications didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = dq.trim() || status ? (
      <EmptyState icon={SearchX} title={`No ${status ? APPLICATION_STATUS_LABEL[status].toLowerCase() : ""} applications${dq.trim() ? " match" : ""}`} action={<Button variant="outline" onClick={() => { setQ(""); setStatus(""); setPage(1); }}>Show all applications</Button>} />
    ) : (
      <EmptyState icon={ClipboardList} title="No vendor applications yet" message="Applications from the public vendor sign-up form appear here." />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Vendor applications" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col" className="px-hide-tab">Country</th>
              <th scope="col" className="px-hide-tab">Applied</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={5} cols={4} label="Loading applications" />
            ) : (
              items.map((it) => (
                <tr key={it._id}>
                  <td className="px-primary">
                    <div className="px-cell-main">
                      <button type="button" aria-pressed={selectedId === it._id} onClick={() => select(it._id)}>{it.companyName}</button>
                      <span>{[it.contactName, it.email].filter(Boolean).join(", ")}</span>
                    </div>
                  </td>
                  <td data-label="Country" className="px-hide-tab">{it.country || "—"}</td>
                  <td data-label="Applied" className="px-num px-hide-tab">{date(it.createdAt)}</td>
                  <td data-label="Status">
                    <Badge tone={APPLICATION_STATUS_TONE[it.status] || "neutral"} dot>{APPLICATION_STATUS_LABEL[it.status] || it.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun="applications" label="Application pages" /> : null}
      </>
    );

  return (
    <>
      <PageFrame
        title="Vendor applications"
        description="Companies that applied to become Expresso vendors through the public sign-up form."
        breadcrumb={[{ label: "Procurement", to: access.canOpen("/portal/procurement") ? "/portal/procurement" : undefined }, { label: "Vendor applications" }]}
        secondaryActions={
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        }
      >
        <MetricsStrip label="Application summary" items={metrics} />
        <div className={selectedId ? "px-grid px-cols-detail" : undefined}>
          <Panel flush bare label="Applications" className="px-list-panel">
            <div className="px-toolbar" role="search" aria-label="Filter applications">
              <SearchField label="Search applications" value={q} onChange={setQ} placeholder="Company, contact, email or country" />
              <SelectField label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "", label: "Any status" }, ...options(APPLICATION_STATUSES, APPLICATION_STATUS_LABEL)]} />
            </div>
            <div className="px-result-bar">
              <span aria-live="polite">{loading ? "Loading applications…" : error ? "Applications unavailable" : `${meta.total} application${meta.total === 1 ? "" : "s"}. Choose one to review it.`}</span>
            </div>
            {content}
          </Panel>

          {selectedId ? (
            <Panel title={a?.companyName || "Application"} sub={a ? `Applied ${date(a.createdAt)}` : undefined} action={<Button size="sm" variant="ghost" onClick={() => select(selectedId)}>Close</Button>}>
              {detail.status === "failed" ? (
                <ErrorState title="This application didn't load" onRetry={() => loadDetail(selectedId)} />
              ) : detail.status !== "ready" || !a ? (
                <LoadingState rows={4} label="Loading application" />
              ) : (
                <div className="px-stack">
                  {invitation ? (
                    <Alert tone={invitation.emailSent ? "info" : "warn"} icon={invitation.emailSent ? CheckCircle2 : MailWarning} title={invitation.emailSent ? "Invitation sent" : "The invitation email wasn't sent"}>
                      {invitation.emailSent
                        ? `${invitation.email || "The vendor"} can set their own password from the link${invitation.expiresAt ? ` until ${date(invitation.expiresAt)}` : ""}. It works once; no password is created or shown here.`
                        : "The vendor is approved. Resend the invitation from Users, Invites."}
                    </Alert>
                  ) : null}
                  <Badge tone={APPLICATION_STATUS_TONE[a.status] || "neutral"} dot>{APPLICATION_STATUS_LABEL[a.status] || a.status}</Badge>
                  <KeyValue
                    className="px-kv--side"
                    items={[
                      { label: "Contact", value: a.contactName },
                      { label: "Email", value: a.email ? <a href={`mailto:${a.email}`}>{a.email}</a> : "" },
                      { label: "Phone", value: a.phone },
                      { label: "Country", value: a.country },
                      { label: "Website", value: site ? <a href={site} target="_blank" rel="noopener noreferrer">{a.website}</a> : a.website },
                      { label: "Approved", value: a.approvedAt ? `${date(a.approvedAt)}${a.approvedBy?.fullName ? ` by ${a.approvedBy.fullName}` : ""}` : "", hidden: a.status !== "approved" },
                      { label: "Rejection reason", value: a.rejectionReason || "None given", hidden: a.status !== "rejected" },
                    ]}
                  />
                  <div>
                    <div className="px-muted" style={{ fontSize: 12.5, marginBottom: 6 }}>Categories applied for</div>
                    {(a.categorySelections || []).length ? (
                      <ul className="px-list">
                        {a.categorySelections.map((sel, i) => (
                          <li key={i} style={{ padding: "8px 0" }}>
                            <span>{[sel.mainCategoryId?.name, sel.categoryId?.name, sel.subcategoryId?.name].filter(Boolean).join(" › ") || "Category removed"}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="px-muted">None recorded.</span>
                    )}
                  </div>
                  {canDecide && a.status === "pending" ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Button onClick={() => setDialog("approve")}><CheckCircle2 size={14} aria-hidden="true" />Approve</Button>
                      <Button variant="outline" onClick={() => { setReason(""); setDialog("reject"); }}><XCircle size={14} aria-hidden="true" />Reject</Button>
                    </div>
                  ) : null}
                </div>
              )}
            </Panel>
          ) : null}
        </div>
      </PageFrame>

      {canDecide && a ? (
        <>
          <ConfirmDialog
            open={dialog === "approve"}
            icon={CheckCircle2}
            tone="info"
            title="Approve this application?"
            confirmLabel="Approve and send invitation"
            details={["A vendor is created with the categories applied for.", `An invitation to set up a portal login is emailed to ${a.email}.`]}
            onClose={() => setDialog(null)}
            onConfirm={approve}
          >
            {`${a.companyName}, ${a.contactName}.`}
          </ConfirmDialog>
          <FormDialog open={dialog === "reject"} title="Reject this application?" description={`${a.companyName}, ${a.contactName}.`} onClose={() => setDialog(null)} onSubmit={reject} busy={busy} submitLabel="Reject application" submitIcon={XCircle}>
            <fieldset className="px-form-section">
              <legend>Reason</legend>
              <TextField label="Why it's being rejected" multiline rows={3} value={reason} onChange={(e) => setReason(e.target.value)} hint="Optional. Recorded on the application." />
            </fieldset>
          </FormDialog>
        </>
      ) : null}
    </>
  );
}
