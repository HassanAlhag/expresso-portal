import React from "react";

// Placeholder rows for a table that is loading. The table carries
// aria-busy; one visually hidden status line announces the load.
export default function SkeletonRows({ rows = 6, cols = 5, label = "Loading" }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="px-skel-row" aria-hidden={r ? "true" : undefined}>
          <td colSpan={cols}>
            {r === 0 ? (
              <span role="status" className="sr-only">
                {label}
              </span>
            ) : null}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) repeat(3, minmax(0,1fr))", gap: 18 }} aria-hidden="true">
              <span style={{ display: "grid", gap: 6 }}>
                <span className="px-skel" style={{ width: `${78 - ((r * 11) % 30)}%` }} />
                <span className="px-skel" style={{ width: "40%", height: 10 }} />
              </span>
              <span className="px-skel" style={{ width: "70%" }} />
              <span className="px-skel" style={{ width: "55%" }} />
              <span className="px-skel" style={{ width: "45%" }} />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
