import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import Button from "./Button";

// Record picker (PUI-4): search a list endpoint and pick one record — a
// client, project, enrollment, vendor or category. Generalises the PUI-2
// client picker (same px-picker styles). The trigger reports its expanded
// state, the search box is labelled, Escape closes and returns focus, and an
// optional record can be cleared.
export default function RecordPicker({
  label,
  value,
  onChange,
  load,
  getLabel = (r) => r?.name || r?.title || "Record",
  getSub,
  placeholder = "Search and select",
  searchLabel,
  required = false,
  disabled = false,
  hint,
}) {
  const id = useId();
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [state, setState] = useState("idle"); // idle | loading | failed

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const t = setTimeout(async () => {
      setState("loading");
      try {
        const res = await load(q);
        if (!cancelled) {
          setItems(Array.isArray(res) ? res : res?.items || []);
          setState("idle");
        }
      } catch {
        if (!cancelled) setState("failed");
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // `load` is a caller callback; re-run on query or open only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      className="px-field px-picker"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <span className="px-label" id={`${id}-l`}>
        {label}
        {required ? (
          <>
            <span aria-hidden="true"> *</span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="px-picker-trigger"
        aria-labelledby={`${id}-l ${id}-v`}
        aria-expanded={open}
        aria-controls={open ? `${id}-p` : undefined}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span id={`${id}-v`} style={{ minWidth: 0 }}>
          {value ? (
            <>
              <b>{getLabel(value)}</b>
              {getSub && getSub(value) ? <small>{getSub(value)}</small> : null}
            </>
          ) : (
            <span className="px-muted">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {hint ? <span className="px-hint">{hint}</span> : null}

      {open ? (
        <div className="px-picker-panel" id={`${id}-p`}>
          <div className="px-picker-search">
            <Search size={16} aria-hidden="true" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type to search"
              aria-label={searchLabel || `Search ${String(label).toLowerCase()}`}
              autoComplete="off"
            />
          </div>
          <ul className="px-picker-list" aria-label={label} aria-busy={state === "loading" || undefined}>
            {state === "loading" ? (
              <li className="px-picker-note" role="status">
                Loading…
              </li>
            ) : state === "failed" ? (
              <li className="px-picker-note" role="alert">
                The list didn't load. Close and try again.
              </li>
            ) : items.length === 0 ? (
              <li className="px-picker-note">Nothing found.</li>
            ) : (
              items.map((r) => (
                <li key={r._id}>
                  <button
                    type="button"
                    aria-pressed={value?._id === r._id}
                    onClick={() => {
                      onChange(r);
                      close();
                    }}
                  >
                    <b>{getLabel(r)}</b>
                    {getSub && getSub(r) ? <small>{getSub(r)}</small> : null}
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="px-picker-foot">
            {value && !required ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(null);
                  close();
                }}
              >
                <X size={14} aria-hidden="true" />
                Clear
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={close}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
