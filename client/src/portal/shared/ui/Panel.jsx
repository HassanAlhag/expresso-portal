import React, { useId } from "react";

// Content panel (PUI-2): white surface, hairline border, optional heading row
// with a sub-line and a link/action on the right. `flush` removes the body
// padding for lists and tables that run edge to edge.
export default function Panel({
  title,
  sub,
  action,
  flush = false,
  bare = false,
  className = "",
  bodyClassName = "",
  label,
  children,
  ...props
}) {
  const id = useId();
  const headingId = title ? `${id}-h` : undefined;
  return (
    <section
      className={["px-panel", flush ? "px-panel--flush" : "", bare ? "px-panel--bare" : "", className].filter(Boolean).join(" ")}
      aria-labelledby={headingId}
      aria-label={headingId ? undefined : label}
      {...props}
    >
      {title || action ? (
        <div className="px-panel-head">
          <div style={{ minWidth: 0 }}>
            {title ? <h2 id={headingId}>{title}</h2> : null}
            {sub ? <p className="px-sub">{sub}</p> : null}
          </div>
          {action ? <div style={{ flex: "none" }}>{action}</div> : null}
        </div>
      ) : null}
      <div className={["px-panel-body", bodyClassName].filter(Boolean).join(" ")}>{children}</div>
    </section>
  );
}
