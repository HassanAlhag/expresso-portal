import React, { useEffect, useState } from "react";
import Button from "../../../shared/ui/Button";
import { Building2, CheckCircle2 } from "lucide-react";

export default function CustomerSelect({
  value,
  onChange,
  listCustomers,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async (query) => {
    setLoading(true);
    try {
      const res = await listCustomers({ q: query, limit: 20 });
      setItems(res?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || disabled) return;
    load(q);
    // eslint-disable-next-line
  }, [open]);

  useEffect(() => {
    if (!open || disabled) return;
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q, open, disabled]);

  return (
    <div className="relative overflow-visible">
      <label className="grid gap-2">
        <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          CLIENT
        </span>

        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((s) => !s)}
          className={[
            "h-12 w-full rounded-3xl border border-black/10 bg-white px-4 text-left text-sm shadow-sm transition",
            disabled
              ? "cursor-not-allowed opacity-60"
              : "hover:bg-black/[0.02]",
          ].join(" ")}
        >
          {value ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-black text-slate-900">
                  {value.companyName || "Client"}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {value.contactName || value.primaryEmail || ""}
                </div>
              </div>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
          ) : (
            <span className="text-slate-500">Search and select…</span>
          )}
        </button>
      </label>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-full z-[10000] mt-2 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl">
          <div className="border-b border-black/10 p-3">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search client name…"
                className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </div>
          </div>

          <div className="max-h-[280px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                No clients found.
              </div>
            ) : (
              items.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className="w-full border-b border-black/5 px-4 py-3 text-left hover:bg-black/[0.03]"
                >
                  <div className="text-sm font-black text-slate-900">
                    {c.companyName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {c.contactName || c.primaryEmail || ""}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex justify-end bg-slate-50 p-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
