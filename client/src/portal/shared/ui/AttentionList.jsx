import React from "react";
import { Link } from "react-router-dom";

// Attention list (PUI-2): actionable items, most important first, each with
// one clear action. Tone is ok / warn / bad / info (the one status system).
export default function AttentionList({ items = [], empty = null }) {
  if (!items.length) return empty;
  return (
    <ul className="px-attn">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <li key={it.key}>
            <span className="px-kind" data-tone={it.tone || undefined} aria-hidden="true">
              {Icon ? <Icon size={17} /> : null}
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="px-t">{it.title}</div>
              {it.sub ? <div className="px-s">{it.sub}</div> : null}
            </div>
            {it.to || it.onAction ? (
              <div className="px-go">
                {it.to ? (
                  <Link to={it.to} className="px-btn px-btn--sm" aria-label={it.actionAria || undefined}>
                    {it.actionLabel || "Open"}
                  </Link>
                ) : (
                  <button type="button" className="px-btn px-btn--sm" onClick={it.onAction} aria-label={it.actionAria || undefined}>
                    {it.actionLabel || "Open"}
                  </button>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
