import React from "react";
import { Link } from "react-router-dom";

// Metrics strip (PUI-2): at most four figures in one joined bar, each with a
// short note that gives the comparison or the reason. A figure with `to` or
// `onClick` becomes a link or button to the filtered list behind it.
export default function MetricsStrip({ label = "Summary", items = [], className = "" }) {
  const shown = items.filter(Boolean).slice(0, 4);
  if (!shown.length) return null;
  return (
    <section
      className={["px-metrics", className].filter(Boolean).join(" ")}
      aria-label={label}
      style={{ "--px-metric-n": shown.length }}
    >
      {shown.map((m) => {
        const body = (
          <>
            <span className="px-m-label">{m.label}</span>
            <span className="px-m-value">
              {m.prefix ? <small>{m.prefix}</small> : null}
              {m.value}
            </span>
            {m.note ? (
              <span className="px-m-note" data-tone={m.noteTone || undefined}>
                {m.note}
              </span>
            ) : null}
          </>
        );
        if (m.to) {
          return (
            <Link key={m.key || m.label} to={m.to} className="px-metric">
              {body}
            </Link>
          );
        }
        if (m.onClick) {
          return (
            <button key={m.key || m.label} type="button" className="px-metric" onClick={m.onClick} aria-pressed={m.pressed}>
              {body}
            </button>
          );
        }
        return (
          <div key={m.key || m.label} className="px-metric">
            {body}
          </div>
        );
      })}
    </section>
  );
}
