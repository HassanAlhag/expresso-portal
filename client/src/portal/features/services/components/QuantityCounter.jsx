import React from "react";
import { Minus, Plus } from "lucide-react";

export default function QuantityCounter({
  label = "QUANTITY",
  value = 1,
  min = 0,
  max = 999,
  step = 1,
  onChange,
}) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : min;

  const decrease = () => {
    const next = Math.max(min, safeValue - step);
    onChange?.(next);
  };

  const increase = () => {
    const next = Math.min(max, safeValue + step);
    onChange?.(next);
  };

  return (
    <div className="grid gap-2">
      <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
        {label}
      </span>

      <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={decrease}
          className="grid h-full w-11 place-items-center border-r border-slate-200 text-slate-600 transition hover:bg-slate-50"
        >
          <Minus size={16} />
        </button>

        <div className="flex-1 text-center text-sm font-black text-slate-900">
          {safeValue}
        </div>

        <button
          type="button"
          onClick={increase}
          className="grid h-full w-11 place-items-center border-l border-slate-200 text-slate-600 transition hover:bg-slate-50"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
