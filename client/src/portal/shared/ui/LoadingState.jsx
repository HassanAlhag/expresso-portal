import React from "react";

// Skeleton placeholder for a page region. Announced once to screen readers.
export default function LoadingState({ rows = 4, label = "Loading", className = "" }) {
  return (
    <div role="status" aria-live="polite" className={["px-surface", className].filter(Boolean).join(" ")} style={{ padding: 20 }}>
      <span className="sr-only">{label}</span>
      <div style={{ display: "grid", gap: 14 }} aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} style={{ display: "grid", gap: 6 }}>
            <span className="px-skel" style={{ width: `${70 - ((i * 13) % 30)}%` }} />
            <span className="px-skel" style={{ width: `${35 + ((i * 17) % 25)}%`, height: 10 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
