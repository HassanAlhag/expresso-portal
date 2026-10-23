import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Trash2, UserPlus, Users } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import RowActions from "../../../shared/ui/RowActions";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { useToast } from "../../../shared/ui/Toast";
import { listContacts, createContact, deleteContact } from "../api";
import ContactFormModal from "../components/ContactFormModal";

// Contacts at the account (PUI-3).
export default function AccountContactsTab({ account, canWrite = false, canDelete = false }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    if (!account?._id) return;
    setState("loading");
    try {
      const res = await listContacts({ accountId: account._id, limit: 100 });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setState("ready");
    } catch {
      setState("failed");
    }
  }, [account?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const action = canWrite ? (
    <Button size="sm" onClick={() => setAdding(true)}>
      <UserPlus size={14} aria-hidden="true" />
      Add contact
    </Button>
  ) : null;

  let content;
  if (state === "failed") content = <ErrorState title="Contacts didn't load" onRetry={load} />;
  else if (state === "ready" && !items.length) content = <EmptyState icon={Users} title="No contacts yet" message="People at this company appear here." action={action} />;
  else
    content = (
      <Panel title="Contacts" sub={state === "ready" ? `${items.length} at ${account?.name || "this account"}` : undefined} flush action={action}>
        <table className="px-table px-table--stack" aria-label="Account contacts" aria-busy={state === "loading" || undefined}>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col" className="px-hide-tab">Phone</th>
              {canDelete ? <th scope="col"><span className="sr-only">Actions</span></th> : null}
            </tr>
          </thead>
          <tbody>
            {state === "loading" ? (
              <SkeletonRows rows={3} cols={canDelete ? 4 : 3} label="Loading contacts" />
            ) : (
              items.map((c) => (
                <tr key={c._id}>
                  <td className="px-primary">
                    <div className="px-cell-main">
                      <Link to={`/portal/crm/contacts/${c._id}`}>{c.fullName}</Link>
                      <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
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
                  <td data-label="Email">{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : <span className="px-muted">—</span>}</td>
                  <td data-label="Phone" className="px-hide-tab">{c.phone || <span className="px-muted">—</span>}</td>
                  {canDelete ? (
                    <td className="px-actions-cell">
                      <RowActions label={c.fullName} actions={[{ key: "delete", label: "Delete contact", icon: Trash2, onSelect: () => setRemoving(c) }]} />
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Panel>
    );

  return (
    <>
      {content}
      {canWrite ? (
        <ContactFormModal
          open={adding}
          busy={busy}
          fixed={{ accountId: account?._id }}
          context={`Adds a contact at ${account?.name || "this account"}.`}
          onClose={() => setAdding(false)}
          onSubmit={async (payload) => {
            setBusy(true);
            try {
              await createContact(payload);
              toast.success("Contact added.");
              setAdding(false);
              await load();
            } catch (e) {
              toast.error(e?.response?.data?.message || "The contact wasn't added. Try again.");
            } finally {
              setBusy(false);
            }
          }}
        />
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
