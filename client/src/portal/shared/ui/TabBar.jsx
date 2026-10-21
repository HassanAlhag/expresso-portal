import React, { useRef } from "react";

// WAI-ARIA tabs (PUI-2). Only the selected tab is in the tab order; Left and
// Right arrows, Home and End move between tabs and select them.
export function tabIds(prefix, id) {
  return { tab: `${prefix}-tab-${id}`, panel: `${prefix}-panel-${id}` };
}

export default function TabBar({ tabs = [], value, onChange, label, idPrefix = "tabs", className = "" }) {
  const refs = useRef({});
  const move = (index) => {
    const t = tabs[(index + tabs.length) % tabs.length];
    if (!t) return;
    onChange(t.id);
    refs.current[t.id]?.focus();
  };
  const onKeyDown = (e, i) => {
    if (e.key === "ArrowRight") { e.preventDefault(); move(i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); move(i - 1); }
    else if (e.key === "Home") { e.preventDefault(); move(0); }
    else if (e.key === "End") { e.preventDefault(); move(tabs.length - 1); }
  };
  return (
    <div role="tablist" aria-label={label} className={["px-tabs", className].filter(Boolean).join(" ")}>
      {tabs.map((t, i) => {
        const ids = tabIds(idPrefix, t.id);
        const selected = t.id === value;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[t.id] = el; }}
            type="button"
            role="tab"
            id={ids.tab}
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {Icon ? <Icon size={15} aria-hidden="true" /> : null}
            {t.label}
            {typeof t.count === "number" ? <span className="px-count">{t.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idPrefix = "tabs", id, children, className = "" }) {
  const ids = tabIds(idPrefix, id);
  return (
    <div role="tabpanel" id={ids.panel} aria-labelledby={ids.tab} tabIndex={0} className={["px-tabpanel", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
