import React from "react";

// Vertical activity timeline: an icon dot, what happened, and when.
export default function Timeline({ items = [], label, className = "" }) {
  return (
    <ol className={["px-timeline", className].filter(Boolean).join(" ")} aria-label={label}>
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <li key={it.key}>
            <span className="px-dot" data-tone={it.tone || undefined} aria-hidden="true">
              {Icon ? <Icon size={14} /> : null}
            </span>
            <div className="px-what">{it.content}</div>
            {it.when ? <time className="px-when" dateTime={it.dateTime}>{it.when}</time> : null}
          </li>
        );
      })}
    </ol>
  );
}
