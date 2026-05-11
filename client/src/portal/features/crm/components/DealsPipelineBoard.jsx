import React, { useMemo } from "react";
import Card from "../../../shared/ui/Card";
import { DEAL_PIPELINE_COLUMNS, formatMoney, stageLabel } from "../constants";

function StagePill({ stage }) {
  const toneMap = {
    discovery: "border-slate-200 bg-slate-50 text-slate-700",
    qualified: "border-sky-200 bg-sky-50 text-sky-700",
    proposal: "border-indigo-200 bg-indigo-50 text-indigo-700",
    negotiation: "border-amber-200 bg-amber-50 text-amber-700",
    verbal_commitment: "border-violet-200 bg-violet-50 text-violet-700",
    won: "border-emerald-200 bg-emerald-50 text-emerald-700",
    lost: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
        toneMap[stage] || "border-slate-200 bg-slate-50 text-slate-700",
      ].join(" ")}
    >
      {stageLabel(stage)}
    </span>
  );
}

function DealCard({ item, onOpen, onMove, busy }) {
  const nextStages = DEAL_PIPELINE_COLUMNS
    .map((column) => column.key)
    .filter((stage) => stage !== item.stage);

  return (
    <Card className="p-3">
      <button
        type="button"
        onClick={() => onOpen?.(item)}
        className="block w-full text-left"
      >
        <div className="line-clamp-2 text-sm font-black text-slate-900">
          {item.title}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StagePill stage={item.stage} />
          <span className="text-xs font-semibold text-slate-500">
            {formatMoney(item.value, item.currency)}
          </span>
        </div>

        <div className="mt-2 text-xs text-slate-500">
          {item.customerId?.companyName || "No customer"}{" "}
          {item.expectedCloseDate
            ? `• ${new Date(item.expectedCloseDate).toLocaleDateString()}`
            : ""}
        </div>
      </button>

      <div className="mt-3">
        <select
          value=""
          onChange={(e) => {
            if (!e.target.value) return;
            onMove?.(item, e.target.value);
          }}
          disabled={busy}
          className="h-9 w-full rounded-xl border border-black/10 bg-white px-3 text-xs outline-none focus:ring-4 focus:ring-black/5"
        >
          <option value="">Move to...</option>
          {nextStages.map((stage) => (
            <option key={stage} value={stage}>
              {stageLabel(stage)}
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
}

export default function DealsPipelineBoard({
  items = [],
  busy = false,
  onOpen,
  onMove,
}) {
  const grouped = useMemo(() => {
    const map = {};
    DEAL_PIPELINE_COLUMNS.forEach((column) => {
      map[column.key] = [];
    });

    items.forEach((item) => {
      const key = item?.stage || "discovery";
      const columnKey = map[key] ? key : "discovery";
      map[columnKey].push(item);
    });

    return map;
  }, [items]);

  return (
    <div className="grid gap-4 xl:grid-cols-4 2xl:grid-cols-7">
      {DEAL_PIPELINE_COLUMNS.map((column) => {
        const stage = column.key;
        const colItems = grouped[stage] || [];

        return (
          <div
            key={stage}
            className="rounded-[24px] border border-black/10 bg-white/70 p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-black text-slate-900">
                {column.label || stageLabel(stage)}
              </div>
              <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                {colItems.length}
              </div>
            </div>

            <div className="grid gap-3">
              {colItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 p-4 text-xs text-slate-500">
                  No deals
                </div>
              ) : (
                colItems.map((item) => (
                  <DealCard
                    key={item._id}
                    item={item}
                    onOpen={onOpen}
                    onMove={onMove}
                    busy={busy}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
