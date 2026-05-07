import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Select from "../../../shared/ui/Select";
import {
  HR_DEPARTMENT_OPTIONS,
  LEAVE_TYPE_OPTIONS,
} from "../constants/hr.constants";

function dateToInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function daysBetween(start, end) {
  if (!start || !end) return 1;

  const s = new Date(start);
  const e = new Date(end);
  const diff = e.getTime() - s.getTime();

  return Math.max(1, Math.floor(diff / 86400000) + 1);
}

const EMPTY = {
  staffName: "",
  department: "Marketing",
  leaveType: "annual",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  reason: "",
  notes: "",
};

export default function LeaveRequestFormModal({
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
        startDate: dateToInput(initial.startDate),
        endDate: dateToInput(initial.endDate),
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, initial]);

  const calculatedDays = useMemo(
    () => daysBetween(form.startDate, form.endDate),
    [form.startDate, form.endDate]
  );

  const set = (key) => (valueOrEvent) => {
    const value = valueOrEvent?.target
      ? valueOrEvent.target.value
      : valueOrEvent;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const canSubmit =
    form.staffName.trim().length >= 2 && form.startDate && form.endDate;

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <div className="text-sm text-slate-500">
        Days:{" "}
        <span className="font-black text-slate-900">{calculatedDays}</span>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>

        <Button
          onClick={() =>
            onSubmit({
              ...form,
              days: calculatedDays,
            })
          }
          disabled={busy || !canSubmit}
        >
          {busy ? "Saving..." : isEdit ? "Save changes" : "Create request"}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit leave request" : "New leave request"}
      subtitle="Submit and manage staff leave requests."
      width="760px"
      footer={footer}
    >
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="STAFF NAME"
            value={form.staffName}
            onChange={set("staffName")}
            placeholder="Staff member name"
          />

          <Select
            label="DEPARTMENT"
            value={form.department}
            onChange={set("department")}
            options={HR_DEPARTMENT_OPTIONS.filter((x) => x.value)}
          />
        </div>

        <Select
          label="LEAVE TYPE"
          value={form.leaveType}
          onChange={set("leaveType")}
          options={LEAVE_TYPE_OPTIONS.filter((x) => x.value)}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="START DATE"
            type="date"
            value={form.startDate}
            onChange={set("startDate")}
          />

          <Input
            label="END DATE"
            type="date"
            value={form.endDate}
            onChange={set("endDate")}
          />
        </div>

        <label className="grid gap-2">
          <span className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
            REASON
          </span>
          <textarea
            value={form.reason}
            onChange={(e) => set("reason")(e.target.value)}
            rows={4}
            placeholder="Reason for leave..."
            className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <Input
          label="NOTES"
          value={form.notes}
          onChange={set("notes")}
          placeholder="Optional internal notes"
        />
      </div>
    </Modal>
  );
}
