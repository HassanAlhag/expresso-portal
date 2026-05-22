import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiZap } from "react-icons/fi";

const BRAND      = "#6366f1";
const BRAND_BG   = "rgba(99,102,241,0.1)";
const BRAND_GLOW = "rgba(99,102,241,0.18)";

let _cache = null;

const Item = ({ title, description, slug }) => (
  <Link
    to={slug ? `/service/${slug}` : "/services"}
    className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 hover:bg-neutral-50"
  >
    <span
      className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-110"
      style={{ backgroundColor: BRAND_BG, color: BRAND }}
    >
      <FiZap size={14} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[12.5px] font-semibold leading-tight text-neutral-800 group-hover:text-neutral-900">
        {title}
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-400 line-clamp-2">
        {description}
      </p>
    </div>
    <FiArrowRight
      size={11}
      className="mt-1 flex-shrink-0 opacity-0 text-indigo-400 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0.5"
    />
  </Link>
);

export default function OurServicesDropdown() {
  const [services, setServices] = useState(_cache || []);

  useEffect(() => {
    if (_cache) return;
    fetch("/api/web-content/services")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.items)) {
          _cache = d.items;
          setServices(d.items);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="grid grid-cols-[210px_1fr]">

        {/* Left dark panel */}
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
                borderColor : "rgba(99,102,241,0.35)",
                backgroundColor: "rgba(99,102,241,0.08)",
                color: "#a5b4fc",
              }}
            >
              Digital Services
            </span>

            <h2 className="text-[15px] font-bold leading-snug text-white">
              Marketing &amp; digital solutions built to grow.
            </h2>

            <p className="mt-3 text-[11.5px] leading-relaxed text-white/50">
              Websites, apps, social media, SEO, ads, and video — all under one roof.
            </p>

            <div className="mt-auto pt-6">
              <div className="mb-4 h-px w-full bg-white/8" />
              <Link
                to="/services"
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-indigo-300 transition-colors hover:text-white"
              >
                Explore all services <FiArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right white panel */}
        <div className="border-l border-neutral-100 bg-white px-5 py-5">
          {services.length > 0 ? (
            <div className="grid grid-cols-4 gap-x-1 gap-y-0.5">
              {services.map((s) => (
                <Item key={s._id} title={s.title} description={s.description} slug={s.slug} />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center py-10">
              <p className="text-[12px] text-neutral-400">Loading services…</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
