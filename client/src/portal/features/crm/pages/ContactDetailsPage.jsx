import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Activity, Briefcase, Building2, Mail, MessageCircle, Pencil, Phone, RefreshCw, Star, Trash2, UserRound } from "lucide-react";

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

import { getContact, updateContact, deleteContact } from "../api";
import { leadSourceLabel, ownerName } from "../format";
import { formatDate } from "../../projects/format";
import ContactFormModal from "../components/ContactFormModal";
import CrmActivityPanel from "../components/CrmActivityPanel";

const TABS = [
  { id: "overview", label: "Overview", icon: UserRound },
  { id: "activity", label: "Activity", icon: Activity },
];

// CRM contact detail (PUI-3).
export default function ContactDetailsPage() {
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
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  usePageCrumbs(item ? [{ label: "CRM", to: "/portal/crm" }, { label: "Contacts", to: "/portal/crm/contacts" }, { label: item.fullName || "Contact" }] : []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getContact(id);
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

  if (loading && !item) return <LoadingState rows={5} label="Loading contact" />;
  if (loadError || !item) {
    const status = loadError?.status;
    return (
      <ErrorState
        title={status === 404 ? "Contact not found" : status === 403 ? "You don't have access to the CRM" : "This contact didn't load"}
        message={status === 404 ? "It may have been deleted, or the link is wrong." : loadError?.message || undefined}
        onRetry={status === 404 || status === 403 ? undefined : load}
      />
    );
  }

  const whatsapp = item.whatsapp ? `https://wa.me/${String(item.whatsapp).replace(/[^\d]/g, "")}` : "";
  const more = [
    { key: "refresh", label: "Refresh", icon: RefreshCw, onSelect: load },
    canDelete ? { key: "sep", separator: true } : null,
    canDelete ? { key: "delete", label: "Delete contact", icon: Trash2, tone: "muted", onSelect: () => setDeleteOpen(true) } : null,
  ];

  return (
    <>
      <div className="px-stack" style={{ gap: 20 }}>
        <header className="px-record-head">
          <div className="px-record-id">
            <div className="px-record-tags">
              {item.isPrimary ? (
                <Badge tone="info">
                  <Star size={11} aria-hidden="true" />
                  Primary contact
                </Badge>
              ) : (
                <span className="px-code">Contact</span>
              )}
            </div>
            <h1>{item.fullName || "Unnamed contact"}</h1>
            <ul className="px-record-meta" aria-label="Contact details">
              {item.jobTitle ? (
                <li>
                  <Briefcase size={15} aria-hidden="true" />
                  {item.jobTitle}
                </li>
              ) : null}
              {item.accountId?._id ? (
                <li>
                  <Building2 size={15} aria-hidden="true" />
                  <Link to={`/portal/crm/accounts/${item.accountId._id}`}>{item.accountId.name || "Account"}</Link>
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
                  <a href={`tel:${item.phone}`}>{item.phone}</a>
                </li>
              ) : null}
              {whatsapp ? (
                <li>
                  <MessageCircle size={15} aria-hidden="true" />
                  <a href={whatsapp} target="_blank" rel="noreferrer">
                    WhatsApp<span className="sr-only"> (opens in a new tab)</span>
                  </a>
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
            <RowActions label={item.fullName || "contact"} actions={more} />
          </div>
        </header>

        <div>
          <TabBar idPrefix="contact" label="Contact sections" value={tab} onChange={setTab} tabs={TABS} />
          <TabPanel idPrefix="contact" id={tab} className="px-tabpanel--spaced">
            {tab === "overview" ? (
              <div className="px-grid px-cols-detail">
                <div className="px-stack">
                  <Panel title="Notes" sub="Internal">
                    {item.notes ? <p className="px-prose">{item.notes}</p> : <p className="px-muted" style={{ margin: 0 }}>No notes yet.</p>}
                  </Panel>
                </div>
                <div className="px-stack">
                  <Panel title="Linked records">
                    <KeyValue
                      className="px-kv--side"
                      items={[
                        { label: "Account", value: item.accountId?._id ? <Link to={`/portal/crm/accounts/${item.accountId._id}`}>{item.accountId.name || "Account"}</Link> : null },
                        {
                          label: "Client",
                          value: item.customerId?._id ? (access.canOpen("/portal/customers") ? <Link to={`/portal/customers/${item.customerId._id}`}>{item.customerId.companyName || "Client"}</Link> : item.customerId.companyName) : null,
                        },
                        { label: "Lead", value: item.leadId?._id ? <Link to={`/portal/crm/leads/${item.leadId._id}`}>{item.leadId.fullName || "Lead"}</Link> : null },
                        { label: "Source", value: item.source ? leadSourceLabel(item.source) : null },
                        { label: "Owner", value: ownerName(item) || "Unassigned" },
                        { label: "Added", value: formatDate(item.createdAt) },
                      ]}
                    />
                  </Panel>
                </div>
              </div>
            ) : null}
            {tab === "activity" ? <CrmActivityPanel entityType="contact" entityId={item._id} canWrite={canWrite} canDelete={canDelete} /> : null}
          </TabPanel>
        </div>
      </div>

      {canWrite ? (
        <ContactFormModal
          open={editOpen}
          mode="edit"
          initial={item}
          busy={busy}
          onClose={() => setEditOpen(false)}
          onSubmit={async (payload) => {
            setBusy(true);
            try {
              await updateContact(item._id, payload);
              toast.success("Contact updated.");
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
          title="Delete this contact permanently?"
          confirmLabel="Delete contact"
          onClose={() => setDeleteOpen(false)}
          onConfirm={async () => {
            try {
              await deleteContact(item._id);
              toast.success("Contact deleted.");
              nav("/portal/crm/contacts");
            } catch (e) {
              toast.error(e?.response?.data?.message || "The contact wasn't deleted. Try again.");
            }
          }}
          details={["The contact is erased and can't be restored.", "Deals that name this contact keep a link to a contact that no longer exists."]}
        >
          {item.fullName}
        </ConfirmDialog>
      ) : null}
    </>
  );
}
