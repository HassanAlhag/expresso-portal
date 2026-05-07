import React, { useEffect, useState } from "react";
import Button from "../../../shared/ui/Button";
import { FolderKanban, CheckCircle2 } from "lucide-react";

export default function ProjectSelect({
  value,
  onChange,
  listProjects,
  customerId,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async (query) => {
    if (!customerId) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const res = await listProjects({
        q: query,
        customerId,
        limit: 20,
        status: "",
      });
      setItems(res?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || disabled) return;
    load(q);
    // eslint-disable-next-line
  }, [open, customerId]);

  useEffect(() => {
    if (!open || disabled) return;
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q, open, disabled, customerId]);

  return (
    <div className="relative overflow-visible">
      <label className="grid gap-2">
        <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          PROJECT
        </span>

        <button
          type="button"
          disabled={disabled || !customerId}
          onClick={() => !disabled && customerId && setOpen((s) => !s)}
          className={[
            "h-12 w-full rounded-3xl border border-black/10 bg-white px-4 text-left text-sm shadow-sm transition",
            disabled || !customerId
              ? "cursor-not-allowed opacity-60"
              : "hover:bg-black/[0.02]",
          ].join(" ")}
        >
          {value ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-black text-slate-900">
                  {value.name || "Project"}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {String(value.type || "").toUpperCase()} •{" "}
                  {String(value.status || "").replaceAll("_", " ")}
                </div>
              </div>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
          ) : (
            <span className="text-slate-500">
              {customerId ? "Search and select…" : "Select client first"}
            </span>
          )}
        </button>
      </label>

      {open && !disabled && customerId ? (
        <div className="absolute left-0 right-0 top-full z-[10000] mt-2 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl">
          <div className="border-b border-black/10 p-3">
            <div className="flex items-center gap-2">
              <FolderKanban size={16} className="text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search project name…"
                className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </div>
          </div>

          <div className="max-h-[280px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                No projects found.
              </div>
            ) : (
              items.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    onChange(p);
                    setOpen(false);
                  }}
                  className="w-full border-b border-black/5 px-4 py-3 text-left hover:bg-black/[0.03]"
                >
                  <div className="text-sm font-black text-slate-900">
                    {p.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {String(p.type || "").toUpperCase()} •{" "}
                    {String(p.status || "").replaceAll("_", " ")}
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
