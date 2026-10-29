import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import { BrandMark, SectionEyebrow, lotusAlpha } from "../../brand";
import { useWorkItems } from "../../hooks/useWorkItems";
import { WORK_TYPES, isScreenWork } from "../../data/workTypes";
import FinalCTASection from "../../components/FinalCTASection/FinalCTASection";
import PublicLoadStatus from "../../components/PublicLoadStatus/PublicLoadStatus";
import {
  CLIENT_LOGOS,
  CONTAINER,
  MetaLine,
  PRIMARY_DARK,
  PRIMARY_LIGHT,
  SECONDARY_DARK,
  WorkVisual,
  caseStudyHref,
  hasDetail,
  workHref,
} from "./workShared";

// /portfolio — the visual showcase of Expresso work. It reads Portfolio work
// items (/api/work) only; case studies (/case-studies) keep their own source.
// Copy is the website's existing Portfolio/"Our Work" wording.
const PAGE = {
  title: "Our Portfolio | Expresso Digital",
  description: "Selected projects, the stories behind them and the brands we work with.",
  eyebrow: "Selected work",
  heading: "Work we are proud of.",
  text: "Selected projects, the stories behind them and the brands we work with.",
  gridHeading: "Digital projects with a cleaner path from first look to action.",
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function Hero({ items }) {
  // One large website visual with two smaller ones in front of it: social or
  // video work when there is some, otherwise further website work.
  const withCover = items.filter((i) => i.cover?.src || i.gallery?.[0]?.src);
  const screen = withCover.find((i) => isScreenWork(i.workType));
  const rest = withCover.filter((i) => i !== screen);
  const others = [...rest.filter((i) => !isScreenWork(i.workType)), ...rest.filter((i) => isScreenWork(i.workType))].slice(0, 2);
  const clients = new Set(items.map((i) => (i.clientName || "").trim().toLowerCase()).filter(Boolean)).size;
  const kinds = new Set(items.map((i) => i.workType)).size;
  const facts = items.length
    ? [plural(items.length, "project", "projects"), clients ? plural(clients, "client", "clients") : "", plural(kinds, "kind of work", "kinds of work")].filter(Boolean)
    : [];

  return (
    <section aria-labelledby="portfolio-title" className="relative overflow-hidden bg-night pb-16 pt-32 text-white sm:pt-36 md:pb-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(780px circle at 10% 8%, ${lotusAlpha(0.22)}, transparent 42%), radial-gradient(900px circle at 92% 12%, rgba(255,255,255,0.05), transparent 36%)` }} />
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
      <div className={`relative ${CONTAINER} grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]`}>
        <div className="flex min-w-0 flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-lotus-300/35 bg-lotus-400/15 py-1.5 pl-2 pr-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-lotus-200">
            <BrandMark size={18} tone="white" />
            {PAGE.eyebrow}
          </span>
          <h1 id="portfolio-title" className="m-0 max-w-2xl text-4xl font-bold leading-[1.03] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            {PAGE.heading}
          </h1>
          <p className="m-0 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl">{PAGE.text}</p>
          <div className="mt-2 flex flex-wrap gap-3 sm:gap-4">
            <a href="#work" className={PRIMARY_DARK}>
              View the work <FiArrowRight aria-hidden="true" />
            </a>
            <Link to="/case-studies" className={SECONDARY_DARK}>Read case studies</Link>
          </div>
          {facts.length ? (
            <ul aria-label="Portfolio at a glance" className="m-0 mt-4 flex list-none flex-wrap gap-x-8 gap-y-3 border-t border-white/10 p-0 pt-6">
              {facts.map((f) => {
                const [n, ...rest] = f.split(" ");
                return (
                  <li key={f} className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{n}</span>
                    <span className="text-sm text-white/60">{rest.join(" ")}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        {screen || others.length ? (
          <div aria-hidden="true" className="relative mx-auto w-full min-w-0 max-w-xl pb-10 lg:max-w-none">
            <div className="pointer-events-none absolute -inset-6 rounded-[40px] opacity-70 blur-3xl" style={{ backgroundColor: lotusAlpha(0.22) }} />
            {screen ? (
              <WorkVisual item={screen} dark eager className="relative shadow-[0_30px_90px_rgba(0,0,0,0.55)]" />
            ) : null}
            {others.map((o, i) => (
              <WorkVisual
                key={o._id || o.slug}
                item={o}
                dark
                eager
                className={[
                  "shadow-[0_24px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/10",
                  screen
                    ? `absolute hidden w-36 sm:block lg:w-44 ${i === 0 ? "-bottom-2 -left-4 lg:-left-10" : "-bottom-8 right-6 lg:right-10"}`
                    : `relative ${i === 1 ? "ml-auto -mt-16 w-2/3" : "w-2/3"}`,
                ].join(" ")}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** A featured item: a full-width card at the head of the mosaic. */
function FeatureCard({ item, flip }) {
  const detail = hasDetail(item) ? workHref(item) : "";
  const cs = caseStudyHref(item);
  const primary = detail || cs;
  const visual = <WorkVisual item={item} className="shadow-[0_24px_70px_rgba(21,18,31,0.14)]" />;
  return (
    <article className="group grid items-center gap-8 rounded-[32px] border border-ink-200 bg-mist p-5 sm:p-8 lg:grid-cols-12 lg:gap-12 lg:p-10">
      <div className={`min-w-0 lg:col-span-7 ${flip ? "lg:order-2" : ""}`}>
        {primary ? <Link to={primary} tabIndex={-1} aria-hidden="true" className="block">{visual}</Link> : visual}
      </div>
      <div className="flex min-w-0 flex-col items-start gap-4 lg:col-span-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-lotus-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-lotus-700">
          <BrandMark size={14} /> Featured
        </span>
        <MetaLine item={item} />
        <h3 className="m-0 text-3xl font-bold leading-tight tracking-tight text-night sm:text-4xl">{item.title}</h3>
        {item.shortDescription ? <p className="m-0 text-base leading-relaxed text-ink-600 sm:text-lg">{item.shortDescription}</p> : null}
        {(item.services || []).length ? (
          <ul aria-label="Services" className="m-0 flex list-none flex-wrap gap-2 p-0">
            {item.services.map((s) => (
              <li key={s} className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-700">{s}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-3">
          {detail ? <Link to={detail} className={PRIMARY_LIGHT}>View project <FiArrowRight aria-hidden="true" /></Link> : null}
          {cs ? (
            <Link to={cs} className={detail ? "inline-flex items-center gap-2 rounded-full border border-ink-300 bg-white px-6 py-3.5 text-sm font-semibold text-night hover:border-ink-400" : PRIMARY_LIGHT}>
              View case study <FiArrowUpRight aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function WorkTile({ item }) {
  const detail = hasDetail(item) ? workHref(item) : "";
  const cs = caseStudyHref(item);
  const primary = detail || cs;
  const visual = <WorkVisual item={item} className="shadow-[0_18px_50px_rgba(21,18,31,0.10)]" />;
  return (
    <article className="group flex h-full flex-col">
      {primary ? (
        <Link to={primary} tabIndex={-1} aria-hidden="true" className="block">{visual}</Link>
      ) : (
        visual
      )}
      <div className="mt-4 flex flex-1 flex-col gap-2">
        <MetaLine item={item} />
        <h3 className="m-0 text-xl font-bold leading-snug text-night">
          {primary ? (
            <Link to={primary} className="rounded-sm hover:text-lotus-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lotus-600">
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </h3>
        {(detail && cs) ? (
          <Link to={cs} className="mt-auto inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-lotus-700 hover:text-lotus-900">
            View case study <FiArrowUpRight aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function WorkGrid({ items, status, retry }) {
  const [active, setActive] = useState("all");
  const types = useMemo(
    () => WORK_TYPES.map((t) => ({ ...t, count: items.filter((i) => i.workType === t.key).length })).filter((t) => t.count > 0),
    [items]
  );
  // "All work" opens with up to two featured items as wide cards; a type
  // filter shows every matching item as a regular tile.
  const featured = active === "all" ? items.filter((i) => i.featured).slice(0, 2) : [];
  const shown = (active === "all" ? items : items.filter((i) => i.workType === active)).filter((i) => !featured.includes(i));
  // A wide website tile pairs with a square social/video tile in the same
  // row. When only one kind is shown there is nothing to pair with, so every
  // tile is one column wide: three per row on desktop.
  const mixed = shown.some((i) => isScreenWork(i.workType)) && shown.some((i) => !isScreenWork(i.workType));

  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-28 bg-white py-20 md:py-28">
      <div className={CONTAINER}>
        <div className="flex flex-col gap-8">
          <div className="max-w-3xl">
            <SectionEyebrow mark>Our work</SectionEyebrow>
            <h2 id="work-title" className="m-0 mt-4 text-3xl font-bold leading-tight tracking-tight text-night sm:text-4xl">
              {PAGE.gridHeading}
            </h2>
          </div>
          {types.length > 1 ? (
            <div role="group" aria-label="Filter work by type" className="flex flex-wrap gap-2">
              {[{ key: "all", plural: "All work", count: items.length }, ...types].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={active === t.key}
                  onClick={() => setActive(t.key)}
                  className={[
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lotus-600",
                    active === t.key ? "border-night bg-night text-white" : "border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:text-night",
                  ].join(" ")}
                >
                  {t.plural}
                  <span className={active === t.key ? "text-lotus-200" : "text-ink-400"}>{t.count}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {status !== "success" ? (
          <div className="mt-10">
            <PublicLoadStatus
              status={status}
              loadingText="Loading our work…"
              errorTitle="We couldn’t load our portfolio."
              errorText="Please try again, or contact our team to see examples of our work."
              emptyTitle="Our portfolio is being updated."
              emptyText="Contact our team to see examples of our work."
              onRetry={retry}
            />
          </div>
        ) : (
          <ul aria-live="polite" className="m-0 mt-12 grid list-none grid-flow-row-dense grid-cols-1 gap-x-6 gap-y-12 p-0 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((item, i) => (
              // col-span-full spans whatever columns the grid has (2 or 3);
              // a fixed span larger than the grid would add empty columns.
              <li key={item._id || item.slug} className="col-span-full">
                <FeatureCard item={item} flip={i % 2 === 1} />
              </li>
            ))}
            {shown.map((item) => (
              <li key={item._id || item.slug} className={mixed && isScreenWork(item.workType) ? "md:col-span-2" : ""}>
                <WorkTile item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Clients() {
  return (
    <section aria-labelledby="clients-title" className="bg-night py-16 text-white md:py-20">
      <div className={`${CONTAINER} grid items-center gap-10 lg:grid-cols-[1fr_2fr]`}>
        <div>
          <SectionEyebrow tone="dark" mark>Our accounts</SectionEyebrow>
          <h2 id="clients-title" className="m-0 mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Brands we helped <span className="text-lotus-300">stand out</span>
          </h2>
        </div>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
          {CLIENT_LOGOS.map((logo) => (
            <li key={logo.src} className="grid h-24 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] px-6">
              {logo.plate ? (
                <span className="grid h-16 w-full max-w-[11rem] place-items-center rounded-xl bg-white px-3">
                  <img src={logo.src} alt={logo.name} loading="lazy" className="max-h-12 max-w-full object-contain" />
                </span>
              ) : (
                <img src={logo.src} alt={logo.name} loading="lazy" className="max-h-14 max-w-full object-contain" />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function PortfolioGalleryPage() {
  const navigate = useNavigate();
  const { items, loading, error, retry } = useWorkItems();
  const status = loading ? "loading" : error ? "error" : items.length ? "success" : "empty";
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/portfolio` : "";

  return (
    <div className="bg-white">
      <Helmet>
        <title>{PAGE.title}</title>
        <meta name="description" content={PAGE.description} />
        {canonical ? <link rel="canonical" href={canonical} /> : null}
      </Helmet>
      <Hero items={items} />
      <WorkGrid items={items} status={status} retry={retry} />
      <Clients />
      <div className="pt-20 md:pt-28">
        <FinalCTASection
          badge="LET'S BUILD TOGETHER"
          heading="Your brand deserves"
          headingHighlight="to be on this page"
          description="We build websites, run campaigns, and create content that generates results. Tell us what you need."
          primaryLabel="Start a Project"
          onPrimaryClick={() => navigate("/contact-us")}
          secondaryLabel="View Case Studies"
          secondaryLink="/case-studies"
        />
      </div>
    </div>
  );
}
