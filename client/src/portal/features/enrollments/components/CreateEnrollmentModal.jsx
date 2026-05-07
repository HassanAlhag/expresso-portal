import React, { useEffect, useMemo, useState } from "react";

import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Skeleton from "../../../shared/ui/Skeleton";

import { X, Building2, BriefcaseBusiness } from "lucide-react";

import { listCustomers } from "../../customers/api";
import { listServiceTemplates } from "../../services/api";

const BRAND = "#6F7FD9";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

function SelectField({
  label,
  value,
  onChange,
  children,
  icon: Icon,
  disabled = false,
}) {
  return (
    <label className="grid gap-2">
      <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.22em] text-slate-500">
        {Icon ? <Icon size={14} /> : null}
        {label}
      </span>

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5 disabled:bg-slate-50"
      >
        {children}
      </select>
    </label>
  );
}

function executionModeLabel(mode) {
  const raw = String(mode || "").trim();
  if (raw === "phased_project") return "Phased project";
  if (raw === "one_time") return "One-time";
  if (raw === "recurring") return "Recurring";
  return raw || "—";
}

function serviceBehavior(service) {
  const mode = String(service?.executionMode || "").trim();

  if (mode === "phased_project") {
    return "This is a phased service. Its phases and jobs will be used as the active delivery scope for this enrollment.";
  }

  if (mode === "one_time") {
    return "This is a one-time service. It will create a fixed delivery scope for this enrollment.";
  }

  if (mode === "recurring") {
    return "This is a recurring service. Monthly outputs or repeating work items will be used from the service scope.";
  }

  return "This service will be used as the fixed scope for this enrollment.";
}

export default function CreateEnrollmentModal({
  open,
  onClose,
  onSubmit,
  busy = false,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [serviceTemplateId, setServiceTemplateId] = useState("");

  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!open) return;

    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [customersRes, servicesRes] = await Promise.all([
          listCustomers({ limit: 100, page: 1, isActive: "true" }),
          listServiceTemplates({
            limit: 100,
            page: 1,
            status: "active",
            sort: "name",
          }),
        ]);

        if (ignore) return;

        setCustomers(
          Array.isArray(customersRes?.items) ? customersRes.items : []
        );
        setServices(Array.isArray(servicesRes?.items) ? servicesRes.items : []);
      } catch (e) {
        if (ignore) return;
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to load enrollment data"
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [open]);

  const selectedCustomer = useMemo(() => {
    return customers.find((x) => x._id === customerId) || null;
  }, [customers, customerId]);

  const selectedService = useMemo(() => {
    return services.find((x) => x._id === serviceTemplateId) || null;
  }, [services, serviceTemplateId]);

  const canSubmit = useMemo(() => {
    return Boolean(customerId && serviceTemplateId && status);
  }, [customerId, serviceTemplateId, status]);

  const handleClose = () => {
    if (busy) return;
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || busy) return;

    await onSubmit?.({
      customerId,
      serviceTemplateId,
      status,
      notes: notes.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
      <Card className="w-full max-w-3xl overflow-hidden p-0">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="text-xl font-black text-slate-900">
              New enrollment
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Enroll a customer into one of your fixed services.
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 px-6 py-6">
          {loading ? (
            <div className="grid gap-3">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="CLIENT"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  icon={Building2}
                  disabled={busy}
                >
                  <option value="">Select client</option>
                  {customers.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.companyName ||
                        item.contactName ||
                        "Unnamed client"}
                    </option>
                  ))}
                </SelectField>

                <SelectField
                  label="SERVICE TEMPLATE"
                  value={serviceTemplateId}
                  onChange={(e) => setServiceTemplateId(e.target.value)}
                  icon={BriefcaseBusiness}
                  disabled={busy}
                >
                  <option value="">Select service template</option>
                  {services.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name || "Untitled service"}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="STATUS"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={busy}
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </SelectField>
              </div>

              {selectedService ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Selected service
                  </div>

                  <div className="mt-2 text-sm font-black text-slate-900">
                    {selectedService.name}
                  </div>

                  <div className="mt-1 text-sm text-slate-600">
                    {selectedService.summary || "No summary"}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-bold text-slate-700">
                      {executionModeLabel(selectedService.executionMode)}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-bold text-slate-700">
                      {typeof selectedService.price === "number"
                        ? `${selectedService.price}${
                            selectedService.billingCycle
                              ? ` / ${selectedService.billingCycle}`
                              : ""
                          }`
                        : "Price not set"}
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3 text-sm text-slate-700">
                    {serviceBehavior(selectedService)}
                  </div>
                </div>
              ) : null}

              {selectedCustomer ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Customer
                  </div>
                  <div className="mt-2 text-sm font-black text-slate-900">
                    {selectedCustomer.companyName ||
                      selectedCustomer.contactName ||
                      "Unnamed client"}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {selectedCustomer.primaryEmail || "No email"}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="START DATE"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />

                <Input
                  label="END DATE"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <label className="grid gap-2">
                <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                  NOTES
                </span>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                  placeholder="Any scope clarification, onboarding note, or internal remarks..."
                />
              </label>
            </>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-5">
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={busy || loading || !canSubmit}
              style={{ backgroundColor: BRAND }}
            >
              {busy ? "Creating..." : "Create enrollment"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
