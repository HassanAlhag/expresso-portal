import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiChevronRight } from "react-icons/fi";
import { BrandMark } from "../../../brand";
import { CAS_PRODUCT, CAS_HERO, CAS_IMAGES } from "../../../data/casProduct";

const BRAND = "#8390C8";

export default function CASHero() {
  const { adminDashboard } = CAS_IMAGES;

  return (
    <section className="relative overflow-hidden bg-night pt-32 pb-16 text-white sm:pt-36 md:pb-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(780px circle at 12% 12%, rgba(131,144,200,0.24), transparent 40%), radial-gradient(900px circle at 92% 8%, rgba(255,255,255,0.06), transparent 34%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(21,18,31,0)_0%,rgba(21,18,31,0.85)_100%)]" />

      <div className="relative mx-auto grid w-[min(1200px,92vw)] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-10">
        <div>
          <nav aria-label="Breadcrumb" className="text-[13px] font-medium text-white/55">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link to="/digital-solutions" className="transition hover:text-white">
                  {CAS_HERO.eyebrow}
                </Link>
              </li>
              <li aria-hidden="true">
                <FiChevronRight size={13} />
              </li>
              <li aria-current="page" className="text-white/80">
                {CAS_PRODUCT.name}
              </li>
            </ol>
          </nav>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-lotus-300/35 bg-lotus-400/15 py-1.5 pl-2.5 pr-3.5 text-[12px] font-bold text-lotus-200">
            <BrandMark size={18} tone="white" />
            {CAS_PRODUCT.badge}
          </div>

          <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
            {CAS_HERO.heading}
          </h1>

          <p
            className="mt-3 text-lg font-semibold sm:text-xl"
            style={{ color: BRAND }}
          >
            {CAS_HERO.descriptor}
          </p>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
            {CAS_HERO.supporting}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to={CAS_PRODUCT.demoHref}
              className="inline-flex items-center gap-2.5 rounded-full bg-lotus-400 px-7 py-3.5 text-sm font-bold text-night transition hover:bg-lotus-300 active:scale-[0.98]"
            >
              {CAS_PRODUCT.demoCtaLabel}
              <FiArrowRight size={15} aria-hidden="true" />
            </Link>

            <Link
              to={CAS_PRODUCT.contactHref}
              className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10"
            >
              {CAS_PRODUCT.contactCtaLabel}
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[32px]">
          <div
            className="pointer-events-none absolute -inset-6 rounded-[32px] opacity-60 blur-2xl"
            style={{ backgroundColor: "rgba(131,144,200,0.18)" }}
          />
          <img
            src={adminDashboard.src}
            width={adminDashboard.width}
            height={adminDashboard.height}
            alt={adminDashboard.alt}
            loading="eager"
            fetchpriority="high"
            className="relative w-full rounded-2xl border border-white/10 object-cover object-top shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
            style={{ aspectRatio: `${adminDashboard.width} / ${adminDashboard.height}` }}
          />
        </div>
      </div>
    </section>
  );
}
