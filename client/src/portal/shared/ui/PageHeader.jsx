import React from "react";
import { usePageCrumbs, useShell } from "../../layouts/ShellContext";
import Breadcrumbs from "./Breadcrumbs";

// Page header (PUI-1): title, one-line description, optional meta line and
// actions on the right. Breadcrumbs are shown in the shell's top bar; a page
// rendered outside the shell shows them here instead. The old `eyebrow` prop
// is accepted but no longer rendered (the design avoids all-caps labels).
export default function PageHeader({
  eyebrow, // eslint-disable-line no-unused-vars
  title,
  subtitle,
  description,
  breadcrumb = [],
  meta,
  right,
  actions,
  className = "",
}) {
  const shell = useShell();
  usePageCrumbs(breadcrumb);
  const desc = description ?? subtitle;
  const act = actions ?? right;

  return (
    <div className={className}>
      {!shell && breadcrumb.length ? <Breadcrumbs items={breadcrumb} className="mb-3" /> : null}
      <div className="px-page-head">
        <div>
          <h1>{title}</h1>
          {desc ? <p className="px-desc">{desc}</p> : null}
          {meta ? <div className="px-meta">{meta}</div> : null}
        </div>
        {act ? <div className="px-actions">{act}</div> : null}
      </div>
    </div>
  );
}
