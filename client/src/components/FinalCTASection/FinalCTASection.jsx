import React from "react";
import { ArrowUpRight } from "lucide-react";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";

const BRAND = "#7F8AD1";

export default function FinalCTASection({
  onPrimaryClick,
  badge = "READY TO MOVE?",
  heading = "Let's turn your idea",
  headingHighlight = "into a clear growth plan",
  description = "Tell us your goal, your style, and what you need. We'll help shape the right direction for your brand, website, or campaign.",
  primaryLabel = "Build Your Plan",
  secondaryLabel = "Schedule a Call",
  secondaryLink = "/contact",
}) {
  const settings = useSiteSettings();
  const logo = resolveWebsiteImage(settings, "/logo.png");

  return (
    <section className="mx-auto w-[min(1200px,92vw)] pb-20 md:pb-28">
      <div className="relative overflow-hidden rounded-[36px] border border-white/[0.07] bg-[#0B0B11] px-8 py-14 text-white shadow-[0_32px_100px_rgba(0,0,0,0.28)] sm:px-12 sm:py-20">

        {/* Dot-grid texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(127,138,209,0.22) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Glow orbs */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: BRAND, opacity: 0.24 }}
        />
        <div
          className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: BRAND, opacity: 0.14 }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ backgroundColor: BRAND, opacity: 0.06 }}
        />

        {/* Top edge glow line */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(127,138,209,0.6) 50%, transparent 100%)",
          }}
        />

        {/* Logo watermark */}
        <img
          src={logo}
          alt=""
          className="pointer-events-none absolute right-8 top-8 h-24 w-24 object-contain opacity-[0.04]"
          draggable={false}
        />

        {/* Content */}
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-white/70">
            <span
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: BRAND }}
            />
            {badge}
          </div>

          <h2 className="mt-6 text-4xl font-black tracking-tight leading-[1.08] sm:text-5xl md:text-6xl">
            {heading}{" "}
            <span style={{ color: BRAND }}>{headingHighlight}</span>
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
            {description}
          </p>
        </div>

        <div className="relative z-10 mt-10 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={onPrimaryClick}
            className="inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-bold text-black shadow-[0_16px_50px_rgba(127,138,209,0.30)] transition hover:brightness-110 active:scale-[0.98]"
            style={{
              background:
                "linear-gradient(135deg, rgba(127,138,209,1) 0%, rgba(220,225,255,0.95) 110%)",
            }}
          >
            {primaryLabel}
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </button>

          <a
            href={secondaryLink}
            className="inline-flex items-center rounded-2xl border border-white/12 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 hover:border-white/20"
          >
            {secondaryLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
