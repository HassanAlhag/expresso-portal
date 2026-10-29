import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Activity, BookPlus, Building2, CircleDollarSign, ExternalLink, Handshake, Pencil, RefreshCw, Trash2 } from "lucide-react";

import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { usePageCrumbs } from "../../../layouts/ShellContext";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Panel from "../../../shared/ui/Panel";
import KeyValue from "../../../shared/ui/KeyValue";
import Alert from "../../../shared/ui/Alert";
import RowActions from "../../../shared/ui/RowActions";
import SelectField from "../../../shared/ui/SelectField";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import TabBar, { TabPanel } from "../../../shared/ui/TabBar";

import { getDeal, updateDeal, deleteDeal, convertDealToCustomer } from "../api";
import { createEnrollment } from "../../enrollments/api";
import CreateEnrollmentModal from "../../enrollments/components/CreateEnrollmentModal";
import { DEAL_STAGES, DEAL_STAGE_LABEL, DEAL_STAGE_TONE, OPEN_DEAL_STAGES, leadSourceLabel, money, normalizeStage, ownerName, idOf } from "../format";
import { DEAL_CONVERSION_DETAILS, conversionError } from "../lib/convert";
import { formatDate } from "../../projects/format";
import DealFormModal from "../components/DealFormModal";
import CrmActivityPanel from "../components/CrmActivityPanel";

const TABS = [
  { id: "overview", label: "Overview", icon: Handshake },
  { id: "activity", label: "Activity", icon: Activity },
];

// Deal detail (PUI-3): stage, value, ownership, the records it links, and the
// conversion of a won deal into a client (then optionally a service enrollment).
export default function DealDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("crm.write");
  const canDelete = access.can("crm.delete");
  const canEnroll = access.can("enrollments.write");
  const canOpenClient = access.canOpen("/portal/customers");

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollCustomerId, setEnrollCustomerId] = useState("");
  const [enrollAfterConversion, setEnrollAfterConversion] = useState(false);
  const [enrollBusy, setEnrollBusy] = useState(false);

  usePageCrumbs(item ? [{ label: "CRM", to: "/portal/crm" }, { label: "Deals", to: "/portal/crm/deals" }, { label: item.title || "Deal" }] : []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getDeal(id);
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

  if (loading && !item) return <LoadingState rows={6} label="Loading deal" />;
  if (loadError || !item) {
    const status = loadError?.status;
    return (
      <ErrorState
        title={status === 404 ? "Deal not found" : status === 403 ? "You don't have access to the CRM" : "This deal didn't load"}
        message={status === 404 ? "It may have been deleted, or the link is wrong." : loadError?.message || undefined}
        onRetry={status === 404 || status === 403 ? undefined : load}
      />
    );
  }

  const stage = normalizeStage(item.stage);
  const clientId = idOf(item.customerId);
  const clientName = item.customerId?.companyName;
  const stageIndex = OPEN_DEAL_STAGES.indexOf(stage);

  const changeStage = async (next) => {
    if (next === stage || busy) return;
    setBusy(true);
    try {
      await updateDeal(item._id, { stage: next });
      toast.success(`Stage moved to ${DEAL_STAGE_LABEL[next]}.`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "The stage didn't change. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const more = [
    { key: "refresh", label: "Refresh", icon: RefreshCw, onSelect: load },
    clientId && canEnroll ? { key: "enroll", label: "Confirm delivery agreement", icon: BookPlus, onSelect: () => { setEnrollCustomerId(clientId); setEnrollAfterConversion(false); setEnrollOpen(true); } } : null,
    canDelete ? { key: "sep", separator: true } : null,
    canDelete ? { key: "delete", label: "Delete deal", icon: Trash2, tone: "muted", onSelect: () => setDeleteOpen(true) } : null,
  ];

  return (
    <>
      <div className="px-stack" style={{ gap: 20 }}>
        <header className="px-record-head">
          <div className="px-record-id">
            <div className="px-record-tags">
              <Badge tone={DEAL_STAGE_TONE[stage] || "neutral"} dot>
                {DEAL_STAGE_LABEL[stage] || stage}
              </Badge>
              {item.probability ? <span className="px-code">{item.probability}% likely</span> : null}
            </div>
            <h1>{item.title || "Untitled deal"}</h1>
            <ul className="px-record-meta" aria-label="Deal summary">
              <li>
                <CircleDollarSign size={15} aria-hidden="true" />
                {money(item.value, item.currency) || "No value set"}
              </li>
              {item.accountId?._id ? (
                <li>
                  <Building2 size={15} aria-hidden="true" />
                  <Link to={`/portal/crm/accounts/${item.accountId._id}`}>{item.accountId.name || "Account"}</Link>
                </li>
              ) : null}
              <li>
                <span className="px-muted">Owner</span>
                {ownerName(item) || "Unassigned"}
              </li>
            </ul>
          </div>
          <div className="px-record-actions">
            {canWrite ? (
              <Button variant="outline" onClick={() => setEditOpen(true)} disabled={busy}>
                <Pencil size={15} aria-hidden="true" />
                Edit
              </Button>
            ) : null}
            {/* A converted deal never offers conversion again: the endpoint has no
                once-only guard of its own (see remediation P2-2). */}
            {clientId ? (
              canOpenClient ? (
                <Link className="px-btn" to={`/portal/customers/${clientId}`}>
                  <ExternalLink size={15} aria-hidden="true" />
                  Open client
                </Link>
              ) : null
            ) : canWrite && stage === "won" ? (
              <Button onClick={() => setConvertOpen(true)} disabled={busy}>
                <Building2 size={15} aria-hidden="true" />
                Convert to client
              </Button>
            ) : null}
            <RowActions label={item.title || "deal"} actions={more} />
          </div>
        </header>

        {clientId ? (
          <Alert tone="info" icon={Building2} title="Converted to a client">
            {`${clientName || "A client account"} is linked to this deal${item.convertedAt ? ` since ${formatDate(item.convertedAt)}` : ""}.`}
          </Alert>
        ) : canWrite && stage !== "won" ? (
          <Alert tone="info" title="Converting to a client">
            Once the deal is won, it can be converted into a client account.
          </Alert>
        ) : null}

        <div>
          <TabBar idPrefix="deal" label="Deal sections" value={tab} onChange={setTab} tabs={TABS} />
          <TabPanel idPrefix="deal" id={tab} className="px-tabpanel--spaced">
            {tab === "overview" ? (
              <div className="px-grid px-cols-detail">
                <div className="px-stack">
                  <Panel title="Stage" sub={stage === "won" || stage === "lost" ? "This deal is closed" : `${stageIndex + 1} of ${OPEN_DEAL_STAGES.length} open stages`}>
                    <div className="px-stage-track" style={{ "--px-stage-n": OPEN_DEAL_STAGES.length }} data-outcome={stage === "won" || stage === "lost" ? stage : undefined} aria-hidden="true">
                      {OPEN_DEAL_STAGES.map((s, i) => (
                        <span key={s} data-on={stage === "won" || stage === "lost" ? "true" : String(i <= stageIndex)} />
                      ))}
                    </div>
                    {canWrite ? (
                      <div style={{ marginTop: 14, maxWidth: 320 }}>
                        <SelectField
                          label="Move to stage"
                          value={stage}
                          disabled={busy}
                          onChange={changeStage}
                          options={DEAL_STAGES.map((s) => ({ value: s, label: DEAL_STAGE_LABEL[s] }))}
                        />
                      </div>
                    ) : null}
                  </Panel>
                  <Panel title="Notes" sub="Internal">
                    {item.notes ? <p className="px-prose">{item.notes}</p> : <p className="px-muted" style={{ margin: 0 }}>No notes yet.</p>}
                  </Panel>
                </div>
                <div className="px-stack">
                  <Panel title="Commercial">
                    <KeyValue
                      className="px-kv--side"
                      items={[
                        { label: "Value", value: money(item.value, item.currency) },
                        { label: "Probability", value: item.probability || item.probability === 0 ? `${item.probability}%` : null },
                        { label: "Expected close", value: formatDate(item.expectedCloseDate) },
                        { label: "Source", value: item.source ? leadSourceLabel(item.source) : null },
                        { label: "Won", value: formatDate(item.wonAt), hidden: !item.wonAt },
                        { label: "Lost", value: formatDate(item.lostAt), hidden: !item.lostAt },
                      ]}
                    />
                  </Panel>
                  <Panel title="Linked records">
                    <KeyValue
                      className="px-kv--side"
                      items={[
                        { label: "Client", value: clientId ? (canOpenClient ? <Link to={`/portal/customers/${clientId}`}>{clientName || "Client"}</Link> : clientName || "Client") : "Not converted yet" },
                        { label: "Account", value: item.accountId?._id ? <Link to={`/portal/crm/accounts/${item.accountId._id}`}>{item.accountId.name || "Account"}</Link> : null },
                        { label: "Contact", value: item.contactId?._id ? <Link to={`/portal/crm/contacts/${item.contactId._id}`}>{item.contactId.fullName || "Contact"}</Link> : null },
                        { label: "Lead", value: item.leadId?._id ? <Link to={`/portal/crm/leads/${item.leadId._id}`}>{item.leadId.fullName || "Lead"}</Link> : null },
                      ]}
                    />
                  </Panel>
                </div>
              </div>
            ) : null}
            {tab === "activity" ? <CrmActivityPanel entityType="deal" entityId={item._id} canWrite={canWrite} canDelete={canDelete} /> : null}
          </TabPanel>
        </div>
      </div>

      {canWrite ? (
        <>
          <DealFormModal
            open={editOpen}
            mode="edit"
            initial={item}
            busy={busy}
            onClose={() => setEditOpen(false)}
            onSubmit={async (payload) => {
              setBusy(true);
              try {
                await updateDeal(item._id, payload);
                toast.success("Deal updated.");
                setEditOpen(false);
                await load();
              } catch (e) {
                toast.error(e?.response?.data?.message || "The changes weren't saved. Try again.");
              } finally {
                setBusy(false);
              }
            }}
          />
          <ConfirmDialog
            open={convertOpen}
            icon={Building2}
            tone="info"
            title="Convert this won deal to a client?"
            confirmLabel="Convert to client"
            onClose={() => setConvertOpen(false)}
            onConfirm={async () => {
              try {
                const res = await convertDealToCustomer(item._id);
                const customerId = res?.customer?._id;
                toast.success(`${res?.customer?.companyName || "The client"} is linked to this deal.`);
                setConvertOpen(false);
                await load();
                if (customerId && canEnroll) {
                  setEnrollCustomerId(customerId);
                  setEnrollAfterConversion(true);
                  setEnrollOpen(true);
                }
              } catch (e) {
                toast.error(conversionError(e, "deal"));
                setConvertOpen(false);
                await load();
              }
            }}
            details={[...DEAL_CONVERSION_DETAILS, ...(canEnroll ? ["Afterwards you can enroll the client in a service, or skip that for now."] : [])]}
          >
            {item.title}
          </ConfirmDialog>
        </>
      ) : null}

      {canEnroll ? (
        <CreateEnrollmentModal
          open={enrollOpen}
          initialCustomerId={enrollCustomerId}
          handoff
          cancelLabel={enrollAfterConversion ? "Skip, go to the client" : "Cancel"}
          busy={enrollBusy}
          onClose={() => {
            setEnrollOpen(false);
            if (enrollAfterConversion && enrollCustomerId && canOpenClient) {
              setEnrollAfterConversion(false);
              nav(`/portal/customers/${enrollCustomerId}`);
            }
          }}
          onSubmit={async (payload) => {
            setEnrollBusy(true);
            try {
              const res = await createEnrollment({ ...payload, status: "draft", sourceDealId: item._id, accountOwnerId: idOf(item.ownerUserId), pricing: { price: item.value, currency: item.currency } });
              toast.success("Enrollment created.");
              setEnrollOpen(false);
              const enrollmentId = res?.item?._id || res?._id;
              nav(enrollmentId ? `/portal/enrollments/${enrollmentId}` : `/portal/customers/${enrollCustomerId}`);
            } catch (e) {
              toast.error(e?.response?.data?.message || "The enrollment wasn't created. Try again.");
            } finally {
              setEnrollBusy(false);
            }
          }}
        />
      ) : null}

      {canDelete ? (
        <ConfirmDialog
          open={deleteOpen}
          icon={Trash2}
          tone="bad"
          danger
          title="Delete this deal permanently?"
          confirmLabel="Delete deal"
          onClose={() => setDeleteOpen(false)}
          onConfirm={async () => {
            try {
              await deleteDeal(item._id);
              toast.success("Deal deleted.");
              nav("/portal/crm/deals");
            } catch (e) {
              toast.error(e?.response?.data?.message || "The deal wasn't deleted. Try again.");
            }
          }}
          details={[
            "The deal is erased and can't be restored.",
            "Its lead, account, contacts and activities are not deleted.",
            ...(clientId ? ["The client converted from it stays, with a link to a deal that no longer exists."] : []),
          ]}
        >
          {item.title}
        </ConfirmDialog>
      ) : null}
    </>
  );
}
