import React from "react";
import HomepageSlideRow from "./HomepageSlideRow";

export default function HomepageSlideList({
  items = [],
  busy,
  onEdit,
  onDelete,
  onToggle,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div className="text-sm font-black text-slate-900">
          Slides ({items.length})
        </div>

        <div className="text-xs text-slate-500">
          Ordered by the order field, lowest first
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((slide) => (
          <HomepageSlideRow
            key={slide._id}
            slide={slide}
            busy={busy}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
