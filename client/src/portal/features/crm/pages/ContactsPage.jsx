import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, Pencil, Plus, RefreshCw, SearchX, Star, Trash2, UserRound, X } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import SearchField from "../../../shared/ui/SearchField";
import SelectField from "../../../shared/ui/SelectField";
import SortHeader from "../../../shared/ui/SortHeader";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import Pagination from "../../../shared/ui/Pagination";
import RowActions from "../../../shared/ui/RowActions";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { listContacts, createContact, updateContact, deleteContact } from "../api";
import ContactFormModal from "../components/ContactFormModal";

const LIMIT = 15;
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "fullName", label: "Name, A to Z" },
  { value: "-fullName", label: "Name, Z to A" },
  { value: "email", label: "Email, A to Z" },
  { value: "-updatedAt", label: "Recently updated" },
];

// CRM contacts (PUI-3): searched and paged on the server. The old page loaded
// the first 100 contacts and searched those in the browser.
export default function ContactsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("crm.write");
  const canDelete = access.can("crm.delete");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listContacts({ q: dq.trim(), sort, page, limit: LIMIT });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, sort, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [dq]);

  const setSortReset = (v) => {
    setSort(v);
    setPage(1);
  };

  const save = async (fn, ok, after) => {
    setBusy(true);
    try {
      const res = await fn();
      toast.success(ok);
      after?.(res);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "That didn't save. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  let content;
  if (error) content = <ErrorState title="Contacts didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = dq.trim() ? (
      <EmptyState icon={SearchX} title="No contacts match this search" message="Try another name, email or phone number." action={<Button variant="outline" onClick={() => setQ("")}>Clear search</Button>} />
    ) : (
      <EmptyState icon={UserRound} title="No contacts yet" message="Contacts are people at your accounts and clients. They are also created when leads and deals are converted." action={canWrite ? <Button onClick={() => setCreateOpen(true)}><Plus size={14} aria-hidden="true" />New contact</Button> : null} />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Contacts" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <SortHeader label="Name" field="fullName" sort={sort} onSort={setSortReset} />
              <th scope="col">Account</th>
              <SortHeader label="Email" field="email" sort={sort} onSort={setSortReset} />
              <th scope="col" className="px-hide-tab">Phone</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={5} label="Loading contacts" />
            ) : (
              items.map((c) => {
                const actions = [
                  { key: "open", label: "Open contact", icon: ExternalLink, onSelect: () => nav(`/portal/crm/contacts/${c._id}`) },
                  canWrite ? { key: "edit", label: "Edit contact", icon: Pencil, onSelect: () => setEditing(c) } : null,
                  canDelete ? { key: "sep", separator: true } : null,
                  canDelete ? { key: "delete", label: "Delete contact", icon: Trash2, tone: "muted", onSelect: () => setRemoving(c) } : null,
                ];
                return (
                  <tr key={c._id} data-clickable="true" onClick={(e) => !e.target.closest("a, button, [role='menu']") && nav(`/portal/crm/contacts/${c._id}`)}>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <Link to={`/portal/crm/contacts/${c._id}`}>{c.fullName || "Unnamed contact"}</Link>
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {c.jobTitle || "No job title"}
                          {c.isPrimary ? (
                            <Badge tone="info">
                              <Star size={11} aria-hidden="true" />
                              Primary
                            </Badge>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td data-label="Account">
                      {c.accountId?._id ? <Link to={`/portal/crm/accounts/${c.accountId._id}`}>{c.accountId.name || "Account"}</Link> : c.customerId?.companyName || <span className="px-muted">None</span>}
                    </td>
                    <td data-label="Email">{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : <span className="px-muted">—</span>}</td>
                    <td data-label="Phone" className="px-hide-tab">{c.phone || <span className="px-muted">—</span>}</td>
                    <td className="px-actions-cell">
                      <RowActions label={c.fullName || "contact"} actions={actions} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun={meta.total === 1 ? "contact" : "contacts"} label="Contacts pages" /> : null}
      </>
    );

  return (
    <>
      <PageFrame
        title="Contacts"
        description="People at your accounts and clients."
        breadcrumb={[{ label: "CRM", to: "/portal/crm" }, { label: "Contacts" }]}
        secondaryActions={<Button variant="outline" onClick={load} disabled={loading}><RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />Refresh</Button>}
        primaryAction={canWrite ? <Button onClick={() => setCreateOpen(true)} disabled={busy}><Plus size={14} aria-hidden="true" />New contact</Button> : null}
      >
        <Panel flush bare label="Contact list" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Filter contacts">
            <SearchField label="Search contacts" value={q} onChange={setQ} placeholder="Name, email, phone or job title" />
            <SelectField label="Sort by" value={sort} onChange={setSortReset} options={SORT_OPTIONS.some((o) => o.value === sort) ? SORT_OPTIONS : [...SORT_OPTIONS, { value: sort, label: "Custom" }]} />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading contacts…" : error ? "Contacts unavailable" : `${meta.total} contact${meta.total === 1 ? "" : "s"}`}</span>
            {dq.trim() ? (
              <div className="px-active-filters">
                <button type="button" className="px-filter-chip" onClick={() => setQ("")} aria-label={`Remove filter Search: ${dq.trim()}`}>
                  Search: {dq.trim()}
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>
          {content}
        </Panel>
      </PageFrame>

      {canWrite ? (
        <>
          <ContactFormModal open={createOpen} busy={busy} onClose={() => setCreateOpen(false)} onSubmit={(p) => save(() => createContact(p), "Contact created.", () => setCreateOpen(false))} />
          <ContactFormModal open={Boolean(editing)} mode="edit" initial={editing} busy={busy} onClose={() => setEditing(null)} onSubmit={(p) => save(() => updateContact(editing._id, p), "Contact updated.", () => setEditing(null))} />
        </>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          open={Boolean(removing)}
          icon={Trash2}
          tone="bad"
          danger
          title="Delete this contact permanently?"
          confirmLabel="Delete contact"
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            try {
              await deleteContact(removing._id);
              toast.success("Contact deleted.");
              setRemoving(null);
              await load();
            } catch (e) {
              toast.error(e?.response?.data?.message || "The contact wasn't deleted. Try again.");
            }
          }}
          details={["The contact is erased and can't be restored.", "Deals that name this contact keep a link to a contact that no longer exists."]}
        >
          {removing?.fullName}
        </ConfirmDialog>
      ) : null}
    </>
  );
}
