import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { usePortfolioItems } from "../../hooks/usePortfolioItems";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImageSetting } from "../../utils/websiteImages";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import FinalCTASection from "../../components/FinalCTASection/FinalCTASection";

const BRAND = "#7F8AD1";
const CATS = ["All", "Website Design", "Social Media"];

export default function PortfolioGalleryPage() {
  const navigate = useNavigate();
  const settings = useSiteSettings();
  const { items: resolved } = usePortfolioItems();
  const [active, setActive] = useState("All");

  const filtered = useMemo(
    () => active === "All" ? resolved : resolved.filter((p) => p.category === active),
    [resolved, active]
  );

  const heroBg = resolveWebsiteImageSetting(settings, "/80.jpg", settings?.portfolio?.heroImageUrl);

  return (
    <div className="bg-white">

      {/* ─── Banner ─────────────────────────────────────────────────────── */}
      <ServiceBanner
        heading="Our Portfolio"
        subHeading="Selected work across web, social, and performance marketing. Every project built to move people from attention to action."
        backgroundImage={heroBg}
        ctaText="Start a Project"
        ctaLink="/contact-us"
        badgeText="WORK"
        badgeText2="Selected Projects"
        overlayOpacity={0.66}
        showLogos={false}
      />

      {/* ─── Filter bar ─────────────────────────────────────────────────── */}
      <section className="sticky top-[92px] z-30 border-y border-white/10 bg-[#05060A]/95 text-white shadow-[0_18px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
        <div className="mx-auto flex w-[min(1200px,94vw)] flex-col gap-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: BRAND }}>
              Selected work
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
              Digital projects with a cleaner path from first look to action.
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 no-scrollbar">
            {CATS.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={[
                  "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all",
                  active === cat
                    ? "text-black shadow-[0_10px_28px_rgba(127,138,209,0.32)]"
                    : "text-white/48 hover:text-white",
                ].join(" ")}
                style={active === cat ? { background: "linear-gradient(135deg, #7F8AD1 0%, #DDE1FF 130%)" } : {}}
              >
                {cat}
              </button>
            ))}
            </div>
            <span className="hidden shrink-0 text-[12px] font-semibold text-white/40 sm:inline">
              {String(filtered.length).padStart(2, "0")} projects
            </span>
          </div>
        </div>
      </section>

      {/* ─── Projects ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {filtered.map((project, i) => (
            <ProjectRow
              key={project._id}
              project={project}
              index={i}
              total={filtered.length}
              flip={i % 2 !== 0}
              navigate={navigate}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ─── CTA ────────────────────────────────────────────────────────── */}
      <FinalCTASection
        badge="LET'S BUILD TOGETHER"
        heading="Your brand deserves"
        headingHighlight="to be on this page"
        description="We build websites, run campaigns, and create content that generates results. Tell us what you need."
        primaryLabel="Start a Project"
        secondaryLabel="View Case Studies"
        secondaryLink="/case-studies"
      />
    </div>
  );
}

/* ─── Single project row ────────────────────────────────────────────────────── */

function ProjectRow({ project, index, total, flip, navigate }) {
  const go = () => navigate(`/case-studies/${project._id}`);
  const num = String(index + 1).padStart(2, "0");

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-neutral-100 bg-white last:border-0"
    >
      <div
        className={[
          "mx-auto grid w-[min(1240px,94vw)] grid-cols-1 items-center gap-8 py-12 md:py-16 lg:grid-cols-2 lg:gap-14",
          flip ? "lg:[&>*:first-child]:order-2" : "",
        ].join(" ")}
      >

        {/* ── Image side ──────────────────────────────────────────────── */}
        <div
          className="group relative cursor-pointer overflow-hidden rounded-[28px] bg-[#F4F4F7] shadow-[0_28px_80px_rgba(15,15,20,0.10)]"
          onClick={go}
        >
          <motion.img
            src={project.thumbnailImg}
            alt={project.clientName}
            className="aspect-[16/11] w-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Hover CTA overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-500 group-hover:bg-black/30">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileHover={{ opacity: 1, scale: 1 }}
              className="pointer-events-none"
            >
              <span
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white opacity-0 shadow-xl transition-all duration-300 group-hover:opacity-100"
                style={{ backgroundColor: BRAND }}
              >
                View Case Study <FiArrowRight size={14} />
              </span>
            </motion.div>
          </div>

          {/* Category badge */}
          <div className="absolute left-5 top-5">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-black/45 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
              {project.category}
            </span>
          </div>
        </div>

        {/* ── Text side ───────────────────────────────────────────────── */}
        <div className="relative flex flex-col justify-center overflow-hidden px-1 py-2 md:px-4 lg:px-8">

          {/* Large ghost number */}
          <span
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none text-[clamp(92px,12vw,160px)] font-black leading-none"
            style={{ color: BRAND, opacity: 0.06 }}
          >
            {num}
          </span>

          <div className="relative z-10">
            {/* Index + total */}
            <div className="mb-6 flex items-center gap-3">
              <span
                className="text-[11px] font-black tracking-[0.2em]"
                style={{ color: BRAND }}
              >
                {num}
              </span>
              <div className="h-px flex-1 max-w-[40px] bg-neutral-200" />
              <span className="text-[11px] text-neutral-300">
                {String(total).padStart(2, "0")}
              </span>
            </div>

            {/* Client name */}
            <h2 className="text-[clamp(1.9rem,3.5vw,2.8rem)] font-black leading-[1.05] tracking-tight text-neutral-950">
              {project.clientName}
            </h2>

            {/* Tagline */}
            <p className="mt-1 text-[14px] font-semibold" style={{ color: BRAND }}>
              {project.category}
            </p>

            {/* Description */}
            <p className="mt-5 max-w-xl text-[15px] leading-[1.8] text-neutral-600 md:text-base">
              {project.bannerDesc}
            </p>

            {/* Key solutions preview */}
            {(project.solutions ?? []).length > 0 && (
              <ul className="mt-6 space-y-2">
                {project.solutions.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-neutral-500">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: BRAND }}
                    />
                    {s}
                  </li>
                ))}
              </ul>
            )}

            {/* CTA */}
            <button
              onClick={go}
              className="group mt-8 inline-flex w-fit items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-1.5 py-1.5 pl-5 text-[14px] font-bold text-neutral-900 shadow-[0_12px_30px_rgba(15,15,20,0.06)] transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_18px_40px_rgba(15,15,20,0.10)]"
            >
              View Case Study
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 group-hover:translate-x-1"
                style={{ backgroundColor: BRAND }}
              >
                <FiArrowRight size={14} color="white" />
              </span>
            </button>
          </div>
        </div>

      </div>
    </motion.section>
  );
}
