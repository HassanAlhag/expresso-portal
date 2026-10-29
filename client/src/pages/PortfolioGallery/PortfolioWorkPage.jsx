import React, { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiPlay } from "react-icons/fi";
import { SectionEyebrow, lotusAlpha } from "../../brand";
import { useWorkItem, useWorkItems } from "../../hooks/useWorkItems";
import { toWebsiteImageUrl } from "../../utils/websiteImages";
import { isScreenWork, workTypeLabel } from "../../data/workTypes";
import { workVideos } from "../../data/workVideos";
import FinalCTASection from "../../components/FinalCTASection/FinalCTASection";
import Lightbox from "../../components/Lightbox/Lightbox";
import PublicLoadStatus from "../../components/PublicLoadStatus/PublicLoadStatus";
import {
  CONTAINER,
  MetaLine,
  PRIMARY_DARK,
  SECONDARY_DARK,
  WorkVisual,
  caseStudyHref,
  coverOf,
  hasDetail,
  workHref,
} from "./workShared";

// /portfolio/:slug — a light page for one piece of work: visuals first, short
// facts, and a link to the case study when one exists. It never repeats the
// case-study narrative (challenge, solution, outcome).

const isPlayableFile = (src) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(src || "");

function seoFor(item) {
  const type = workTypeLabel(item.workType);
  const title = item.seo?.metaTitle || `${item.title}${type ? ` — ${type}` : ""} | Expresso Digital`;
  const description =
    item.seo?.metaDesc ||
    item.shortDescription ||
    [item.title, type ? `${type.toLowerCase()} work` : "work", "by Expresso Digital."].join(" ");
  return { title, description };
}

function Facts({ item }) {
  const join = (v) => (v || []).filter(Boolean).join(" · ");
  const facts = [
    ["Client", item.clientName],
    ["Work", workTypeLabel(item.workType)],
    ["Industry", item.industry],
    ["Year", item.year ? String(item.year) : ""],
    ["Services", join(item.services)],
    ["Technologies", join(item.technologies)],
  ].filter(([, v]) => v);
  if (!facts.length) return null;
  // A spec bar: the facts share the full width in equal columns with thin
  // dividers, all set in the same type so they line up on one baseline.
  // Narrow screens show two columns per row.
  return (
    <section aria-label="Project facts" className="border-b border-ink-200 bg-white">
      <dl className={`${CONTAINER} m-0 grid grid-cols-2 gap-y-6 py-10 md:flex md:gap-0`}>
        {facts.map(([k, v], i) => (
          <div key={k} className={`min-w-0 md:flex-1 ${i > 0 ? "md:border-l md:border-ink-200 md:pl-8" : ""} ${i < facts.length - 1 ? "md:pr-8" : ""}`}>
            <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">{k}</dt>
            <dd className="m-0 mt-1.5 text-base font-semibold leading-snug text-night">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// A video file with a large play button in the middle while it is paused.
// The browser's own controls stay available for seeking, volume and full screen.
function FileVideo({ src, poster, label }) {
  const ref = useRef(null);
  const [paused, setPaused] = useState(true);
  const play = () => {
    const p = ref.current?.play();
    if (p && typeof p.catch === "function") p.catch(() => setPaused(true));
  };
  return (
    <div className="relative">
      <video
        ref={ref}
        controls
        preload="metadata"
        playsInline
        poster={poster || undefined}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onEnded={() => setPaused(true)}
        className="block max-h-[80vh] w-full rounded-2xl bg-black"
        aria-label={label}
      >
        <source src={src} />
      </video>
      {paused ? (
        <button
          type="button"
          onClick={play}
          aria-label={`Play ${label}`}
          className="group absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-night shadow-[0_18px_50px_rgba(0,0,0,0.45)] transition hover:scale-105 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:h-24 sm:w-24"
        >
          <FiPlay aria-hidden="true" className="ml-1 h-8 w-8 fill-current sm:h-9 sm:w-9" />
        </button>
      ) : null}
    </div>
  );
}

function VideoPlayer({ video, title, fallbackPoster }) {
  const src = toWebsiteImageUrl(video.src || "");
  const poster = toWebsiteImageUrl(video.poster || "") || fallbackPoster;
  const label = video.title || `${title} video`;
  if (isPlayableFile(src) || video.media) return <FileVideo src={src} poster={poster} label={label} />;
  // A hosted link (YouTube, Instagram…) opens in a new tab.
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="group relative block overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/10">
      {poster ? <img src={poster} alt="" loading="lazy" className="block aspect-video w-full object-cover opacity-80 transition group-hover:opacity-100" /> : <span className="block aspect-video w-full" />}
      <span className={`${PRIMARY_DARK} absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}>
        <FiPlay aria-hidden="true" /> Watch the video <FiArrowUpRight aria-hidden="true" />
      </span>
    </a>
  );
}

// One player at full width. With several videos, arrows (and a counter)
// switch between them, like the gallery; switching stops the current video.
function Videos({ item }) {
  const list = workVideos(item);
  const [index, setIndex] = useState(0);
  if (!list.length) return null;
  const i = Math.min(index, list.length - 1);
  const current = list[i];
  const many = list.length > 1;
  const step = (d) => setIndex((n) => (Math.min(n, list.length - 1) + d + list.length) % list.length);
  const arrow =
    "absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/55 text-xl text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
  return (
    <section aria-labelledby="work-video-title" className="bg-night py-16 text-white md:py-20">
      <div className={CONTAINER}>
        <div className="flex items-center justify-between gap-4">
          <SectionEyebrow tone="dark">{many ? "Videos" : "Video"}</SectionEyebrow>
          {many ? <span className="text-sm font-semibold text-white/60" aria-live="polite">{i + 1} / {list.length}</span> : null}
        </div>
        <h2 id="work-video-title" className="sr-only">{item.title} {many ? "videos" : "video"}</h2>
        <div className="relative mt-6">
          <VideoPlayer key={`${current.src}-${i}`} video={current} title={item.title} fallbackPoster={i === 0 ? coverOf(item) : ""} />
          {many ? (
            <>
              <button type="button" onClick={() => step(-1)} aria-label="Previous video" className={`${arrow} left-3`}>
                <span aria-hidden="true">‹</span>
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next video" className={`${arrow} right-3`}>
                <span aria-hidden="true">›</span>
              </button>
            </>
          ) : null}
        </div>
        {current.title ? <p className="m-0 mt-4 text-sm font-semibold text-white/80">{current.title}</p> : null}
      </div>
    </section>
  );
}

// Images keep their own proportions (desktop pages, phone screens and posts
// sit side by side in columns); nothing is cropped or put in device chrome.
function Gallery({ item }) {
  const [open, setOpen] = useState(null); // index of the enlarged image
  const images = (item.gallery || []).filter((g) => g?.src);
  if (!images.length) return null;
  const altOf = (g, i) => g.alt || `${item.title} — image ${i + 1}`;
  const step = (d) => setOpen((i) => (i + d + images.length) % images.length);
  const current = open === null ? null : images[open];
  return (
    <section aria-labelledby="work-gallery-title" className="bg-white py-16 md:py-24">
      <div className={CONTAINER}>
        <SectionEyebrow mark>Gallery</SectionEyebrow>
        <h2 id="work-gallery-title" className="m-0 mt-4 text-3xl font-bold tracking-tight text-night sm:text-4xl">
          {item.title}<span className="text-lotus-600">.</span>
        </h2>
        <ul className={`m-0 mt-10 list-none gap-6 p-0 ${images.length > 1 ? "columns-1 sm:columns-2" : ""} ${images.length > 2 ? "lg:columns-3" : ""}`}>
          {images.map((g, i) => {
            const src = toWebsiteImageUrl(g.src);
            const alt = altOf(g, i);
            return (
              <li key={`${g.src}-${i}`} className="mb-6 break-inside-avoid">
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={`Enlarge: ${alt}`}
                  className="group block w-full overflow-hidden rounded-2xl bg-mist text-left ring-1 ring-ink-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lotus-600"
                >
                  <img src={src} alt={alt} loading="lazy" className="block h-auto w-full transition-transform duration-700 group-hover:scale-[1.02]" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <Lightbox
        open={current !== null}
        onClose={() => setOpen(null)}
        src={current ? toWebsiteImageUrl(current.src) : ""}
        alt={current ? altOf(current, open) : ""}
        onPrev={images.length > 1 ? () => step(-1) : undefined}
        onNext={images.length > 1 ? () => step(1) : undefined}
        position={images.length > 1 && current ? `${open + 1} / ${images.length}` : ""}
      />
    </section>
  );
}

function CaseStudyBand({ item }) {
  const href = caseStudyHref(item);
  if (!href) return null;
  return (
    <section aria-label="Case study" className="bg-mist py-14">
      <div className={`${CONTAINER} flex flex-col items-start justify-between gap-6 rounded-[28px] border border-ink-200 bg-white p-8 sm:flex-row sm:items-center sm:p-10`}>
        <div>
          <SectionEyebrow>Case study</SectionEyebrow>
          <p className="m-0 mt-3 text-2xl font-bold tracking-tight text-night">The story behind {item.clientName || item.title}</p>
          <p className="m-0 mt-2 text-ink-600">The challenge, our approach and the outcome, in the full case study.</p>
        </div>
        <Link to={href} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-night px-6 py-3.5 text-sm font-bold text-white hover:bg-lotus-900">
          View case study <FiArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function MoreWork({ item }) {
  const { items } = useWorkItems();
  const others = items.filter((i) => i.slug !== item.slug);
  const sameType = others.filter((i) => i.workType === item.workType);
  const picks = [...sameType, ...others.filter((i) => i.workType !== item.workType)].slice(0, 3);
  if (!picks.length) return null;
  return (
    <section aria-labelledby="more-work-title" className="bg-white py-16 md:py-24">
      <div className={CONTAINER}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionEyebrow mark>More work</SectionEyebrow>
            <h2 id="more-work-title" className="m-0 mt-4 text-3xl font-bold tracking-tight text-night">Keep exploring<span className="text-lotus-600">.</span></h2>
          </div>
          <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm font-semibold text-lotus-700 hover:text-lotus-900">
            All work <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
        <ul className="m-0 mt-10 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((p) => {
            const href = hasDetail(p) ? workHref(p) : caseStudyHref(p);
            const body = (
              <>
                <WorkVisual item={p} />
                <MetaLine item={p} className="mt-4" />
                <p className="m-0 mt-1 text-lg font-bold text-night">{p.title}</p>
              </>
            );
            return (
              <li key={p._id || p.slug}>
                {href ? <Link to={href} className="group block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lotus-600">{body}</Link> : <div className="group">{body}</div>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default function PortfolioWorkPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { item, loading, error, notFound, retry } = useWorkItem(slug);

  if (loading || error || notFound || !item) {
    return (
      <div className="bg-white pb-24 pt-36">
        <div className={`${CONTAINER} grid gap-6`}>
          {notFound ? (
            <div className="grid gap-4">
              <h1 className="m-0 text-3xl font-bold text-night">Project not found.</h1>
              <p className="m-0 text-ink-600">It may have been moved or is no longer published.</p>
              <Link to="/portfolio" className="font-semibold text-lotus-700 underline underline-offset-4">All work</Link>
            </div>
          ) : (
            <PublicLoadStatus
              status={loading ? "loading" : "error"}
              loadingText="Loading this project…"
              errorTitle="We couldn’t load this project."
              errorText="Please try again, or contact our team to see examples of our work."
              onRetry={retry}
            />
          )}
        </div>
      </div>
    );
  }

  const { title, description } = seoFor(item);
  const cover = coverOf(item);
  const cs = caseStudyHref(item);
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/portfolio/${item.slug}` : "";

  return (
    <div className="bg-white">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        {canonical ? <link rel="canonical" href={canonical} /> : null}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {cover ? <meta property="og:image" content={cover} /> : null}
      </Helmet>

      <section aria-labelledby="work-title" className="relative overflow-hidden bg-night pb-16 pt-32 text-white sm:pt-36 md:pb-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(780px circle at 10% 8%, ${lotusAlpha(0.22)}, transparent 42%)` }} />
        <div className={`relative ${CONTAINER} grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]`}>
          <div className="flex min-w-0 flex-col items-start gap-5">
            <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white">
              <FiArrowLeft aria-hidden="true" /> All work
            </Link>
            <MetaLine item={item} dark />
            <h1 id="work-title" className="m-0 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">{item.title}</h1>
            {item.shortDescription ? <p className="m-0 max-w-xl text-lg leading-relaxed text-white/70">{item.shortDescription}</p> : null}
            <div className="mt-2 flex flex-wrap gap-3">
              {cs ? <Link to={cs} className={PRIMARY_DARK}>View case study <FiArrowUpRight aria-hidden="true" /></Link> : null}
              <Link to="/contact-us" className={cs ? SECONDARY_DARK : PRIMARY_DARK}>Start a Project{cs ? null : <FiArrowRight aria-hidden="true" />}</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full min-w-0 max-w-xl lg:max-w-none">
            <div aria-hidden="true" className="pointer-events-none absolute -inset-6 rounded-[40px] opacity-70 blur-3xl" style={{ backgroundColor: lotusAlpha(0.22) }} />
            <WorkVisual item={item} dark eager className={`relative shadow-[0_30px_90px_rgba(0,0,0,0.55)] ${isScreenWork(item.workType) ? "" : "mx-auto max-w-md"}`} />
          </div>
        </div>
      </section>

      <Facts item={item} />
      <Videos item={item} />
      <Gallery item={item} />
      <CaseStudyBand item={item} />
      <MoreWork item={item} />
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
  );
}
