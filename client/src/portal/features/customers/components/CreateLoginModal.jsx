import React, { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";

// Creates the client's main portal login (POST /customers/:id/create-login).
// The API refuses if the client already has one. Additional people are added
// from the client's Users tab.
export default function CreateLoginModal({ open, customer, onClose, onSubmit, busy }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  useEffect(() => {
    if (!open) return;
    setEmail(customer?.primaryEmail || "");
    setFullName(customer?.contactName || "");
    setTempPassword("");
  }, [open, customer]);

  const pwOk = tempPassword.trim().length >= 8;
  return (
    <FormDialog
      open={open}
      title="Create the main portal login"
      description={`For ${customer?.companyName || "this client"}. Share the temporary password securely; they should change it after signing in.`}
      onClose={onClose}
      onSubmit={() =>
        onSubmit?.({ email: email.trim(), fullName: fullName.trim() || undefined, tempPassword: tempPassword.trim() })
      }
      busy={busy}
      canSubmit={Boolean(email.trim()) && pwOk}
      submitLabel="Create login"
      submitIcon={KeyRound}
    >
      <fieldset className="px-form-section">
        <legend>Login</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <TextField
          label="Temporary password"
          type="password"
          required
          autoComplete="new-password"
          value={tempPassword}
          onChange={(e) => setTempPassword(e.target.value)}
          hint={pwOk || !tempPassword ? "At least 8 characters." : "At least 8 characters. Keep typing."}
        />
      </fieldset>
    </FormDialog>
  );
}
