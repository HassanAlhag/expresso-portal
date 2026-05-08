import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export default function SmartSelect({
  label,
  value, // selected object (or null)
  onChange, // (item|null) => void
  loadOptions, // async ({ q, limit }) => { items: [] } OR []
  getKey = (x) => x?._id,
  renderValue, // (item) => ReactNode (how selected looks)
  renderOption, // (item) => ReactNode
  placeholder = "Search & select…",
  limit = 20,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const selectedKey = useMemo(
    () => (value ? getKey(value) : null),
    [value, getKey]
  );

  const fetch = async (query) => {
    setBusy(true);
    try {
      const res = await loadOptions({ q: query, limit });
      const list = Array.isArray(res)
        ? res
        : res?.items || res?.customers || [];
      setItems(list);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetch(q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  return (
    <div className="relative" ref={boxRef}>
      {label ? (
        <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500 mb-2">
          {label}
        </div>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className={[
          "h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-left text-sm shadow-sm outline-none transition",
          "hover:bg-black/[0.02] focus:ring-4 focus:ring-black/5",
          disabled ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {value ? (
              renderValue ? (
                renderValue(value)
              ) : (
                <div className="truncate font-extrabold text-slate-900">
                  {String(
                    value?.name || value?.title || value?._id || "Selected"
                  )}
                </div>
              )
            ) : (
              <span className="text-slate-500">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {value ? (
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange?.(null);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white hover:bg-black/[0.03]"
                title="Clear"
              >
                <X size={16} />
              </span>
            ) : null}

            <ChevronDown size={18} className="text-slate-500" />
          </div>
        </div>
      </button>

      {open ? (
        <div className="absolute z-[9999] mt-2 w-full rounded-2xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] overflow-hidden">
          <div className="p-3 border-b border-black/10 bg-white">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-white">
                <Search size={16} />
              </div>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type to search…"
                className="w-full h-10 rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </div>
          </div>

          <div className="max-h-[280px] overflow-y-auto">
            {busy ? (
              <div className="p-4 text-sm text-slate-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No results.</div>
            ) : (
              items.map((it) => {
                const k = getKey(it);
                const active = selectedKey && k === selectedKey;
                return (
                  <button
                    key={String(k)}
                    type="button"
                    onClick={() => {
                      onChange?.(it);
                      setOpen(false);
                    }}
                    className={[
                      "w-full text-left px-4 py-3 border-b border-black/5 hover:bg-black/[0.03] transition",
                      active ? "bg-black/[0.03]" : "",
                    ].join(" ")}
                  >
                    {renderOption ? (
                      renderOption(it)
                    ) : (
                      <div className="text-sm font-extrabold text-slate-900">
                        {String(it?.name || it?.title || it?._id)}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2 bg-slate-50 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 px-3 rounded-2xl border border-black/10 bg-white text-xs font-extrabold hover:bg-black/[0.03]"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
