import React from "react";

// Definition list for record details. Items without a value show a dash so
// the layout stays stable; `hidden` items are left out.
export default function KeyValue({ items = [], className = "" }) {
  const shown = items.filter((i) => i && !i.hidden);
  return (
    <dl className={["px-kv", className].filter(Boolean).join(" ")}>
      {shown.map((i) => (
        <React.Fragment key={i.label}>
          <dt>{i.label}</dt>
          <dd>{i.value === null || i.value === undefined || i.value === "" ? "—" : i.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
