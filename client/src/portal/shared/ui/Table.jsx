import React from "react";

export default function Table({
  columns = [],
  data = [],
  renderRow,
  empty,
  className = "",
}) {
  return (
    <div
      className={[
        "overflow-hidden rounded-xl border border-slate-200 bg-white",
        className,
      ].join(" ")}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-[0.16em] text-slate-500">
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-black">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.length
              ? data.map((item, index) => renderRow?.(item, index))
              : null}
          </tbody>
        </table>
      </div>

      {!data.length && empty ? empty : null}
    </div>
  );
}
