import React, { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Select from "../../../shared/ui/Select";
import {
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_DEPARTMENT_OPTIONS,
} from "../constants/hr.constants";

const EMPTY = {
  title: "",
  staffName: "",
  department: "Marketing",
  category: "other",
  amount: "",
  currency: "AED",
  expenseDate: new Date().toISOString().slice(0, 10),
  claimMonth: new Date().toISOString().slice(0, 7),
  description: "",
  receiptUrl: "",
  notes: "",
};

export default function ExpenseClaimFormModal({
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
        expenseDate: initial.expenseDate
          ? new Date(initial.expenseDate).toISOString().slice(0, 10)
          : EMPTY.expenseDate,
        amount: initial.amount || "",
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

  const canSubmit =
    form.title.trim().length >= 3 &&
    form.staffName.trim().length >= 2 &&
    Number(form.amount || 0) > 0;

  const footer = (
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onClose} disabled={busy}>
        Cancel
      </Button>
      <Button
        onClick={() =>
          onSubmit({
            ...form,
            amount: Number(form.amount || 0),
          })
        }
        disabled={busy || !canSubmit}
      >
        {busy ? "Saving..." : isEdit ? "Save changes" : "Create claim"}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit expense claim" : "New expense claim"}
      subtitle="Submit staff expenses for approval and monthly registration."
      width="760px"
      footer={footer}
    >
      <div className="grid gap-4">
        <Input
          label="EXPENSE TITLE"
          value={form.title}
          onChange={set("title")}
          placeholder="Taxi to client meeting"
        />

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
            options={EXPENSE_DEPARTMENT_OPTIONS.filter((x) => x.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="CATEGORY"
            value={form.category}
            onChange={set("category")}
            options={EXPENSE_CATEGORY_OPTIONS.filter((x) => x.value)}
          />

          <Input
            label="AMOUNT"
            type="number"
            min="0"
            value={form.amount}
            onChange={set("amount")}
            placeholder="0.00"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="CURRENCY"
            value={form.currency}
            onChange={set("currency")}
            placeholder="AED"
          />

          <Input
            label="EXPENSE DATE"
            type="date"
            value={form.expenseDate}
            onChange={set("expenseDate")}
          />

          <Input
            label="CLAIM MONTH"
            type="month"
            value={form.claimMonth}
            onChange={set("claimMonth")}
          />
        </div>

        <label className="grid gap-2">
          <span className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
            DESCRIPTION
          </span>
          <textarea
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            rows={4}
            placeholder="Add context, meeting name, reason, or notes..."
            className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <Input
          label="RECEIPT URL"
          value={form.receiptUrl}
          onChange={set("receiptUrl")}
          placeholder="Optional receipt link"
        />

        <Input
          label="INTERNAL NOTES"
          value={form.notes}
          onChange={set("notes")}
          placeholder="Optional notes"
        />
      </div>
    </Modal>
  );
}
