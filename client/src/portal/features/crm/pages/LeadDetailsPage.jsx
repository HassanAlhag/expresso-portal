import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Activity, ArrowRightCircle, Building2, CircleCheck, Mail, Pencil, Phone, RefreshCw, Trash2, UserRound } from "lucide-react";

import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { usePageCrumbs } from "../../../layouts/ShellContext";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Panel from "../../../shared/ui/Panel";
import KeyValue from "../../../shared/ui/KeyValue";
import Alert from "../../../shared/ui/Alert";
import RowActions from "../../../shared/ui/RowActions";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import TabBar, { TabPanel } from "../../../shared/ui/TabBar";

import { getLead, updateLead, deleteLead, convertLeadToDeal } from "../api";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE, DEAL_STAGE_LABEL, leadSourceLabel, money, normalizeStage, ownerName } from "../format";
import { LEAD_CONVERSION_DETAILS, conversionError } from "../lib/convert";
import { formatDate } from "../../projects/format";
import LeadFormModal from "../components/LeadFormModal";
import CrmActivityPanel from "../components/CrmActivityPanel";

const TABS = [
  { id: "overview", label: "Overview", icon: UserRound },
  { id: "activity", label: "Activity", icon: Activity },
];

// Lead detail (PUI-3).
export default function LeadDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("crm.write");
  const canDelete = access.can("crm.delete");

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  // A ref, not state: two clicks in the same frame must not convert twice
  // (the endpoint's own duplicate check is not race-proof; remediation P2-2).
  const converting = useRef(false);
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertTitle, setConvertTitle] = useState("");
  const [convertValue, setConvertValue] = useState("");
  const [convertError, setConvertError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  usePageCrumbs(item ? [{ label: "CRM", to: "/portal/crm" }, { label: "Leads", to: "/portal/crm/leads" }, { label: item.fullName || "Lead" }] : []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getLead(id);
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

  const converted = item?.status === "converted";
  const deal = item?.convertedDealId && typeof item.convertedDealId === "object" ? item.convertedDealId : null;
  const defaultTitle = useMemo(() => (item ? `${item.companyName || item.fullName} opportunity` : ""), [item]);

  if (loading && !item) return <LoadingState rows={6} label="Loading lead" />;
  if (loadError || !item) {
    const status = loadError?.status;
    return (
      <ErrorState
        title={status === 404 ? "Lead not found" : status === 403 ? "You don't have access to the CRM" : "This lead didn't load"}
        message={status === 404 ? "It may have been deleted, or the link is wrong." : loadError?.message || undefined}
        onRetry={status === 404 || status === 403 ? undefined : load}
      />
    );
  }

  const openConvert = () => {
    setConvertTitle(defaultTitle);
    setConvertValue("");
    setConvertError("");
    setConvertOpen(true);
  };

  const convert = async () => {
    if (busy || converting.current) return;
    converting.current = true;
    setBusy(true);
    setConvertError("");
    try {
      const res = await convertLeadToDeal(item._id, { title: convertTitle.trim(), value: convertValue ? Number(convertValue) : 0 });
      toast.success("Lead converted. The new deal is open.");
      setConvertOpen(false);
      const dealId = res?.item?._id;
      if (dealId) nav(`/portal/crm/deals/${dealId}`);
      else await load();
    } catch (e) {
      setConvertError(conversionError(e, "lead"));
    } finally {
      converting.current = false;
      setBusy(false);
    }
  };

  const more = [
    { key: "refresh", label: "Refresh", icon: RefreshCw, onSelect: load },
    canDelete ? { key: "sep", separator: true } : null,
    canDelete ? { key: "delete", label: "Delete lead", icon: Trash2, tone: "muted", onSelect: () => setDeleteOpen(true) } : null,
  ];

  return (
    <>
      <div className="px-stack" style={{ gap: 20 }}>
        <header className="px-record-head">
          <div className="px-record-id">
            <div className="px-record-tags">
              <Badge tone={LEAD_STATUS_TONE[item.status] || "neutral"} dot>
                {LEAD_STATUS_LABEL[item.status] || item.status || "New"}
              </Badge>
              <span className="px-code">Lead from {leadSourceLabel(item.source)}</span>
            </div>
            <h1>{item.fullName || "Unnamed lead"}</h1>
            <ul className="px-record-meta" aria-label="Lead contact">
              <li>
                <Building2 size={15} aria-hidden="true" />
                {item.companyName || "No company"}
              </li>
              {item.email ? (
                <li>
                  <Mail size={15} aria-hidden="true" />
                  <a href={`mailto:${item.email}`}>{item.email}</a>
                </li>
              ) : null}
              {item.phone ? (
                <li>
                  <Phone size={15} aria-hidden="true" />
                  {item.phone}
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
            {canWrite && !converted ? (
              <Button onClick={openConvert} disabled={busy}>
                <ArrowRightCircle size={15} aria-hidden="true" />
                Convert to deal
              </Button>
            ) : null}
            <RowActions label={item.fullName || "lead"} actions={more} />
          </div>
        </header>

        {converted ? (
          <Alert
            tone="info"
            icon={CircleCheck}
            title="This lead has been converted"
            action={deal?._id ? <Link className="px-btn px-btn--sm" to={`/portal/crm/deals/${deal._id}`}>Open deal</Link> : null}
          >
            {deal
              ? `Deal: ${deal.title || "Untitled"}, ${DEAL_STAGE_LABEL[normalizeStage(deal.stage)] || deal.stage}${deal.value ? `, ${money(deal.value, deal.currency)}` : ""}.`
              : "Its deal is no longer available."}
            {item.convertedAt ? ` Converted ${formatDate(item.convertedAt)}.` : ""}
          </Alert>
        ) : null}

        <div>
          <TabBar idPrefix="lead" label="Lead sections" value={tab} onChange={setTab} tabs={TABS} />
          <TabPanel idPrefix="lead" id={tab} className="px-tabpanel--spaced">
            {tab === "overview" ? (
              <div className="px-grid px-cols-detail">
                <div className="px-stack">
                  <Panel title="Interest">
                    <KeyValue
                      items={[
                        { label: "Service", value: item.service },
                        { label: "Source", value: leadSourceLabel(item.source) },
                        { label: "Company", value: item.companyName },
                      ]}
                    />
                  </Panel>
                  <Panel title="Notes" sub="Internal">
                    {item.notes ? <p className="px-prose">{item.notes}</p> : <p className="px-muted" style={{ margin: 0 }}>No notes yet.</p>}
                  </Panel>
                </div>
                <div className="px-stack">
                  <Panel title="Ownership">
                    <KeyValue
                      className="px-kv--side"
                      items={[
                        { label: "Owner", value: ownerName(item) || "Unassigned" },
                        { label: "Created", value: formatDate(item.createdAt) },
                        { label: "Updated", value: formatDate(item.updatedAt) },
                        {
                          label: "Account",
                          value: item.convertedToAccountId?._id ? <Link to={`/portal/crm/accounts/${item.convertedToAccountId._id}`}>{item.convertedToAccountId.name || "Account"}</Link> : null,
                          hidden: !item.convertedToAccountId,
                        },
                      ]}
                    />
                  </Panel>
                </div>
              </div>
            ) : null}
            {tab === "activity" ? <CrmActivityPanel entityType="lead" entityId={item._id} canWrite={canWrite} canDelete={canDelete} /> : null}
          </TabPanel>
        </div>
      </div>

      {canWrite ? (
        <>
          <LeadFormModal
            open={editOpen}
            mode="edit"
            initial={item}
            busy={busy}
            onClose={() => setEditOpen(false)}
            onSubmit={async (payload) => {
              setBusy(true);
              try {
                await updateLead(item._id, payload);
                toast.success("Lead updated.");
                setEditOpen(false);
                await load();
              } catch (e) {
                toast.error(e?.response?.data?.message || "The changes weren't saved. Try again.");
              } finally {
                setBusy(false);
              }
            }}
          />
          <FormDialog
            open={convertOpen}
            title="Convert this lead to a deal?"
            description={`${item.fullName}${item.companyName ? `, ${item.companyName}` : ""}`}
            onClose={() => setConvertOpen(false)}
            onSubmit={convert}
            busy={busy}
            canSubmit={Boolean(convertTitle.trim())}
            submitLabel="Convert to deal"
            submitIcon={ArrowRightCircle}
            error={convertError}
          >
            <fieldset className="px-form-section">
              <legend>The new deal</legend>
              <div className="px-form-grid px-form-grid--2">
                <TextField label="Deal title" required value={convertTitle} onChange={(e) => setConvertTitle(e.target.value)} />
                <TextField label="Value (AED)" inputMode="decimal" value={convertValue} onChange={(e) => setConvertValue(e.target.value)} hint="Optional." />
              </div>
              <ul className="px-hint" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4, fontSize: 13.5, listStyle: "disc" }}>
                {LEAD_CONVERSION_DETAILS.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </fieldset>
          </FormDialog>
        </>
      ) : null}

      {canDelete ? (
        <ConfirmDialog
          open={deleteOpen}
          icon={Trash2}
          tone="bad"
          danger
          title="Delete this lead permanently?"
          confirmLabel="Delete lead"
          onClose={() => setDeleteOpen(false)}
          onConfirm={async () => {
            try {
              await deleteLead(item._id);
              toast.success("Lead deleted.");
              nav("/portal/crm/leads");
            } catch (e) {
              toast.error(e?.response?.data?.message || "The lead wasn't deleted. Try again.");
            }
          }}
          details={["The lead is erased and can't be restored.", "Deals, accounts, contacts and activities created from it are not deleted."]}
        >
          {item.fullName}
        </ConfirmDialog>
      ) : null}
    </>
  );
}
