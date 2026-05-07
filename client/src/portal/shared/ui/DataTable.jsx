import React from "react";
import Skeleton from "./Skeleton";

/**
 * Shared data table.
 *
 * columns[]  — { key, label, align?: "left"|"right"|"center", stopPropagation?: bool, render?: (row, index) => ReactNode }
 * rows[]     — data objects; keyed by row._id, row.id, or index
 * onRowClick — (row) => void; enables hover + cursor-pointer on rows
 * title/hint — optional header bar (left title, right hint text)
 * footer     — ReactNode rendered below the table (e.g. pagination)
 * empty      — string or ReactNode shown when rows are empty and not loading
 * loading    — shows skeleton rows instead of data
 * skeletonRows — how many skeleton rows to show while loading (default 5)
 */
export default function DataTable({
  columns = [],
  rows = [],
  onRowClick,
  title,
  hint,
  footer,
  empty = "No data found.",
  loading = false,
  skeletonRows = 5,
  className = "",
}) {
  const showEmpty = !loading && rows.length === 0;

  return (
    <div
      className={[
        "overflow-hidden rounded-xl border border-slate-200 bg-white",
        className,
      ].join(" ")}
    >
      {/* Header bar */}
      {(title != null || hint != null) && (
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
          {title != null && (
            <div className="text-sm font-black text-slate-900">{title}</div>
          )}
          {hint != null && (
            <div className="text-xs text-slate-500">{hint}</div>
          )}
        </div>
      )}

      {/* Empty state */}
      {showEmpty ? (
        typeof empty === "string" ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">{empty}</div>
        ) : (
          empty
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <thead className="bg-slate-50">
              <tr className="border-b border-black/10">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={[
                      "px-4 py-3 text-xs font-black tracking-[0.18em] text-slate-500",
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left",
                    ].join(" ")}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading
                ? [...Array(skeletonRows)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3">
                          <Skeleton className="h-5 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row, rowIndex) => (
                    <tr
                      key={row._id ?? row.id ?? rowIndex}
                      onClick={() => onRowClick?.(row)}
                      className={[
                        "border-b border-slate-100 last:border-0",
                        onRowClick ? "cursor-pointer hover:bg-black/[0.02]" : "",
                      ].join(" ")}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={[
                            "px-4 py-3",
                            col.align === "right"
                              ? "text-right"
                              : col.align === "center"
                              ? "text-center"
                              : "",
                          ].join(" ")}
                          onClick={
                            col.stopPropagation
                              ? (e) => e.stopPropagation()
                              : undefined
                          }
                        >
                          {col.render
                            ? col.render(row, rowIndex)
                            : (row[col.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer slot (e.g. pagination) */}
      {footer && (
        <div className="border-t border-slate-100 px-4 py-3">{footer}</div>
      )}
    </div>
  );
}
