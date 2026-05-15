import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiFileText,
  FiMail,
  FiPhoneCall,
  FiUsers,
} from "react-icons/fi";

const BRAND_GLOW = "rgba(99,102,241,0.18)";

const PROJECT_LINKS = [
  { Icon: FiFileText, title: "Request a Proposal", desc: "Tell us what you need built", to: "/contact-us" },
  { Icon: FiPhoneCall, title: "Contact Sales", desc: "Speak with our growth team", to: "/contact-us" },
];

const ACTION_LINKS = [
  ...PROJECT_LINKS,
  { Icon: FiUsers, title: "Careers", desc: "Open roles and team culture", to: "/careers" },
  { Icon: FiMail, title: "Contact Us", desc: "Send a message or book a demo", to: "/contact-us" },
];

const ActionTile = ({ Icon, title, desc, to }) => (
  <Link
    to={to}
    className="group grid min-h-[112px] grid-rows-[auto_1fr] rounded-2xl border border-neutral-200 bg-white p-4 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-[0_14px_34px_rgba(99,102,241,0.1)]"
  >
    <span className="flex items-start justify-between gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-500 transition group-hover:bg-white group-hover:text-indigo-600">
        <Icon size={15} />
      </span>
      <FiArrowRight size={12} className="mt-1 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
    </span>
    <span className="mt-4 self-end">
      <span className="block text-[13px] font-black leading-tight text-neutral-900 group-hover:text-indigo-700">
        {title}
      </span>
      <span className="mt-1 block text-[11px] leading-snug text-neutral-500">
        {desc}
      </span>
    </span>
  </Link>
);

export default function WorkWithUsDropdown() {
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
              Primary path
            </span>

            <h2 className="text-[15px] font-bold leading-snug text-white">
              Build Your Plan
            </h2>

            <p className="mt-3 text-[11.5px] leading-relaxed text-white/50">
              Choose goals, services, and priorities.
            </p>

            <div className="mt-auto pt-6">
              <div className="mb-4 h-px w-full bg-white/8" />
              <Link
                to="/build-your-plan"
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-indigo-300 transition-colors hover:text-white"
              >
                Start planning <FiArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-l border-neutral-100 bg-white p-5">
          <section className="grid h-full content-center gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400">
                Next steps
              </p>
              <span className="ml-4 h-px flex-1 bg-neutral-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ACTION_LINKS.map((item) => (
                <ActionTile key={item.title} {...item} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
