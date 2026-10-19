import React from "react";
import BrandMark from "./BrandMark";

// Small caps label above a section title. `mark` adds the lotus signature —
// use it on key sections only (Solutions, Our Work, Vendors…), not everywhere.
export default function SectionEyebrow({
  children,
  mark = false,
  tone = "light", // "light" (on white/sand) | "dark" (on night)
  className = "",
}) {
  const color = tone === "dark" ? "text-lotus-300" : "text-lotus-600";
  return (
    <div
      className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] ${color} ${className}`}
    >
      {mark ? <BrandMark size={20} tone={tone === "dark" ? "lotus-300" : "lotus"} /> : null}
      <span>{children}</span>
    </div>
  );
}
