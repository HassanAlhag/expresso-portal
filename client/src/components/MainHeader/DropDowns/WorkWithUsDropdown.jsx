import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiClipboard,
  FiFileText,
  FiLayers,
  FiMail,
  FiPhoneCall,
  FiUsers,
} from "react-icons/fi";

const BRAND = "#6366f1";
const BRAND_BG = "rgba(99,102,241,0.1)";
const BRAND_GLOW = "rgba(99,102,241,0.18)";

const GROUPS = [
  {
    title: "Start a Project",
    items: [
      { Icon: FiClipboard, title: "Build Your Plan", desc: "Choose goals, services, and priorities", to: "/build-your-plan" },
      { Icon: FiFileText, title: "Request a Proposal", desc: "Tell us what you need built", to: "/contact-us" },
      { Icon: FiPhoneCall, title: "Contact Sales", desc: "Speak with our growth team", to: "/contact-us" },
    ],
  },
  {
    title: "See Our Work",
    items: [
      { Icon: FiBriefcase, title: "Portfolio", desc: "Explore selected projects", to: "/our-portfolio" },
      { Icon: FiLayers, title: "Case Studies", desc: "Read deeper project stories", to: "/our-portfolio" },
    ],
  },
  {
    title: "Join Expresso",
    items: [
      { Icon: FiUsers, title: "Careers", desc: "Open roles and team culture", to: "/careers" },
    ],
  },
  {
    title: "Contact",
    items: [
      { Icon: FiMail, title: "Contact Us", desc: "Send a message or book a demo", to: "/contact-us" },
    ],
  },
];

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
    <span className="min-w-0 flex-1">
      <span className="block text-[12.5px] font-semibold leading-tight text-neutral-800 group-hover:text-neutral-900">
        {title}
      </span>
      <span className="mt-0.5 block text-[11px] leading-relaxed text-neutral-400">
        {desc}
      </span>
    </span>
    <FiArrowRight
      size={11}
      className="mt-1 flex-shrink-0 text-indigo-400 opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100"
    />
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
              Work With Us
            </span>

            <h2 className="text-[15px] font-bold leading-snug text-white">
              Start a project, see our work, or join the team.
            </h2>

            <p className="mt-3 text-[11.5px] leading-relaxed text-white/50">
              Quick paths for prospects, partners, and future Expresso team
              members.
            </p>

            <div className="mt-auto pt-6">
              <div className="mb-4 h-px w-full bg-white/8" />
              <Link
                to="/contact-us"
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-indigo-300 transition-colors hover:text-white"
              >
                Schedule a conversation <FiArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-l border-neutral-100 bg-white px-5 py-5">
          <div className="grid grid-cols-4 gap-x-2">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <Item key={item.title} {...item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
