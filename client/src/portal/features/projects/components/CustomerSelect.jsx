import React, { useEffect, useState } from "react";
import Button from "../../../shared/ui/Button";
import { Building2 } from "lucide-react";
import { listCustomers } from "../../customers/api";

export default function CustomerSelect({ value, onChange }) {
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
    if (!open) return;
    load(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open]);

  return (
    <div className="relative">
      <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
        CLIENT
      </div>

      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-left text-sm shadow-sm outline-none transition hover:bg-black/[0.02]"
      >
        {value ? (
          <div className="min-w-0">
            <div className="truncate font-extrabold text-slate-900">
              {value.companyName || "Client"}
            </div>
            <div className="truncate text-xs text-slate-500">
              {value.contactName || value.primaryEmail || ""}
            </div>
          </div>
        ) : (
          <span className="text-slate-500">Search and select…</span>
        )}
      </button>

      {open ? (
        <div className="absolute z-[9999] mt-2 w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
          <div className="border-b border-black/10 p-3">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search company name…"
                className="h-10 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </div>
          </div>

          <div className="max-h-[260px] overflow-y-auto">
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
                  <div className="text-sm font-extrabold text-slate-900">
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
