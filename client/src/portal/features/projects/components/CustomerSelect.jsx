import React, { useEffect, useId, useRef, useState } from "react";
import Button from "../../../shared/ui/Button";
import { Building2, ChevronDown } from "lucide-react";
import { listCustomers } from "../../customers/api";

export default function CustomerSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const id = useId();
  const triggerRef = useRef(null);
  const searchRef = useRef(null);

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

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Client picker (PUI-2 styling). The trigger reports its expanded state,
  // the search box is labelled, and Escape closes the list.
  return (
    <div className="px-field px-picker" onKeyDown={(e) => {
      if (e.key === "Escape" && open) {
        e.stopPropagation();
        close();
      }
    }}>
      <span className="px-label" id={`${id}-l`}>
        Client <span aria-hidden="true">*</span>
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="px-picker-trigger"
        aria-labelledby={`${id}-l ${id}-v`}
        aria-expanded={open}
        aria-controls={open ? `${id}-p` : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span id={`${id}-v`} style={{ minWidth: 0 }}>
          {value ? (
            <>
              <b>{value.companyName || "Client"}</b>
              <small>{value.contactName || value.primaryEmail || ""}</small>
            </>
          ) : (
            <span className="px-muted">Search and select a client</span>
          )}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {open ? (
        <div className="px-picker-panel" id={`${id}-p`}>
          <div className="px-picker-search">
            <Building2 size={16} aria-hidden="true" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search company name"
              aria-label="Search clients"
              autoComplete="off"
            />
          </div>
          <ul className="px-picker-list" aria-label="Clients" aria-busy={loading || undefined}>
            {loading ? (
              <li className="px-picker-note" role="status">Loading clients…</li>
            ) : items.length === 0 ? (
              <li className="px-picker-note">No clients found.</li>
            ) : (
              items.map((c) => (
                <li key={c._id}>
                  <button
                    type="button"
                    aria-pressed={value?._id === c._id}
                    onClick={() => {
                      onChange(c);
                      close();
                    }}
                  >
                    <b>{c.companyName}</b>
                    <small>{c.contactName || c.primaryEmail || ""}</small>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="px-picker-foot">
            <Button variant="outline" size="sm" onClick={close}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
