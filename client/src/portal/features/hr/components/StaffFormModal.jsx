import React, { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Select from "../../../shared/ui/Select";
import SmartSelect from "../../../shared/ui/SmartSelect";
import {
  HR_DEPARTMENT_OPTIONS,
  STAFF_EMPLOYMENT_TYPE_OPTIONS,
  STAFF_STATUS_OPTIONS,
} from "../constants/hr.constants";
import { listStaff } from "../api";
import { listTeams } from "../../iam/teams/api";
import { listUsers } from "../../iam/users/api";

const CURRENCY_OPTIONS = [
  { value: "AED", label: "AED" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "SAR", label: "SAR" },
];

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

export default function StaffFormModal({
  open,
  initial,
  busy,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY);
  const isEdit = Boolean(initial?._id);

  useEffect(() => {
    if (!open) return;

    if (initial) {
      setForm({
        ...EMPTY,
        ...initial,
        joiningDate: initial.joiningDate
          ? new Date(initial.joiningDate).toISOString().slice(0, 10)
          : "",
        monthlySalary: initial.monthlySalary ?? "",
        managerStaffId: initial.managerStaffId || null,
        teamId: initial.teamId || null,
        linkedUserId: initial.linkedUserId || null,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, initial]);

  const set = (key) => (valueOrEvent) => {
    const value = valueOrEvent?.target
      ? valueOrEvent.target.value
      : valueOrEvent;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const canSubmit = form.fullName.trim().length >= 2;

  const footer = (
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onClose} disabled={busy}>
        Cancel
      </Button>
      <Button
        onClick={() =>
          onSubmit({
            ...form,
            managerStaffId: form.managerStaffId?._id || null,
            teamId: form.teamId?._id || null,
            linkedUserId: form.linkedUserId?._id || null,
            monthlySalary:
              form.monthlySalary === "" || form.monthlySalary === null
                ? null
                : Number(form.monthlySalary),
          })
        }
        disabled={busy || !canSubmit}
      >
        {busy ? "Saving..." : isEdit ? "Save changes" : "Create staff"}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit staff member" : "New staff member"}
      subtitle="Manage employee profile and HR information."
      width="860px"
      footer={footer}
    >
      <div className="grid gap-4">
        {/* Row 1: Full Name */}
        <Input
          label="FULL NAME"
          value={form.fullName}
          onChange={set("fullName")}
          placeholder="Staff full name"
        />

        {/* Row 2: Email / Phone */}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="EMAIL"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="name@company.com"
          />

          <Input
            label="PHONE"
            value={form.phone}
            onChange={set("phone")}
            placeholder="+971..."
          />
        </div>

        {/* Row 3: Job Title / Department */}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="JOB TITLE"
            value={form.jobTitle}
            onChange={set("jobTitle")}
            placeholder="Social Media Manager"
          />

          <label className="grid gap-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
              DEPARTMENT
            </span>
            <Select
              value={form.department}
              onChange={set("department")}
              options={HR_DEPARTMENT_OPTIONS.filter((x) => x.value)}
            />
          </label>
        </div>

        {/* Row 4: Employment Type / Joining Date / Status */}
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
              EMPLOYMENT TYPE
            </span>
            <Select
              value={form.employmentType}
              onChange={set("employmentType")}
              options={STAFF_EMPLOYMENT_TYPE_OPTIONS.filter((x) => x.value)}
            />
          </label>

          <Input
            label="JOINING DATE"
            type="date"
            value={form.joiningDate}
            onChange={set("joiningDate")}
          />

          <label className="grid gap-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
              STATUS
            </span>
            <Select
              value={form.status}
              onChange={set("status")}
              options={STAFF_STATUS_OPTIONS.filter((x) => x.value)}
            />
          </label>
        </div>

        {/* Row 5: Manager (full width SmartSelect) */}
        <SmartSelect
          label="MANAGER"
          value={form.managerStaffId}
          onChange={set("managerStaffId")}
          loadOptions={({ q, limit }) =>
            listStaff({ q, limit }).then((r) => ({ items: r.items || [] }))
          }
          renderValue={(s) => (
            <span className="font-extrabold text-slate-900">{s.fullName}</span>
          )}
          renderOption={(s) => (
            <div>
              <div className="font-extrabold text-slate-900 text-sm">
                {s.fullName}
              </div>
              <div className="text-xs text-slate-500">
                {s.jobTitle || s.department}
              </div>
            </div>
          )}
          placeholder="Search staff…"
        />

        {/* Row 6: Team / Linked Portal User */}
        <div className="grid gap-4 md:grid-cols-2">
          <SmartSelect
            label="TEAM"
            value={form.teamId}
            onChange={set("teamId")}
            loadOptions={({ q, limit }) =>
              listTeams({ q, limit, isActive: "true" }).then((r) => ({
                items: r.items || [],
              }))
            }
            getKey={(t) => t._id}
            renderValue={(t) => (
              <span className="font-extrabold text-slate-900">{t.label}</span>
            )}
            renderOption={(t) => (
              <div className="font-extrabold text-slate-900 text-sm">
                {t.label}
              </div>
            )}
            placeholder="Select team…"
          />

          <SmartSelect
            label="LINKED PORTAL USER"
            value={form.linkedUserId}
            onChange={set("linkedUserId")}
            loadOptions={({ q, limit }) =>
              listUsers({ q, limit }).then((r) => ({ items: r.items || [] }))
            }
            renderValue={(u) => (
              <span className="font-extrabold text-slate-900">{u.fullName}</span>
            )}
            renderOption={(u) => (
              <div>
                <div className="font-extrabold text-slate-900 text-sm">
                  {u.fullName}
                </div>
                <div className="text-xs text-slate-500">{u.email}</div>
              </div>
            )}
            placeholder="Link portal user (optional)…"
          />
        </div>

        {/* Row 7: Monthly Salary / Currency */}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="MONTHLY SALARY"
            type="number"
            value={form.monthlySalary}
            onChange={set("monthlySalary")}
            placeholder="Optional"
          />

          <label className="grid gap-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
              CURRENCY
            </span>
            <Select
              value={form.currency}
              onChange={set("currency")}
              options={CURRENCY_OPTIONS}
            />
          </label>
        </div>

        {/* Row 8: Emergency Contact Name / Phone */}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="EMERGENCY CONTACT NAME"
            value={form.emergencyContactName}
            onChange={set("emergencyContactName")}
            placeholder="Optional"
          />

          <Input
            label="EMERGENCY CONTACT PHONE"
            value={form.emergencyContactPhone}
            onChange={set("emergencyContactPhone")}
            placeholder="Optional"
          />
        </div>

        {/* Row 9: Notes */}
        <label className="grid gap-2">
          <span className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
            NOTES
          </span>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes")(e.target.value)}
            rows={3}
            placeholder="Internal HR notes..."
            className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
      </div>
    </Modal>
  );
}
