import React, { useId } from "react";
import { Search, X } from "lucide-react";

// Labelled search box for list toolbars. The label is visible above the
// field; Escape clears it.
export default function SearchField({ label = "Search", value, onChange, placeholder, onSubmit, className = "", hideLabel = false }) {
  const id = useId();
  return (
    <div className={["px-field px-field--search", className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </label>
      <div className="px-field-search">
        <Search size={16} aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && value) {
              e.preventDefault();
              onChange("");
            }
            if (e.key === "Enter") onSubmit?.();
          }}
          autoComplete="off"
        />
        {value ? (
          <button type="button" className="px-clear" onClick={() => onChange("")} aria-label={`Clear ${label.toLowerCase()}`}>
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
