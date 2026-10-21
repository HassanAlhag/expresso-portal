import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

// items: [{ label, to? }]; the last item is the current page.
export default function Breadcrumbs({ items = [], className = "" }) {
  if (!items.length) return null;
  return (
    <nav className={["px-crumbs", className].filter(Boolean).join(" ")} aria-label="Breadcrumb">
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`}>
              {last ? (
                <span aria-current="page">{item.label}</span>
              ) : item.to ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
              {!last && <ChevronRight size={14} className="px-crumb-sep" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
