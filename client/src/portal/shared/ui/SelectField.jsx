import React, { useId } from "react";

// Labelled native select for toolbars and forms (PUI-2).
export default function SelectField({ label, value, onChange, options = [], className = "", disabled = false, hideLabel = false }) {
  const id = useId();
  return (
    <div className={["px-field px-field--select", className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </label>
      <div className="px-select">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
