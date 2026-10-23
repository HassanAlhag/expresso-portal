import React, { useEffect, useState } from "react";
import { Pencil, UserPlus } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import RecordPicker from "../../../shared/ui/RecordPicker";
import { useAccess } from "../../../shared/hooks/useAccess";
import { HR_DEPARTMENT_OPTIONS, STAFF_EMPLOYMENT_TYPE_OPTIONS, STAFF_STATUS_OPTIONS } from "../constants/hr.constants";
import { listStaff } from "../api";
import { listTeams } from "../../iam/teams/api";
import { listUsers } from "../../iam/users/api";
import { idOf } from "../format";

const CURRENCY_OPTIONS = ["AED", "USD", "EUR", "GBP", "SAR"].map((c) => ({ value: c, label: c }));

const EMPTY = {
  fullName: "",
  email: "",
  phone: "",
  jobTitle: "",
  department: "marketing",
  employmentType: "full_time",
  joiningDate: "",
  status: "active",
  managerStaffId: null,
  teamId: null,
  linkedUserId: null,
  monthlySalary: "",
  currency: "AED",
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
};
const ref = (v) => (v && typeof v === "object" ? v : null);

// Staff record form (PUI-4): the same fields as before, on the shared form
// dialog. The team and portal-user pickers need IAM read access; without it
// they are shown read-only and left out of the save, so nothing is cleared.
export default function StaffFormModal({ open, initial, busy, error, onClose, onSubmit }) {
  const access = useAccess();
  const canTeams = access.can("iam.teams.read");
  const canUsers = access.can("iam.users.read");
  const [form, setForm] = useState(EMPTY);
  const isEdit = Boolean(initial?._id);

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            ...EMPTY,
            ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, initial[k] ?? EMPTY[k]])),
            joiningDate: initial.joiningDate ? new Date(initial.joiningDate).toISOString().slice(0, 10) : "",
            monthlySalary: initial.monthlySalary ?? "",
            managerStaffId: ref(initial.managerStaffId),
            teamId: ref(initial.teamId),
            linkedUserId: ref(initial.linkedUserId),
          }
        : EMPTY
    );
  }, [open, initial]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const submit = () => {
    const payload = {
      ...form,
      fullName: form.fullName.trim(),
      managerStaffId: idOf(form.managerStaffId) || null,
      teamId: idOf(form.teamId) || null,
      linkedUserId: idOf(form.linkedUserId) || null,
      monthlySalary: form.monthlySalary === "" || form.monthlySalary === null ? null : Number(form.monthlySalary),
    };
    if (!canTeams) delete payload.teamId;
    if (!canUsers) delete payload.linkedUserId;
    onSubmit?.(payload);
  };

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit staff record" : "New staff record"}
      description="The employee's HR record. Only people with HR staff access can see it."
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      error={error}
      canSubmit={form.fullName.trim().length >= 2}
      submitLabel={isEdit ? "Save changes" : "Create record"}
      submitIcon={isEdit ? Pencil : UserPlus}
    >
      <fieldset className="px-form-section">
        <legend>Person</legend>
        <TextField label="Full name" required value={form.fullName} onChange={set("fullName")} hint="At least 2 characters." />
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Email" type="email" value={form.email} onChange={set("email")} />
          <TextField label="Phone" value={form.phone} onChange={set("phone")} />
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Role</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Job title" value={form.jobTitle} onChange={set("jobTitle")} />
          <SelectField label="Department" value={form.department} onChange={set("department")} options={HR_DEPARTMENT_OPTIONS.filter((o) => o.value)} />
          <SelectField label="Employment" value={form.employmentType} onChange={set("employmentType")} options={STAFF_EMPLOYMENT_TYPE_OPTIONS.filter((o) => o.value)} />
          <SelectField label="Status" value={form.status} onChange={set("status")} options={STAFF_STATUS_OPTIONS.filter((o) => o.value)} />
          <TextField label="Joining date" type="date" value={form.joiningDate} onChange={set("joiningDate")} />
        </div>
        <RecordPicker
          label="Manager"
          value={form.managerStaffId}
          onChange={set("managerStaffId")}
          load={(q) => listStaff({ q, limit: 20 }).then((r) => (r?.items || []).filter((s) => s._id !== initial?._id))}
          getLabel={(s) => s?.fullName || "Staff member"}
          getSub={(s) => [s?.jobTitle, s?.department].filter(Boolean).join(", ")}
          searchLabel="Search staff"
        />
        <div className="px-form-grid px-form-grid--2">
          {canTeams ? (
            <RecordPicker
              label="Team"
              value={form.teamId}
              onChange={set("teamId")}
              load={(q) => listTeams({ q, limit: 20, isActive: "true" }).then((r) => r?.items || r?.teams || [])}
              getLabel={(t) => t?.label || t?.key || "Team"}
              searchLabel="Search teams"
            />
          ) : (
            <TextField label="Team" value={form.teamId?.label || "Not set"} readOnly hint="Changing it needs access to teams." />
          )}
          {canUsers ? (
            <RecordPicker
              label="Portal user"
              value={form.linkedUserId}
              onChange={set("linkedUserId")}
              load={(q) => listUsers({ q, limit: 20 }).then((r) => r?.users || r?.items || [])}
              getLabel={(u) => u?.fullName || u?.email || "User"}
              getSub={(u) => u?.email}
              searchLabel="Search users"
              hint="The portal account this record belongs to."
            />
          ) : (
            <TextField label="Portal user" value={form.linkedUserId?.fullName || form.linkedUserId?.email || "Not linked"} readOnly hint="Changing it needs access to users." />
          )}
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Pay</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Monthly salary" type="number" min="0" inputMode="decimal" value={String(form.monthlySalary ?? "")} onChange={set("monthlySalary")} />
          <SelectField label="Currency" value={form.currency} onChange={set("currency")} options={CURRENCY_OPTIONS.some((o) => o.value === form.currency) ? CURRENCY_OPTIONS : [...CURRENCY_OPTIONS, { value: form.currency, label: form.currency }]} />
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Emergency contact and notes</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Emergency contact" value={form.emergencyContactName} onChange={set("emergencyContactName")} />
          <TextField label="Emergency phone" value={form.emergencyContactPhone} onChange={set("emergencyContactPhone")} />
        </div>
        <TextField label="Notes" multiline rows={3} value={form.notes} onChange={set("notes")} />
      </fieldset>
    </FormDialog>
  );
}
