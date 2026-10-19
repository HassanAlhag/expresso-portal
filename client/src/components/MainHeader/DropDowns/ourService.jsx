import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCode,
  FiPenTool,
  FiSearch,
  FiShare2,
  FiTarget,
  FiUsers,
  FiVideo,
} from "react-icons/fi";

const BRAND      = "#6366f1";
const BRAND_BG   = "rgba(99,102,241,0.1)";
const BRAND_GLOW = "rgba(99,102,241,0.18)";

const API = process.env.REACT_APP_API_URL || "/api";
let _cache = null;

const SERVICE_ICONS = {
  "web-dev": FiCode,
  "seo-marketing": FiSearch,
  "google-ads": FiTarget,
  "social-media-marketing": FiShare2,
  videography: FiVideo,
  "content-creation": FiPenTool,
};

const SERVICE_TITLE_ICONS = {
  "website & app development": FiCode,
  seo: FiSearch,
  "google ads": FiTarget,
  "social media management": FiUsers,
  videography: FiVideo,
  "content creation": FiPenTool,
};

const getServiceIcon = (service = {}) =>
  SERVICE_ICONS[service.slug] ||
  SERVICE_TITLE_ICONS[String(service.title || "").toLowerCase()] ||
  FiUsers;

const Item = ({ title, description, slug, Icon }) => (
  <Link
    to={slug ? `/service/${slug}` : "/services"}
    className="group flex h-full min-h-[76px] items-start gap-3 rounded-2xl px-3 py-3 transition-all duration-150 hover:bg-neutral-50"
  >
    <span
      className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-110"
      style={{ backgroundColor: BRAND_BG, color: BRAND }}
    >
      <Icon size={14} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[12px] font-semibold leading-snug text-neutral-800 group-hover:text-neutral-900">
        {title}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-neutral-400">
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
    fetch(`${API}/web-content/services`)
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
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 xl:grid-cols-3 xl:gap-x-3 xl:gap-y-3">
              {services.map((s) => {
                const Icon = getServiceIcon(s);

                return (
                  <Item
                    key={s._id}
                    title={s.title}
                    description={s.description}
                    slug={s.slug}
                    Icon={Icon}
                  />
                );
              })}
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
