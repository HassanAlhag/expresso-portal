import React, { useEffect, useState } from "react";
import Panel from "../ui/Panel";
import Button from "../ui/Button";
import { updateCustomer } from "../../features/customers/api";
import { options, identity, errorMessage } from "./api";
import { Choice } from "./AgreementEditor";
export default function AccountManagerField({ customer, onChanged }) {
  const [users, setUsers] = useState([]), [value, setValue] = useState(identity(customer.accountManagerId)), [open, setOpen] = useState(false), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { if (open) options("customer", customer._id).then((r) => setUsers(r.users)).catch((e) => setError(errorMessage(e))); }, [open, customer._id]);
  return <Panel title="Agency Account Manager" sub="Commercial relationship ownership">
    {!open ? <Button variant="outline" onClick={() => setOpen(true)}>{customer.accountManagerId ? "Change Account Manager" : "Assign Account Manager"}</Button> : <div className="px-stack">
      {error && <p role="alert">{error}</p>}
      <Choice label="Primary agency Account Manager" value={value} onChange={setValue}><option value="">Unassigned</option>{users.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</Choice>
      <Button disabled={busy} onClick={async () => { setBusy(true); try { await updateCustomer(customer._id, { accountManagerId: value || null }); await onChanged?.(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }}>Save Account Manager</Button>
    </div>}
  </Panel>;
}
