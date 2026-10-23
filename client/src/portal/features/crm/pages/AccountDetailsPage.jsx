import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Activity, Building2, ExternalLink, Globe, Handshake, Mail, Pencil, Phone, RefreshCw, Trash2, Users } from "lucide-react";

import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { usePageCrumbs } from "../../../layouts/ShellContext";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Panel from "../../../shared/ui/Panel";
import KeyValue from "../../../shared/ui/KeyValue";
import RowActions from "../../../shared/ui/RowActions";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import TabBar, { TabPanel } from "../../../shared/ui/TabBar";

import { getAccount, updateAccount, deleteAccount } from "../api";
import { ACCOUNT_STATUS_LABEL, ACCOUNT_STATUS_TONE, ownerName } from "../format";
import { formatDate } from "../../projects/format";
import AccountFormModal from "../components/AccountFormModal";
import CrmActivityPanel from "../components/CrmActivityPanel";
import AccountContactsTab from "../tabs/AccountContactsTab";
import AccountDealsTab from "../tabs/AccountDealsTab";

const href = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

// CRM account detail (PUI-3).
export default function AccountDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("crm.write");
  const canDelete = access.can("crm.delete");

  const [item, setItem] = useState(null);
  const [related, setRelated] = useState({ deals: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  usePageCrumbs(item ? [{ label: "CRM", to: "/portal/crm" }, { label: "Accounts", to: "/portal/crm/accounts" }, { label: item.name || "Account" }] : []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getAccount(id);
      setItem(res?.item || null);
      setRelated(res?.related || { deals: [] });
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

  if (loading && !item) return <LoadingState rows={6} label="Loading account" />;
  if (loadError || !item) {
    const status = loadError?.status;
    return (
      <ErrorState
        title={status === 404 ? "Account not found" : status === 403 ? "You don't have access to the CRM" : "This account didn't load"}
        message={status === 404 ? "It may have been deleted, or the link is wrong." : loadError?.message || undefined}
        onRetry={status === 404 || status === 403 ? undefined : load}
      />
    );
  }

  const client = item.customerId && typeof item.customerId === "object" ? item.customerId : null;
  const clientId = client?._id || item.customerId;
  const deals = related.deals || [];
  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "deals", label: "Deals", icon: Handshake, count: deals.length },
    { id: "activity", label: "Activity", icon: Activity },
  ];
  const more = [
    { key: "refresh", label: "Refresh", icon: RefreshCw, onSelect: load },
    canDelete ? { key: "sep", separator: true } : null,
    canDelete ? { key: "delete", label: "Delete account", icon: Trash2, tone: "muted", onSelect: () => setDeleteOpen(true) } : null,
  ];

  return (
    <>
      <div className="px-stack" style={{ gap: 20 }}>
        <header className="px-record-head">
          <div className="px-record-id">
            <div className="px-record-tags">
              <Badge tone={ACCOUNT_STATUS_TONE[item.status] || "neutral"} dot>
                {ACCOUNT_STATUS_LABEL[item.status] || item.status || "Active"}
              </Badge>
              {item.industry ? <span className="px-code">{item.industry}</span> : null}
            </div>
            <h1>{item.name || "Unnamed account"}</h1>
            <ul className="px-record-meta" aria-label="Account contact">
              {item.website ? (
                <li>
                  <Globe size={15} aria-hidden="true" />
                  <a href={href(item.website)} target="_blank" rel="noreferrer">
                    {item.website}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ) : null}
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
            {clientId && access.canOpen("/portal/customers") ? (
              <Link className="px-btn" to={`/portal/customers/${clientId}`}>
                <ExternalLink size={15} aria-hidden="true" />
                Open client
              </Link>
            ) : null}
            <RowActions label={item.name || "account"} actions={more} />
          </div>
        </header>

        <div>
          <TabBar idPrefix="account" label="Account sections" value={tab} onChange={setTab} tabs={tabs} />
          <TabPanel idPrefix="account" id={tab} className="px-tabpanel--spaced">
            {tab === "overview" ? (
              <div className="px-grid px-cols-detail">
                <div className="px-stack">
                  <Panel title="Company">
                    <KeyValue
                      items={[
                        { label: "Legal name", value: item.legalName },
                        { label: "Industry", value: item.industry },
                        { label: "Address", value: [item.address, item.city, item.country].filter(Boolean).join(", ") },
                      ]}
                    />
                  </Panel>
                  <Panel title="Notes" sub="Internal">
                    {item.notes ? <p className="px-prose">{item.notes}</p> : <p className="px-muted" style={{ margin: 0 }}>No notes yet.</p>}
                  </Panel>
                </div>
                <div className="px-stack">
                  <Panel title="Relationship">
                    <KeyValue
                      className="px-kv--side"
                      items={[
                        { label: "Client", value: client?.companyName ? (access.canOpen("/portal/customers") ? <Link to={`/portal/customers/${clientId}`}>{client.companyName}</Link> : client.companyName) : clientId ? "Linked" : "Not a client yet" },
                        { label: "Owner", value: ownerName(item) || "Unassigned" },
                        { label: "Deals", value: String(deals.length) },
                        { label: "Created", value: formatDate(item.createdAt) },
                      ]}
                    />
                  </Panel>
                </div>
              </div>
            ) : null}
            {tab === "contacts" ? <AccountContactsTab account={item} canWrite={canWrite} canDelete={canDelete} /> : null}
            {tab === "deals" ? <AccountDealsTab deals={deals} /> : null}
            {tab === "activity" ? <CrmActivityPanel entityType="account" entityId={item._id} canWrite={canWrite} canDelete={canDelete} /> : null}
          </TabPanel>
        </div>
      </div>

      {canWrite ? (
        <AccountFormModal
          open={editOpen}
          mode="edit"
          initial={item}
          busy={busy}
          onClose={() => setEditOpen(false)}
          onSubmit={async (payload) => {
            setBusy(true);
            try {
              await updateAccount(item._id, payload);
              toast.success("Account updated.");
              setEditOpen(false);
              await load();
            } catch (e) {
              toast.error(e?.response?.data?.message || "The changes weren't saved. Try again.");
            } finally {
              setBusy(false);
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
          title="Delete this account permanently?"
          confirmLabel="Delete account"
          onClose={() => setDeleteOpen(false)}
          onConfirm={async () => {
            try {
              await deleteAccount(item._id);
              toast.success("Account deleted.");
              nav("/portal/crm/accounts");
            } catch (e) {
              toast.error(e?.response?.data?.message || "The account wasn't deleted. Try again.");
            }
          }}
          details={[
            "The account is erased and can't be restored.",
            "Its contacts, deals and activities are not deleted; they lose their link to this account.",
            ...(clientId ? ["The linked client stays, with a link to an account that no longer exists."] : []),
          ]}
        >
          {item.name}
        </ConfirmDialog>
      ) : null}
    </>
  );
}
