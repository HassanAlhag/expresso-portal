import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiCheck } from "react-icons/fi";
import { usePortfolioItem } from "../../hooks/usePortfolioItem";
import { usePortfolioItems } from "../../hooks/usePortfolioItems";
import ShiftingContactForm from "../../components/ContactForm/contactForm";

const BRAND = "#7F8AD1";
const BRAND_DIM = "rgba(127,138,209,0.15)";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

export default function PrtofolioSingleViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { item: portfolio, loading } = usePortfolioItem(id);
  const { items: allItems } = usePortfolioItems();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-neutral-400">Project not found.</p>
      </div>
    );
  }

  const idx = allItems.findIndex((p) => p._id === portfolio._id);
  const prev = idx > 0 ? allItems[idx - 1] : null;
  const next = idx < allItems.length - 1 ? allItems[idx + 1] : null;
  const total = allItems.length || 1;

  return (
    <div className="bg-white">
      <Hero portfolio={portfolio} idx={Math.max(0, idx)} total={total} />
      <MetaBar portfolio={portfolio} />
      <IntroSection portfolio={portfolio} />
      <ChallengeSection problems={portfolio.problems} />
      <SolutionsSection solutions={portfolio.solutions ?? []} solutionImage={portfolio.solutionImage} />
      {(portfolio.imageUrls ?? []).length > 0 && (
        <GallerySection images={portfolio.imageUrls} clientName={portfolio.clientName} />
      )}
      <ResultSection result={portfolio.result} clientName={portfolio.clientName} />
      <NextPrevNav prev={prev} next={next} navigate={navigate} />
      <ShiftingContactForm />
    </div>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────────────────── */

function Hero({ portfolio, idx, total }) {
  const num = String(idx + 1).padStart(2, "0");

  return (
    <section className="relative overflow-hidden bg-[#05060A] pt-28 text-white md:pt-32">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(780px circle at 15% 18%, rgba(127,138,209,0.22), transparent 34%), radial-gradient(900px circle at 88% 10%, rgba(255,255,255,0.08), transparent 32%)",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,10,0)_0%,rgba(5,6,10,0.72)_100%)]" />

      {/* Project number — large faded */}
      <div className="pointer-events-none absolute right-4 top-36 select-none text-[clamp(120px,18vw,230px)] font-black leading-none text-white/[0.045]">
        {num}
      </div>

      {/* Back link */}
      <div className="relative z-20 mx-auto mb-8 w-[min(1180px,92vw)]">
        <Link
          to="/case-studies"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-semibold text-white/70 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10 hover:text-white"
        >
          <FiArrowLeft size={13} />
          All Projects
        </Link>
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto grid w-[min(1180px,92vw)] items-end gap-10 pb-16 md:pb-20 lg:grid-cols-[0.9fr_1.1fr]"
      >
        <div>
          {/* Category pill */}
          <motion.div variants={reveal} initial="hidden" animate="show" custom={0.5}>
            <span
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{
                borderColor: "rgba(127,138,209,0.35)",
                backgroundColor: "rgba(127,138,209,0.1)",
                color: "#c6ccff",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRAND }} />
              {portfolio.category}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={reveal} initial="hidden" animate="show" custom={1}
            className="max-w-[680px] text-[clamp(2.35rem,5.4vw,4.7rem)] font-black leading-[0.98] tracking-tight text-white"
          >
            {portfolio.bannerTitle}
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={reveal} initial="hidden" animate="show" custom={1.5}
            className="mt-6 max-w-xl text-[15px] leading-[1.85] text-white/68 md:text-base"
          >
            {portfolio.bannerDesc}
          </motion.p>

          {/* Client + divider */}
          <motion.div
            variants={reveal} initial="hidden" animate="show" custom={2}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <div className="h-px w-10" style={{ backgroundColor: BRAND }} />
            <span className="text-[13px] font-semibold text-white/84">{portfolio.clientName}</span>
            <span className="text-white/25">·</span>
            <span className="text-[13px] text-white/52">{portfolio.startDate}</span>
          </motion.div>
        </div>

        <motion.div
          variants={reveal}
          initial="hidden"
          animate="show"
          custom={1.1}
          className="relative"
        >
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-2 shadow-[0_32px_100px_rgba(0,0,0,0.36)] backdrop-blur">
            <img
              src={portfolio.bannerImage}
              alt={portfolio.clientName}
              className="aspect-[16/10] w-full rounded-[22px] object-cover"
            />
          </div>
          <div className="absolute -bottom-5 left-6 rounded-2xl border border-white/10 bg-[#101118]/90 px-5 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/38">Case Study</p>
            <p className="mt-1 text-sm font-bold text-white">{num} / {String(total).padStart(2, "0")}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <motion.div
          animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.7, ease: "easeInOut" }}
          className="flex h-7 w-4 items-start justify-center rounded-full border border-white/20 p-1"
        >
          <div className="h-1.5 w-0.5 rounded-full bg-white/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── Meta bar ───────────────────────────────────────────────────────────────── */

function MetaBar({ portfolio }) {
  const items = [
    { label: "Client", value: portfolio.clientName },
    { label: "Service", value: portfolio.category },
    { label: "Started", value: portfolio.startDate },
    { label: "Delivered", value: portfolio.endDate },
  ];

  return (
    <motion.section
      variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}
      className="border-y border-neutral-100 bg-white"
    >
      <div className="mx-auto grid w-[min(1180px,92vw)] grid-cols-2 md:grid-cols-4">
        {items.map(({ label, value }, i) => (
          <div
            key={label}
            className={[
              "flex flex-col gap-1.5 py-6",
              i % 2 !== 0 ? "border-l border-neutral-100 pl-6 md:pl-8" : "pr-6 md:pr-8",
              i > 1 ? "border-t border-neutral-100 md:border-t-0" : "",
              i !== 0 ? "md:border-l md:border-neutral-100" : "",
            ].join(" ")}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{label}</span>
            <span className="text-[14px] font-semibold text-neutral-900">{value}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* ─── Intro ──────────────────────────────────────────────────────────────────── */

function IntroSection({ portfolio }) {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto w-[min(1180px,92vw)]">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">

          {/* Left — text */}
          <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-8" style={{ backgroundColor: BRAND }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: BRAND }}>
                Project Overview
              </span>
            </div>
            <p className="max-w-3xl text-[17px] leading-[1.85] text-neutral-600 md:text-[18px]">
              {portfolio.introDescription}
            </p>

            {/* Highlight tags */}
            <div className="mt-8 flex flex-wrap gap-2">
              {["Strategy", "Design", "Development", "Performance"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-xs font-semibold text-neutral-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right — image */}
          <motion.div
            variants={reveal} initial="hidden" whileInView="show" custom={0.5} viewport={{ once: true }}
            className="relative lg:sticky lg:top-28"
          >
            <div className="relative overflow-hidden rounded-[28px] bg-neutral-100 p-2 shadow-[0_26px_80px_rgba(15,15,20,0.10)]">
              <img
                src={portfolio.solutionImage}
                alt={portfolio.clientName}
                className="h-[340px] w-full rounded-[22px] object-cover md:h-[410px]"
              />
              {/* Overlay badge */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-5 pb-5 pt-12">
                <span className="text-[11px] font-semibold text-white/80">{portfolio.clientName}</span>
                <p className="mt-0.5 text-sm font-bold text-white">{portfolio.category}</p>
              </div>
            </div>
            {/* Decorative dot grid */}
            <div
              className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 opacity-40"
              style={{
                backgroundImage: `radial-gradient(circle, ${BRAND} 1px, transparent 1px)`,
                backgroundSize: "8px 8px",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Challenge ──────────────────────────────────────────────────────────────── */

function ChallengeSection({ problems }) {
  return (
    <section className="relative overflow-hidden bg-[#05060A] py-20 md:py-24">
      {/* BG glow */}
      <div className="pointer-events-none absolute -left-32 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full blur-[120px]"
        style={{ backgroundColor: "rgba(127,138,209,0.08)" }} />

      <div className="relative mx-auto w-[min(1180px,92vw)]">
        {/* Section label */}
        <motion.div
          variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="mb-10"
        >
          <div className="flex items-center gap-3">
            <div className="h-px w-8" style={{ backgroundColor: BRAND }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: BRAND }}>
              The Challenge
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.42fr_1fr] lg:gap-16">
          {/* Left — heading */}
          <motion.div
            variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="max-w-sm"
          >
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-black leading-tight text-white">
              What needed<br />to change
            </h2>
          </motion.div>

          {/* Right — content */}
          <motion.div
            variants={reveal} initial="hidden" whileInView="show" custom={0.5} viewport={{ once: true }}
            className="relative rounded-[28px] border border-white/10 bg-white/[0.045] p-7 shadow-[0_26px_80px_rgba(0,0,0,0.18)] md:p-9"
          >
            <div
              className="absolute -left-8 top-0 bottom-0 hidden w-px lg:block"
              style={{ backgroundColor: "rgba(127,138,209,0.3)" }}
            />
            {/* Large quote mark */}
            <div className="mb-4 text-5xl font-black leading-none" style={{ color: BRAND, opacity: 0.3 }}>
              "
            </div>
            <p className="text-[16px] leading-[1.9] text-white/70 md:text-[17px]">
              {problems}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Solutions ──────────────────────────────────────────────────────────────── */

function SolutionsSection({ solutions, solutionImage }) {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto w-[min(1180px,92vw)]">
        {/* Header */}
        <motion.div
          variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-3">
            <div className="h-px w-8" style={{ backgroundColor: BRAND }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: BRAND }}>
              Our Approach
            </span>
          </div>
          <h2 className="mt-4 text-[clamp(1.8rem,3.5vw,2.8rem)] font-black tracking-tight text-neutral-950">
            How we solved it
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_0.92fr] lg:gap-14">
          {/* Solutions list */}
          <div className="flex flex-col gap-4">
            {solutions.map((s, i) => (
              <motion.div
                key={i}
                variants={reveal} initial="hidden" whileInView="show" custom={i * 0.4} viewport={{ once: true }}
                className="flex items-start gap-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_12px_40px_rgba(15,15,20,0.035)] transition hover:-translate-y-0.5 hover:border-neutral-200 hover:shadow-[0_16px_44px_rgba(15,15,20,0.08)]"
              >
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  <FiCheck size={13} />
                </span>
                <p className="text-[14px] leading-relaxed text-neutral-700">{s}</p>
              </motion.div>
            ))}
          </div>

          {/* Visual side */}
          <motion.div
            variants={reveal} initial="hidden" whileInView="show" custom={0.3} viewport={{ once: true }}
            className="relative hidden lg:block"
          >
            <div className="relative h-full min-h-[380px] overflow-hidden rounded-[28px] bg-neutral-100 p-2 shadow-[0_26px_80px_rgba(15,15,20,0.10)]">
              <img
                src={solutionImage}
                alt="Solution visual"
                className="h-full w-full rounded-[22px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
              {/* Corner label */}
              <div className="absolute right-4 top-4 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur">
                Delivered ✓
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Gallery ────────────────────────────────────────────────────────────────── */

function GallerySection({ images, clientName }) {
  const [featured, ...rest] = images;

  return (
    <section className="bg-[#05060A] py-20 md:py-24">
      <div className="mx-auto w-[min(1180px,92vw)]">
        {/* Header */}
        <motion.div
          variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="mb-12 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="h-px w-8" style={{ backgroundColor: BRAND }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: BRAND }}>
                Deliverables
              </span>
            </div>
            <h2 className="mt-4 text-[clamp(1.8rem,3.5vw,2.8rem)] font-black tracking-tight text-white">
              Project Gallery
            </h2>
          </div>
          <p className="text-[13px] font-medium text-white/30">
            {clientName} · {images.length} screens
          </p>
        </motion.div>

        {/* Featured image */}
        {featured && (
          <motion.div
            variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="mb-5 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-2 shadow-[0_28px_90px_rgba(0,0,0,0.30)]"
          >
            <img
              src={featured.src}
              alt={featured.alt || `${clientName} featured`}
              className="h-[320px] w-full rounded-[22px] object-cover transition-transform duration-700 hover:scale-[1.02] md:h-[520px]"
            />
          </motion.div>
        )}

        {/* Remaining in 3-col grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {rest.map((img, i) => (
              <motion.div
                key={i}
                variants={reveal} initial="hidden" whileInView="show" custom={i * 0.2} viewport={{ once: true }}
                className={[
                  "overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] p-1.5",
                  i === 0 ? "md:col-span-2" : "",
                ].join(" ")}
              >
                <img
                  src={img.src}
                  alt={img.alt || `${clientName} screen ${i + 2}`}
                  className="h-[220px] w-full rounded-[17px] object-cover transition-transform duration-700 hover:scale-[1.03] md:h-[280px]"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Result ─────────────────────────────────────────────────────────────────── */

function ResultSection({ result, clientName }) {
  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-24">
      {/* BG decoration */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] -translate-y-1/4 translate-x-1/4 rounded-full blur-[100px]"
        style={{ backgroundColor: BRAND_DIM }}
      />

      <div className="relative mx-auto w-[min(900px,92vw)]">
        <motion.div
          variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="rounded-[28px] border border-neutral-100 bg-white px-6 py-10 shadow-[0_24px_90px_rgba(15,15,20,0.06)] sm:px-10 md:py-14"
        >
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="h-px w-8" style={{ backgroundColor: BRAND }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: BRAND }}>
              The Outcome
            </span>
            <div className="h-px w-8" style={{ backgroundColor: BRAND }} />
          </div>

          {/* Large decorative quote */}
          <div
            className="mb-2 text-center text-[72px] font-black leading-none"
            style={{ color: BRAND, opacity: 0.18 }}
          >
            "
          </div>

          <blockquote className="text-center text-[18px] font-medium leading-[1.8] text-neutral-600 md:text-[20px]">
            {result}
          </blockquote>

          {/* Attribution */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <div className="h-px flex-1 max-w-[80px] bg-neutral-200" />
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-black text-white"
                style={{ backgroundColor: BRAND }}
              >
                {clientName.charAt(0)}
              </div>
              <div>
                <p className="text-[13px] font-bold text-neutral-900">{clientName}</p>
                <p className="text-[11px] text-neutral-400">Client</p>
              </div>
            </div>
            <div className="h-px flex-1 max-w-[80px] bg-neutral-200" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Next / Prev ────────────────────────────────────────────────────────────── */

function NextPrevNav({ prev, next, navigate }) {
  if (!prev && !next) return null;

  return (
    <section className="border-t border-neutral-100 bg-neutral-50 py-6">
      <div className="mx-auto w-[min(1180px,92vw)]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {prev ? (
            <button
              onClick={() => navigate(`/case-studies/${prev._id}`)}
              className="group flex items-center gap-5 rounded-2xl border border-neutral-200 bg-white px-5 py-6 text-left shadow-[0_12px_36px_rgba(15,15,20,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(15,15,20,0.08)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 transition group-hover:border-neutral-900 group-hover:text-neutral-900">
                <FiArrowLeft size={16} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Previous</p>
                <p className="mt-1 text-[15px] font-bold text-neutral-900">{prev.clientName}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{prev.category}</p>
              </div>
            </button>
          ) : <div />}

          {next ? (
            <button
              onClick={() => navigate(`/case-studies/${next._id}`)}
              className="group flex items-center justify-end gap-5 rounded-2xl border border-neutral-200 bg-white px-5 py-6 text-right shadow-[0_12px_36px_rgba(15,15,20,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(15,15,20,0.08)]"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Next Project</p>
                <p className="mt-1 text-[15px] font-bold text-neutral-900">{next.clientName}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{next.category}</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 transition group-hover:border-neutral-900 group-hover:text-neutral-900">
                <FiArrowRight size={16} />
              </span>
            </button>
          ) : <div />}
        </div>
      </div>
    </section>
  );
}
