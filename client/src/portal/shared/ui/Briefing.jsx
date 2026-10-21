import React from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../../../brand";

// Landing-page briefing: date, one sentence that answers "what needs me?",
// and links straight to the relevant lists. The lotus watermark is the one
// brand-mark treatment on a landing page.
export default function Briefing({ when, children, links = [], actions }) {
  return (
    <section className="px-briefing" aria-labelledby="px-brief-title">
      <BrandMark size={300} tone="lotus" className="px-brief-mark" />
      {when ? <p className="px-when">{when}</p> : null}
      <h1 id="px-brief-title">{children}</h1>
      {links.length || actions ? (
        <div className="px-jump">
          {links.map((l) =>
            l.to ? (
              <Link key={l.label} to={l.to} className="px-jump-link">
                {l.count != null ? <b>{l.count}</b> : null}
                {l.icon ? <l.icon size={14} aria-hidden="true" /> : null}
                {l.label}
              </Link>
            ) : (
              <button key={l.label} type="button" className="px-jump-link" onClick={l.onClick}>
                {l.count != null ? <b>{l.count}</b> : null}
                {l.icon ? <l.icon size={14} aria-hidden="true" /> : null}
                {l.label}
              </button>
            )
          )}
          {actions}
        </div>
      ) : null}
    </section>
  );
}
