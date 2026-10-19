import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { CAS_PRODUCT, CAS_HERO, CAS_IMAGES } from "../../../data/casProduct";

const BRAND = "#8390C8";

export default function CASHero() {
  const { adminDashboard } = CAS_IMAGES;

  return (
    <section className="relative overflow-hidden bg-[#05060A] pt-32 pb-16 text-white sm:pt-36 md:pb-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(780px circle at 12% 12%, rgba(131,144,200,0.24), transparent 40%), radial-gradient(900px circle at 92% 8%, rgba(255,255,255,0.06), transparent 34%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,10,0)_0%,rgba(5,6,10,0.85)_100%)]" />

      <div className="relative mx-auto grid w-[min(1200px,92vw)] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-white/70">
            <span
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: BRAND }}
            />
            {CAS_HERO.eyebrow}
          </div>

          <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
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
              className="inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-bold text-black shadow-[0_16px_50px_rgba(131,144,200,0.30)] transition hover:brightness-110 active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(131,144,200,1) 0%, rgba(220,225,255,0.95) 110%)",
              }}
            >
              {CAS_PRODUCT.demoCtaLabel}
              <FiArrowRight size={15} />
            </Link>

            <Link
              to={CAS_PRODUCT.contactHref}
              className="inline-flex items-center rounded-2xl border border-white/12 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10"
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
