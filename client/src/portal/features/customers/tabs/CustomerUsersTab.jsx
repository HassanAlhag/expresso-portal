import React, { useCallback, useEffect, useState } from "react";
import { Trash2, UserPlus, Users } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import RowActions from "../../../shared/ui/RowActions";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import FormDialog from "../../../shared/ui/FormDialog";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import { useToast } from "../../../shared/ui/Toast";
import { listCustomerUsers, createCustomerUser } from "../api";
import { deleteUser } from "../../iam/users/api";
import { formatDate } from "../../projects/format";

export const CLIENT_ROLE_OPTIONS = [
  { value: "client", label: "Client", hint: "Projects, files, billing and tickets" },
  { value: "staff_client", label: "Staff client", hint: "Projects, files, billing and messages" },
  { value: "client_admin", label: "Client admin", hint: "Everything above, plus procurement and brand kit" },
  { value: "procurement_client", label: "Procurement client", hint: "Procurement, files, billing and tickets" },
];
const roleLabel = (r) => CLIENT_ROLE_OPTIONS.find((o) => o.value === r)?.label || String(r || "").replaceAll("_", " ");
const EMPTY = { email: "", fullName: "", tempPassword: "", role: "client" };

// The client's portal users (PUI-3). Listing needs customers.read (the API
// limits client users to their own company); adding needs customers.write;
// removing an account needs iam.users.delete.
export default function CustomerUsersTab({ customer, canAdd = false, canRemove = false }) {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    if (!customer?._id) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await listCustomerUsers(customer._id);
      setUsers(Array.isArray(res?.users) ? res.users : []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [customer?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    setSaving(true);
    setFormError("");
    try {
      await createCustomerUser(customer._id, { ...form, email: form.email.trim(), fullName: form.fullName.trim() });
      toast.success("Portal user added.");
      setAdding(false);
      await load();
    } catch (e) {
      setFormError(e?.response?.data?.message || "The user wasn't added. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    const u = removing;
    try {
      await deleteUser(u._id);
      toast.success(`${u.fullName || u.email} removed.`);
    } catch (e) {
      // Known issue (remediation P1-2): removing a client-linked account can
      // report an error after the account was removed. Reload to show the truth.
      toast.error(e?.response?.data?.message || "The server reported a problem. The list has been refreshed to show the current state.");
    } finally {
      setRemoving(null);
      await load();
    }
  };

  const action = canAdd ? (
    <Button
      size="sm"
      onClick={() => {
        setForm(EMPTY);
        setFormError("");
        setAdding(true);
      }}
    >
      <UserPlus size={14} aria-hidden="true" />
      Add user
    </Button>
  ) : null;

  let content;
  if (failed) content = <ErrorState title="Users didn't load" onRetry={load} />;
  else if (!loading && !users.length)
    content = <EmptyState icon={Users} title="No portal users yet" message="People at this company who can sign in to the client portal appear here." action={action} />;
  else
    content = (
      <Panel title="Portal users" sub={loading ? undefined : `${users.filter((u) => u.isActive).length} of ${users.length} active`} flush action={action}>
        <table className="px-table px-table--stack" aria-label="Portal users" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <th scope="col">Person</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col" className="px-hide-tab">Last sign-in</th>
              {canRemove ? (
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={3} cols={canRemove ? 5 : 4} label="Loading users" />
            ) : (
              users.map((u) => (
                <tr key={u._id}>
                  <td className="px-primary">
                    <div className="px-cell-main">
                      <b>{u.fullName || u.email}</b>
                      <span>{u.email}</span>
                    </div>
                  </td>
                  <td data-label="Role">{roleLabel(u.role)}</td>
                  <td data-label="Status">
                    <span>
                      <Badge tone={u.isActive ? "ok" : "neutral"} dot={Boolean(u.isActive)}>
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </span>
                  </td>
                  <td data-label="Last sign-in" className="px-hide-tab px-num">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : <span className="px-muted">Never</span>}
                  </td>
                  {canRemove ? (
                    <td className="px-actions-cell">
                      <RowActions
                        label={u.fullName || u.email}
                        actions={[{ key: "remove", label: "Remove account", icon: Trash2, onSelect: () => setRemoving(u) }]}
                      />
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
      <FormDialog
        open={adding}
        title="Add a portal user"
        description={`Creates a client portal account linked to ${customer?.companyName || "this client"}.`}
        onClose={() => setAdding(false)}
        onSubmit={add}
        busy={saving}
        canSubmit={Boolean(form.email.trim()) && form.tempPassword.length >= 8}
        submitLabel="Add user"
        submitIcon={UserPlus}
        error={formError}
      >
        <fieldset className="px-form-section">
          <legend>Person</legend>
          <div className="px-form-grid px-form-grid--2">
            <TextField label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <TextField label="Full name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          </div>
          <SelectField
            label="Portal role"
            value={form.role}
            onChange={(v) => setForm((f) => ({ ...f, role: v }))}
            options={CLIENT_ROLE_OPTIONS.map((o) => ({ value: o.value, label: `${o.label}: ${o.hint}` }))}
          />
          <TextField
            label="Temporary password"
            type="password"
            required
            autoComplete="new-password"
            value={form.tempPassword}
            onChange={(e) => setForm((f) => ({ ...f, tempPassword: e.target.value }))}
            hint="At least 8 characters. Share it securely."
          />
        </fieldset>
      </FormDialog>
      <ConfirmDialog
        open={Boolean(removing)}
        icon={Trash2}
        tone="bad"
        danger
        title="Remove this portal account?"
        confirmLabel="Remove account"
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        details={["The person can no longer sign in to the client portal.", "This deletes the user account and can't be undone."]}
      >
        {`${removing?.fullName || removing?.email || "This user"} (${removing?.email || ""})`}
      </ConfirmDialog>
    </>
  );
}
