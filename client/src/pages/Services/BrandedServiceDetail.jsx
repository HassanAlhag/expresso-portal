import React, { useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiArrowUpRight, FiCheck, FiChevronDown, FiCode, FiEdit3, FiFileText, FiLayout, FiLink, FiSearch,
  FiShoppingCart, FiSliders, FiSmartphone, FiTool, FiZap,
} from "react-icons/fi";
import { BrandMark, SectionEyebrow, NIGHT, lotusAlpha } from "../../brand";
import { ServiceTechRibbon } from "../../components/ServicesBanner/servicesBanner";
import { toWebsiteImageUrl } from "../../utils/websiteImages";
import { usePortfolioItems } from "../../hooks/usePortfolioItems";
import {
  WEB_BUILDS, WEB_ENGINEERING, WEB_STATEMENT, WEB_WORK, WEB_FINAL_CTA, isWebsiteCaseStudy,
} from "../../data/webDevelopmentContent";
import { SEO_SERVICES_INTRO, SEO_WHY } from "../../data/seoMarketingContent";

// Brand reference landing page for a service (approved direction: CAS /
// Digital Solutions / Business Suite). The page's own copy comes unchanged
// from its CMS service record; supporting sections reuse existing, approved
// repository content (data/webDevelopmentContent.js) and the published
// website case studies. Nothing here invents claims, figures or work.
//
// Used for the slugs in SERVICE_SUPPORT below (approved one by one); other
// slugs keep the existing rendering (see ServiceDetailPage).

const CONTAINER = "mx-auto w-[min(1200px,92vw)]";

// Per-service supporting sections, each built only from existing repository
// content for that service (see the data modules for sources).
const SERVICE_SUPPORT = {
  "web-dev": {
    pricingLink: WEB_ENGINEERING.pricingLink,
    builds: true,
    showcase: true,
    why: { title: WEB_ENGINEERING.title, text: WEB_ENGINEERING.text, statement: WEB_STATEMENT, features: WEB_ENGINEERING.features },
  },
  "seo-marketing": {
    pricingLink: SEO_WHY.pricingLink,
    stepsIntro: SEO_SERVICES_INTRO,
    // The statement is the service record's own description.
    why: { title: SEO_WHY.title, text: SEO_WHY.text, statement: null, features: SEO_WHY.features },
  },
};
export const BRANDED_SERVICE_SLUGS = Object.freeze(Object.keys(SERVICE_SUPPORT));
const H2 = "m-0 font-bold leading-[1.04] tracking-tight";

function CtaLink({ to, className, children }) {
  const href = to || "/contact-us";
  return href.startsWith("/") ? (
    <Link to={href} className={className}>{children}</Link>
  ) : (
    <a href={href} className={className}>{children}</a>
  );
}

const PRIMARY_DARK = "inline-flex items-center gap-2 rounded-full bg-lotus-400 px-6 py-3.5 text-sm font-bold text-night transition-colors hover:bg-lotus-300";
const SECONDARY_DARK = "inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10";
const PRIMARY_LIGHT = "inline-flex items-center gap-2 rounded-full bg-night px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-lotus-900";

// A neutral browser window around a real image (decorative chrome only).
function BrowserFrame({ src, alt, dark = false, className = "", imgClassName = "", eager = false }) {
  return (
    <div className={`overflow-hidden rounded-2xl border ${dark ? "border-white/10 bg-[#1C1928]" : "border-ink-200 bg-white"} ${className}`}>
      <div aria-hidden="true" className={`flex items-center gap-1.5 border-b px-4 py-2.5 ${dark ? "border-white/10" : "border-ink-200 bg-mist"}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${dark ? "bg-white/25" : "bg-ink-200"}`} />
        <span className={`h-2.5 w-2.5 rounded-full ${dark ? "bg-white/15" : "bg-ink-200"}`} />
        <span className={`h-2.5 w-2.5 rounded-full ${dark ? "bg-lotus-400/70" : "bg-lotus-300"}`} />
        <span className={`ml-3 h-4 w-full max-w-[220px] rounded-full ${dark ? "bg-white/[0.07]" : "bg-white"}`} />
      </div>
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        draggable={false}
        className={`block w-full bg-white object-cover object-top ${imgClassName}`}
      />
    </div>
  );
}

function CodeCard({ className = "" }) {
  const lines = [
    "w-3/4 bg-lotus-400/80", "w-1/2 bg-white/25", "ml-4 w-5/6 bg-white/15", "ml-4 w-2/3 bg-lotus-300/50", "ml-8 w-1/2 bg-white/15", "w-1/3 bg-white/25",
  ];
  return (
    <div aria-hidden="true" className={`rounded-2xl border border-white/10 bg-[#1C1928]/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${className}`}>
      <div className="mb-3 flex gap-1.5">
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-lotus-400/70" />
      </div>
      <div className="flex flex-col gap-2">
        {lines.map((l, i) => <span key={i} className={`h-1.5 rounded-full ${l}`} />)}
      </div>
    </div>
  );
}

// ─── A. Hero ──────────────────────────────────────────────────────────────────

function Hero({ service, pricingLink }) {
  const heading = service.heroHeading || service.title;
  const subHeading = service.heroSubheading || service.description;
  const ctaText = service.heroCtaText || "Get Started";
  const ctaLink = service.heroCtaLink || "/contact-us";
  const image = toWebsiteImageUrl(service.heroImageUrl || "");
  return (
    <section aria-labelledby="service-hero-title" className="relative overflow-hidden bg-night pb-16 pt-32 text-white sm:pt-36 md:pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(780px circle at 10% 8%, ${lotusAlpha(0.22)}, transparent 42%), radial-gradient(900px circle at 92% 12%, rgba(255,255,255,0.05), transparent 36%)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 70% 40%, black 10%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 70% 40%, black 10%, transparent 70%)",
        }}
      />
      <div className={`relative ${CONTAINER} grid items-center gap-12 lg:grid-cols-[1fr_1.02fr] lg:gap-12`}>
        <div className="flex min-w-0 flex-col items-start gap-6">
          {service.tag ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-lotus-300/35 bg-lotus-400/15 py-1.5 pl-2 pr-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-lotus-200">
              <BrandMark size={18} tone="white" />
              {service.tag}
            </span>
          ) : null}
          <h1 id="service-hero-title" className="m-0 max-w-2xl text-4xl font-bold leading-[1.03] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            {heading}
          </h1>
          {subHeading ? <p className="m-0 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl">{subHeading}</p> : null}
          <div className="mt-2 flex flex-wrap gap-3 sm:gap-4">
            {ctaText ? (
              <CtaLink to={ctaLink} className={PRIMARY_DARK}>
                {ctaText}
                <FiArrowRight aria-hidden="true" />
              </CtaLink>
            ) : null}
            {pricingLink ? <Link to={pricingLink.to} className={SECONDARY_DARK}>{pricingLink.label}</Link> : null}
          </div>
        </div>

        {image ? (
          <div className="relative mx-auto w-full min-w-0 max-w-xl pb-6 lg:max-w-none lg:pb-0">
            <div aria-hidden="true" className="pointer-events-none absolute -inset-6 rounded-[40px] opacity-70 blur-3xl" style={{ backgroundColor: lotusAlpha(0.22) }} />
            <BrowserFrame
              dark
              eager
              src={image}
              alt=""
              className="relative shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
              imgClassName="aspect-[16/10]"
            />
            <CodeCard className="absolute -bottom-2 -left-3 hidden w-52 sm:block lg:-bottom-8 lg:-left-10 lg:w-60" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

// B. The approved moving technology strip, unchanged, right after the hero.
// The strip is tilted (-1deg), so its ends rise and fall by up to ~22px on very
// wide screens; the vertical room keeps both corners visible.
function TechRibbon() {
  return (
    <div
      className="overflow-hidden py-8"
      style={{ background: `linear-gradient(to bottom, ${NIGHT} 0%, ${NIGHT} 50%, #FFFFFF 50%, #FFFFFF 100%)` }}
    >
      <ServiceTechRibbon respectReducedMotion />
    </div>
  );
}

// ─── C. Intro / value ─────────────────────────────────────────────────────────

const CHIP_ICONS = [FiZap, FiSmartphone, FiSearch, FiEdit3];

function IntroBlock({ block, headingId }) {
  const descriptions = block.descriptions || [];
  const chips = block.chips || [];
  const hasCta = Boolean(block.ctaText || block.ctaLink);
  const hasVisual = Boolean(block.imageUrl || chips.length);
  return (
    <section aria-labelledby={block.title ? headingId : undefined} className="bg-white py-16 md:py-24">
      <div className={`${CONTAINER} grid items-center gap-12 lg:grid-cols-12 lg:gap-16`}>
        {/* Copy: one calm column. */}
        <div className={`flex min-w-0 flex-col items-start gap-5 ${hasVisual ? "lg:col-span-5" : "lg:col-span-12"}`}>
          {block.eyebrow ? <SectionEyebrow mark>{block.eyebrow}</SectionEyebrow> : null}
          {block.title ? (
            <h2 id={headingId} className={`${H2} text-4xl text-night sm:text-5xl lg:text-[3.25rem]`}>
              {block.title}
              {block.highlight ? <span className="block text-lotus-600"> {block.highlight}</span> : null}
            </h2>
          ) : null}
          {descriptions.map((t, i) => (
            <p key={i} className={`m-0 leading-relaxed ${i === 0 ? "mt-1 text-lg text-night" : "text-base text-ink-600"}`}>{t}</p>
          ))}
          {hasCta ? (
            <CtaLink to={block.ctaLink} className={`${PRIMARY_LIGHT} mt-3`}>
              {block.ctaText || "Contact Us"}
              <FiArrowRight aria-hidden="true" />
            </CtaLink>
          ) : null}
        </div>

        {/* Visual: framed illustration with the capability chips overlapping its lower edge. */}
        {hasVisual ? (
          <div className="relative min-w-0 lg:col-span-7">
            {block.imageUrl ? (
              <figure className="relative m-0 overflow-hidden rounded-[28px] border border-ink-200 bg-mist p-4 sm:p-6">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: `radial-gradient(${lotusAlpha(0.25)} 1px, transparent 1px)`, backgroundSize: "22px 22px" }} />
                <img
                  src={block.imageUrl}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="relative block aspect-[16/11] w-full rounded-2xl border border-ink-200 bg-white object-cover shadow-[0_16px_48px_rgba(21,18,31,0.10)]"
                />
              </figure>
            ) : null}
            {chips.length ? (
              <ul className={`relative z-10 m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4 ${block.imageUrl ? "-mt-10 px-3 sm:-mt-12 sm:px-6" : ""}`}>
                {chips.map((c, i) => {
                  const Icon = CHIP_ICONS[i % CHIP_ICONS.length];
                  const lead = i === 0;
                  return (
                    <li
                      key={i}
                      className={`flex flex-col items-start gap-3 rounded-[20px] border p-4 shadow-[0_18px_50px_rgba(21,18,31,0.10)] ${lead ? "border-night bg-night text-white" : "border-ink-200 bg-white text-night"}`}
                    >
                      <span aria-hidden="true" className={`flex h-9 w-9 items-center justify-center rounded-xl ${lead ? "bg-lotus-400 text-night" : "bg-lotus-50 text-lotus-600"}`}>
                        <Icon />
                      </span>
                      <span className="text-sm font-bold leading-snug">{c}</span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ─── D. What we build ─────────────────────────────────────────────────────────

const BUILD_ICONS = { react: FiCode, wordpress: FiLayout, ecommerce: FiShoppingCart };

function WhatWeBuild({ lead }) {
  const [featured, ...rest] = WEB_BUILDS.items;
  const FeaturedIcon = BUILD_ICONS[featured.key];
  return (
    <section aria-labelledby="web-builds-title" className="bg-mist py-16 md:py-24">
      <div className={`${CONTAINER} flex flex-col gap-10 md:gap-12`}>
        <div className="flex max-w-2xl flex-col items-start gap-3">
          <SectionEyebrow>{WEB_BUILDS.eyebrow}</SectionEyebrow>
          <h2 id="web-builds-title" className={`${H2} text-3xl text-night sm:text-4xl md:text-[2.75rem]`}>
            {WEB_BUILDS.title}
            <span className="text-lotus-400">.</span>
          </h2>
          {lead ? <p className="m-0 text-base leading-relaxed text-ink-600 sm:text-lg">{lead}</p> : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
          <article className="relative flex min-w-0 flex-col gap-6 overflow-hidden rounded-[28px] bg-night p-7 text-white sm:p-9 lg:col-span-7">
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: lotusAlpha(0.28) }} />
            <span aria-hidden="true" className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-lotus-400 text-xl text-night"><FeaturedIcon /></span>
            <div className="relative flex flex-col gap-3">
              <h3 className="m-0 text-2xl font-bold leading-tight text-white sm:text-3xl">{featured.title}</h3>
              <p className="m-0 max-w-lg text-base leading-relaxed text-white/70">{featured.desc}</p>
            </div>
            <ul className="relative m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
              {featured.points.map((p) => (
                <li key={p} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold">
                  <FiCheck aria-hidden="true" className="shrink-0 text-lotus-300" />
                  {p}
                </li>
              ))}
            </ul>
            <CodeCard className="relative mt-auto hidden w-full sm:block" />
          </article>

          <div className="flex min-w-0 flex-col gap-4 lg:col-span-5 lg:gap-5">
            {rest.map((item) => {
              const Icon = BUILD_ICONS[item.key];
              return (
                <article key={item.key} className="flex flex-1 flex-col gap-4 rounded-[28px] border border-ink-200 bg-white p-7">
                  <div className="flex items-center gap-4">
                    <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lotus-50 text-lg text-lotus-600"><Icon /></span>
                    <h3 className="m-0 text-xl font-bold leading-snug text-night">{item.title}</h3>
                  </div>
                  <p className="m-0 text-[15px] leading-relaxed text-ink-600">{item.desc}</p>
                  <ul className="m-0 mt-auto flex list-none flex-wrap gap-2 p-0">
                    {item.points.map((p) => (
                      <li key={p} className="rounded-full border border-ink-200 bg-mist px-3 py-1.5 text-[13px] font-semibold text-night">{p}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── E. Real website work (published case studies) ───────────────────────────

const caseImage = (item) => item.solutionImage || item.imageUrls?.[0]?.src || item.thumbnailImg || item.bannerImage || "";

function WorkShowcase() {
  const { items, loading, error } = usePortfolioItems();
  const published = (items || []).filter(isWebsiteCaseStudy).filter((item) => caseImage(item));
  // Feature the first study that has its own written summary; keep CMS order otherwise.
  const lead = published.find((item) => item.excerpt) || published[0];
  const work = lead ? [lead, ...published.filter((item) => item !== lead)].slice(0, 4) : [];
  if (loading || error || !work.length) return null;
  const [featured, ...others] = work;
  const caseLink = (item) => `/case-studies/${item._id}`;
  return (
    <section aria-labelledby="web-work-title" className="bg-white py-16 md:py-24">
      <div className={`${CONTAINER} flex flex-col gap-10 md:gap-12`}>
        <div className="flex max-w-2xl flex-col items-start gap-3">
          <SectionEyebrow mark>{WEB_WORK.eyebrow}</SectionEyebrow>
          <h2 id="web-work-title" className={`${H2} text-3xl text-night sm:text-4xl md:text-[2.75rem]`}>{WEB_WORK.title}</h2>
          <p className="m-0 text-base leading-relaxed text-ink-600 sm:text-lg">{WEB_WORK.text}</p>
          <Link to={WEB_WORK.link.to} className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-lotus-700 underline-offset-4 hover:underline">
            {WEB_WORK.link.label}
            <FiArrowRight aria-hidden="true" />
          </Link>
        </div>

        <article className="grid items-center gap-6 rounded-[28px] border border-ink-200 bg-mist p-4 sm:p-6 lg:grid-cols-12 lg:gap-10 lg:p-8">
          <BrowserFrame src={caseImage(featured)} alt={`${featured.title} website`} className="shadow-[0_24px_70px_rgba(21,18,31,0.14)] lg:col-span-8" imgClassName="aspect-[16/9]" />
          <div className="flex min-w-0 flex-col items-start gap-3 px-2 pb-2 lg:col-span-4 lg:px-0 lg:pb-0">
            {featured.category ? <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-lotus-600">{featured.category}</span> : null}
            <h3 className="m-0 text-2xl font-bold leading-tight text-night sm:text-3xl">{featured.title}</h3>
            {featured.bannerTitle ? <p className="m-0 text-lg font-semibold leading-snug text-lotus-700">{featured.bannerTitle}</p> : null}
            {featured.excerpt ? <p className="m-0 text-[15px] leading-relaxed text-ink-600">{featured.excerpt}</p> : null}
            <Link to={caseLink(featured)} className={`${PRIMARY_LIGHT} mt-2`}>
              {WEB_WORK.itemLinkLabel}
              <span className="sr-only"> — {featured.title}</span>
              <FiArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </article>

        {others.length ? (
          <div className={`grid gap-4 sm:grid-cols-2 lg:gap-5 ${others.length >= 3 ? "lg:grid-cols-3" : ""}`}>
            {others.map((item) => (
              <article key={item._id} className="group flex min-w-0 flex-col gap-4 rounded-[24px] border border-ink-200 bg-white p-3 transition-shadow hover:shadow-[0_18px_50px_rgba(21,18,31,0.10)]">
                <BrowserFrame src={caseImage(item)} alt={`${item.title} website`} imgClassName="aspect-[16/10]" />
                <div className="flex flex-1 flex-col items-start gap-2 px-2 pb-2">
                  {item.category ? <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-lotus-600">{item.category}</span> : null}
                  <h3 className="m-0 text-lg font-bold leading-snug text-night">{item.title}</h3>
                  {item.excerpt ? <p className="m-0 line-clamp-3 text-sm leading-relaxed text-ink-600">{item.excerpt}</p> : null}
                  <Link to={caseLink(item)} className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-bold text-lotus-700 underline-offset-4 hover:underline">
                    {WEB_WORK.itemLinkLabel}
                    <span className="sr-only"> — {item.title}</span>
                    <FiArrowUpRight aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ─── F. Process journey ───────────────────────────────────────────────────────

function ProcessBlock({ block, headingId }) {
  const steps = block.steps || [];
  if (!steps.length) return null;
  return (
    <section aria-labelledby={block.title ? headingId : undefined} className="relative overflow-hidden bg-night py-16 text-white md:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(800px circle at 85% 0%, ${lotusAlpha(0.16)}, transparent 45%)` }} />
      <div className={`relative ${CONTAINER} flex flex-col gap-12`}>
        {block.title || block.eyebrow ? (
          <div className="flex max-w-3xl flex-col items-start gap-3">
            {block.eyebrow ? <SectionEyebrow tone="dark">{block.eyebrow}</SectionEyebrow> : null}
            {block.title ? (
              <h2 id={headingId} className={`${H2} text-3xl text-white sm:text-4xl md:text-[2.75rem]`}>
                {block.title}
                <span className="text-lotus-400">.</span>
              </h2>
            ) : null}
            {block.lead ? <p className="m-0 text-base leading-relaxed text-white/70 sm:text-lg">{block.lead}</p> : null}
          </div>
        ) : null}

        <ol className="relative m-0 grid list-none gap-5 p-0 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-8 lg:pb-24">
          <span aria-hidden="true" className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-lotus-400/60 via-white/15 to-transparent lg:block" />
          {steps.map((s, idx) => {
            const nn = String(idx + 1).padStart(2, "0");
            const right = idx % 2 === 1;
            return (
              <li key={idx} className={`relative min-w-0 ${right ? "lg:translate-y-24" : ""}`}>
                <span
                  aria-hidden="true"
                  className={`absolute top-10 hidden h-9 w-9 items-center justify-center rounded-full border border-lotus-300/40 bg-night text-[11px] font-bold text-lotus-200 lg:flex ${right ? "-left-[3.125rem]" : "-right-[3.125rem]"}`}
                >
                  {nn}
                </span>
                <article className="grid gap-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  {s.image ? (
                    <div className="m-3 overflow-hidden rounded-[20px] bg-white sm:mr-0">
                      <img src={s.image} alt={s.callout} loading="lazy" className="block aspect-[16/10] h-full w-full object-cover sm:aspect-auto" />
                    </div>
                  ) : null}
                  <div className={`flex min-w-0 flex-col justify-center gap-2 p-6 sm:p-7 ${s.image ? "" : "sm:col-span-2"}`}>
                    <p className="m-0 text-[11px] font-bold tracking-[0.16em] text-lotus-300">
                      {nn} • {(s.callout || "").toUpperCase()}
                    </p>
                    {s.title ? <h3 className="m-0 text-xl font-bold leading-snug text-white sm:text-2xl">{s.title}</h3> : null}
                    {s.description ? <p className="m-0 text-[15px] leading-relaxed text-white/65">{s.description}</p> : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// ─── G/H. Why Expresso: engineering and value ────────────────────────────────

const FEATURE_ICONS = {
  responsive: FiSmartphone, seo: FiSearch, custom: FiSliders,
  keywords: FiSearch, onpage: FiFileText, technical: FiTool, backlinks: FiLink,
};

function WhyExpresso({ why, pricingLink }) {
  return (
    <section aria-labelledby="web-why-title" className="bg-white py-16 md:py-24">
      <div className={`${CONTAINER} grid gap-10 lg:grid-cols-12 lg:gap-14`}>
        <div className="flex min-w-0 flex-col items-start gap-5 lg:col-span-5">
          <SectionEyebrow mark>Why Expresso</SectionEyebrow>
          <h2 id="web-why-title" className={`${H2} text-3xl text-night sm:text-4xl md:text-[2.75rem]`}>{why.title}</h2>
          <p className="m-0 text-base leading-relaxed text-ink-600 sm:text-lg">{why.text}</p>
          {pricingLink ? (
            <Link to={pricingLink.to} className="inline-flex items-center gap-2 text-sm font-bold text-lotus-700 underline-offset-4 hover:underline">
              {pricingLink.label}
              <FiArrowRight aria-hidden="true" />
            </Link>
          ) : null}
          {why.statement ? (
            <figure className="relative m-0 mt-auto w-full overflow-hidden rounded-[28px] bg-night p-8 text-white sm:p-10">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: `radial-gradient(${lotusAlpha(0.18)} 1px, transparent 1px)`, backgroundSize: "26px 26px" }} />
              <BrandMark size={34} tone="lotus" className="relative" />
              <blockquote className="relative m-0 mt-6 text-2xl font-bold leading-snug tracking-tight">{why.statement}</blockquote>
            </figure>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col lg:col-span-7">
          <ul className="m-0 flex h-full list-none flex-col justify-between rounded-[28px] border border-ink-200 bg-mist p-2 sm:p-3">
            {why.features.map((f) => {
              const Icon = FEATURE_ICONS[f.key] || FiCheck;
              return (
                <li key={f.key} className="flex gap-4 rounded-[22px] p-5 sm:gap-5 sm:p-6 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-ink-200">
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg text-lotus-600 shadow-[0_6px_18px_rgba(21,18,31,0.06)]"><Icon /></span>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <h3 className="m-0 text-lg font-bold leading-snug text-night">{f.title}</h3>
                    <p className="m-0 text-[15px] leading-relaxed text-ink-600">{f.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── I. FAQ ───────────────────────────────────────────────────────────────────

export function normalizeFaqQuestions(list) {
  return (list || [])
    .map((item) => {
      if (typeof item === "string") return { title: item, content: "" };
      if (!item || typeof item !== "object") return { title: "", content: "" };
      return { ...item, title: item.title || item.question || "", content: item.content || item.answer || "" };
    })
    .filter((item) => item.title || item.content);
}

function FaqItem({ title, content, defaultOpen }) {
  const id = useId();
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const buttonId = `${id}-question`;
  const panelId = `${id}-answer`;
  return (
    <div className={`rounded-[22px] border bg-white transition-colors ${open ? "border-lotus-200 shadow-[0_14px_40px_rgba(21,18,31,0.06)]" : "border-ink-200"}`}>
      <h3 className="m-0 text-base font-semibold leading-snug sm:text-lg">
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 rounded-[22px] px-5 py-5 text-left text-base font-semibold text-night transition-colors hover:text-lotus-700 sm:px-6 sm:text-lg"
        >
          <span>{title}</span>
          <span
            aria-hidden="true"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-transform duration-300 ${open ? "rotate-180 border-lotus-300 bg-lotus-50 text-lotus-700" : "border-ink-200 text-lotus-600"}`}
          >
            <FiChevronDown />
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p className="m-0 px-5 pb-5 pr-14 text-[15px] leading-relaxed text-ink-600 sm:px-6 sm:text-base">{content}</p>
        </div>
      </div>
    </div>
  );
}

function FaqBlock({ block, headingId, cta }) {
  const questions = normalizeFaqQuestions(block.questions);
  if (!questions.length) return null;
  const heading = block.heading || "FAQ";
  return (
    <section aria-labelledby={headingId} className="bg-mist py-16 md:py-24">
      <div className={`${CONTAINER} grid gap-6 lg:grid-cols-12 lg:gap-8`}>
        <div className="relative flex min-w-0 flex-col items-start gap-4 overflow-hidden rounded-[28px] bg-night p-8 text-white sm:p-10 lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl" style={{ backgroundColor: lotusAlpha(0.3) }} />
          <SectionEyebrow tone="dark" className="relative">{heading}</SectionEyebrow>
          <h2 id={headingId} className={`${H2} relative text-4xl text-white sm:text-5xl`}>
            {heading}
            <span className="text-lotus-400">.</span>
          </h2>
          {block.subtitle ? <p className="relative m-0 text-base leading-relaxed text-white/70 sm:text-lg">{block.subtitle}</p> : null}
          {cta?.text ? (
            <CtaLink to={cta.link} className={`${PRIMARY_DARK} relative mt-4`}>
              {cta.text}
              <FiArrowRight aria-hidden="true" />
            </CtaLink>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-7">
          {questions.map((q, i) => (
            <FaqItem key={i} title={q.title} content={q.content} defaultOpen={q.defaultOpen} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── J. Final CTA ─────────────────────────────────────────────────────────────

function FinalCta() {
  const c = WEB_FINAL_CTA;
  return (
    <section aria-labelledby="web-final-cta-title" className="bg-white py-16 md:py-24">
      <div className={CONTAINER}>
        <div className="relative overflow-hidden rounded-[36px] bg-night px-7 py-14 text-white shadow-[0_32px_100px_rgba(21,18,31,0.28)] sm:px-12 sm:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: `radial-gradient(${lotusAlpha(0.22)} 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: lotusAlpha(0.3) }} />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: lotusAlpha(0.16) }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${lotusAlpha(0.6)} 50%, transparent 100%)` }} />
          <BrandMark size={120} tone="lotus" className="pointer-events-none absolute right-8 top-8 hidden opacity-[0.12] md:inline-block" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-white/75">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-lotus-400" />
              {c.badge}
            </span>
            <h2 id="web-final-cta-title" className={`${H2} mt-6 text-4xl sm:text-5xl md:text-6xl`}>
              {c.heading} <span className="text-lotus-400">{c.headingHighlight}</span>
            </h2>
            <p className="m-0 mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">{c.description}</p>
          </div>
          <div className="relative mt-10 flex flex-wrap gap-3 sm:gap-4">
            <Link to={c.primary.to} className={`${PRIMARY_DARK} px-8 py-4`}>
              {c.primary.label}
              <FiArrowUpRight aria-hidden="true" />
            </Link>
            <Link to={c.secondary.to} className={`${SECONDARY_DARK} px-8 py-4`}>{c.secondary.label}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BrandedServiceLoading() {
  return (
    <section aria-busy="true" className="bg-night pb-16 pt-32 text-white sm:pt-36 md:pb-24">
      <div className={CONTAINER}>
        <p role="status" className="m-0 text-lg text-white/70">Loading…</p>
      </div>
    </section>
  );
}

/**
 * @param service        the published service record (its copy is used unchanged)
 * @param renderFallback renders a block type this layout does not restyle
 */
export default function BrandedServiceDetail({ service, renderFallback }) {
  const baseId = useId();
  const blocks = service.blocks || [];
  const id = (idx) => `${baseId}-block-${idx}`;
  const heroCta = { text: service.heroCtaText || "Get Started", link: service.heroCtaLink || "/contact-us" };
  const support = SERVICE_SUPPORT[service.slug] || {};
  const why = support.why ? { ...support.why, statement: support.why.statement || service.description } : null;
  const render = (block, idx) => {
    switch (block?.type) {
      case "intro": return <IntroBlock key={idx} block={block} headingId={id(idx)} />;
      // CMS "webSolutions" (heading + paragraphs + image) is the same story as an intro.
      case "webSolutions": return (
        <IntroBlock
          key={idx}
          headingId={id(idx)}
          block={{ eyebrow: service.title, title: block.heading, descriptions: block.descriptions, imageUrl: block.imageUrl || block.sectionBgUrl, ctaText: heroCta.text, ctaLink: heroCta.link }}
        />
      );
      case "process": return <ProcessBlock key={idx} block={block} headingId={id(idx)} />;
      // CMS "steps" (callout, title, description, image) renders as the numbered journey.
      case "steps": return (
        <ProcessBlock
          key={idx}
          headingId={id(idx)}
          block={{ title: support.stepsIntro?.title, lead: support.stepsIntro?.text, steps: (block.items || []).map((s) => ({ callout: s.callout, title: s.title, description: s.description, image: s.image })) }}
        />
      );
      case "faq": return <FaqBlock key={idx} block={block} headingId={id(idx)} cta={heroCta} />;
      default: return renderFallback?.(block, idx) ?? null;
    }
  };
  // Story: intro → what we build → real work → process → why Expresso → FAQ → CTA.
  const pick = (types) => blocks.map((b, i) => [b, i]).filter(([b]) => types.includes(b?.type));
  const intro = pick(["intro", "webSolutions"]);
  const process = pick(["process", "steps"]);
  const faq = pick(["faq"]);
  const other = blocks.map((b, i) => [b, i]).filter(([b]) => !["intro", "webSolutions", "process", "steps", "faq"].includes(b?.type));
  return (
    <div className="bg-white" data-service-layout="brand-reference">
      <Hero service={service} pricingLink={support.pricingLink} />
      <TechRibbon />
      {intro.map(([b, i]) => render(b, i))}
      {support.builds ? <WhatWeBuild lead={service.description} /> : null}
      {support.showcase ? <WorkShowcase /> : null}
      {process.map(([b, i]) => render(b, i))}
      {other.map(([b, i]) => render(b, i))}
      {why ? <WhyExpresso why={why} pricingLink={support.pricingLink} /> : null}
      {faq.map(([b, i]) => render(b, i))}
      <FinalCta />
    </div>
  );
}
