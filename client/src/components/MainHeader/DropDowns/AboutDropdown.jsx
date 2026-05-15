import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiImage,
  FiLayers,
  FiUsers,
} from "react-icons/fi";

const BRAND_GLOW = "rgba(99,102,241,0.18)";

const WORK_LINKS = [
  { Icon: FiImage, title: "Portfolio", desc: "Visual gallery of selected work", to: "/portfolio" },
  { Icon: FiLayers, title: "Case Studies", desc: "Project stories, process, and results", to: "/case-studies" },
  { Icon: FiUsers, title: "Clients", desc: "Brands and partners we support", to: "/services#clients" },
];

const RowLink = ({ Icon, title, desc, to }) => (
  <Link
    to={to}
    className="group grid grid-cols-[32px_1fr_14px] items-center gap-3 border-t border-neutral-100 py-3 first:border-t-0"
  >
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-100 text-neutral-500 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
      <Icon size={14} />
    </span>
    <span className="min-w-0">
      <span className="block text-[13px] font-bold leading-tight text-neutral-800 group-hover:text-indigo-700">
        {title}
      </span>
      <span className="mt-0.5 block text-[11px] leading-snug text-neutral-500">
        {desc}
      </span>
    </span>
    <FiArrowRight size={12} className="text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
  </Link>
);

export default function AboutDropdown() {
  return (
    <div className="w-full overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="grid grid-cols-[210px_1fr]">
        <div className="relative bg-neutral-950 p-6">
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full blur-3xl"
            style={{ backgroundColor: BRAND_GLOW }}
          />
          <div className="pointer-events-none absolute -top-8 right-0 h-28 w-28 rounded-full bg-indigo-400/8 blur-2xl" />

          <div className="relative flex h-full flex-col">
            <span
              className="mb-4 inline-block self-start rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em]"
              style={{
                borderColor: "rgba(99,102,241,0.35)",
                backgroundColor: "rgba(99,102,241,0.08)",
                color: "#a5b4fc",
              }}
            >
              About Us
            </span>

            <h2 className="text-[15px] font-bold leading-snug text-white">
              Learn who we are, how we work, and why clients trust us.
            </h2>

            <p className="mt-3 text-[11.5px] leading-relaxed text-white/50">
              Company story, team, process, proof, and career opportunities in
              one place.
            </p>

            <div className="mt-auto pt-6">
              <div className="mb-4 h-px w-full bg-white/8" />
              <Link
                to="/about-us"
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-indigo-300 transition-colors hover:text-white"
              >
                Explore About Expresso <FiArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-l border-neutral-100 bg-white p-6">
          <section className="flex h-full flex-col justify-center">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400">
                Work
              </p>
              <span className="ml-4 h-px flex-1 bg-neutral-100" />
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 px-5 py-3">
              {WORK_LINKS.map((item) => (
                <RowLink key={item.title} {...item} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
