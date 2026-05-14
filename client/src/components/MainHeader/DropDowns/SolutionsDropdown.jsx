import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiPackage } from "react-icons/fi";
import {
  STATIC_SOLUTIONS,
  ICON_META,
  BRAND,
  BRAND_BG,
} from "../../../data/technologySolutionsData";

const BRAND_GLOW = "rgba(124,58,237,0.18)";

const Item = ({ Icon, title, desc, to }) => (
  <Link
    to={to}
    className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 hover:bg-neutral-50"
  >
    <span
      className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-110"
      style={{ backgroundColor: BRAND_BG, color: BRAND }}
    >
      <Icon size={14} />
    </span>

    <div className="min-w-0 flex-1">
      <p className="text-[12.5px] font-semibold leading-tight text-neutral-800 group-hover:text-neutral-900">
        {title}
      </p>

      <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-400">
        {desc}
      </p>
    </div>

    <FiArrowRight
      size={11}
      className="mt-1 flex-shrink-0 text-indigo-400 opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100"
    />
  </Link>
);

export default function SolutionsDropdown() {
  return (
    <div className="w-full overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="grid grid-cols-[210px_1fr]">
        <div className="relative bg-neutral-950 p-6">
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full blur-3xl"
            style={{ backgroundColor: BRAND_GLOW }}
          />

          <div className="pointer-events-none absolute -top-8 right-0 h-28 w-28 rounded-full bg-violet-400/8 blur-2xl" />

          <div className="relative flex h-full flex-col">
            <span
              className="mb-4 inline-block self-start rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em]"
              style={{
                borderColor: "rgba(99,102,241,0.35)",
                backgroundColor: "rgba(99,102,241,0.08)",
                color: "#a5b4fc",
              }}
            >
              Technology Solutions
            </span>

            <h2 className="text-[15px] font-bold leading-snug text-white">
              Enterprise technology built for scale.
            </h2>

            <p className="mt-3 text-[11.5px] leading-relaxed text-white/50">
              From ERP and CRM to IoT, cloud, and full data center
              infrastructure.
            </p>

            <div className="mt-auto pt-6">
              <div className="mb-4 h-px w-full bg-white/10" />

              <Link
                to="/it-solutions"
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-indigo-300 transition-colors hover:text-white"
              >
                Explore all solutions
                <FiArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-l border-neutral-100 bg-white px-5 py-5">
          <div className="grid grid-cols-4 gap-x-1 gap-y-0.5">
            {STATIC_SOLUTIONS.map((solution) => {
              const meta = ICON_META[solution.icon];
              const Icon = meta?.Icon || FiPackage;

              return (
                <Item
                  key={solution.title}
                  Icon={Icon}
                  title={solution.title}
                  desc={solution.subtitle}
                  to={solution.to}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
