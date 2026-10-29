import React from "react";
import { FiPlay } from "react-icons/fi";
import { toWebsiteImageUrl } from "../../utils/websiteImages";
import { isScreenWork, workTypeLabel } from "../../data/workTypes";
import { workVideos } from "../../data/workVideos";

// Shared pieces of the public Portfolio (/portfolio and /portfolio/:slug).
// Work items come from /api/work; case studies stay on /api/portfolio.

export const CONTAINER = "mx-auto w-[min(1200px,92vw)]";
export const PRIMARY_DARK = "inline-flex items-center gap-2 rounded-full bg-lotus-400 px-6 py-3.5 text-sm font-bold text-night transition-colors hover:bg-lotus-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lotus-300";
export const SECONDARY_DARK = "inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lotus-300";
export const PRIMARY_LIGHT = "inline-flex items-center gap-2 rounded-full bg-night px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-lotus-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lotus-600";

// Client logos already shown in the website's Clients strip
// (components/Clients/clients.jsx). Most are drawn in light ink for dark
// backgrounds; `plate` marks the dark-ink ones, which sit on a light plate so
// they stay legible.
export const CLIENT_LOGOS = Object.freeze([
  { src: "/godfel-logo.png", name: "Godfel Group" },
  { src: "/floraison-logo.png", name: "Floraison Dental Clinic", plate: true },
  { src: "/alpha-logo.png", name: "Alpha Dental Center" },
  { src: "/baytwaard-logo.png", name: "Baytwaard" },
  { src: "/aroma-logo.png", name: "Angelic Aroma Perfumes", plate: true },
  { src: "/mih-logo.png", name: "MIH Dental" },
]);

export const coverOf = (item) => toWebsiteImageUrl(item?.cover?.src || item?.gallery?.[0]?.src || "");
export const coverAlt = (item) => item?.cover?.alt || [item?.clientName || item?.title, workTypeLabel(item?.workType)].filter(Boolean).join(" — ");

/** Link to the linked, published case study (old ID URLs stay the canonical form). */
export const caseStudyHref = (item) => (item?.caseStudy?._id ? `/case-studies/${item.caseStudy._id}` : "");

/** A light detail page is worth opening when it shows more than the tile does. */
export const hasDetail = (item) =>
  Boolean(item?.shortDescription || (item?.gallery || []).length > 1 || workVideos(item).length || (item?.services || []).length || (item?.technologies || []).length);

export const workHref = (item) => (item?.slug ? `/portfolio/${item.slug}` : "");

export function metaParts(item) {
  return [item?.clientName && item.clientName !== item.title ? item.clientName : "", workTypeLabel(item?.workType), item?.year ? String(item.year) : ""].filter(Boolean);
}

export function MetaLine({ item, dark = false, className = "" }) {
  const parts = metaParts(item);
  if (!parts.length) return null;
  return (
    <p className={`m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold uppercase tracking-[0.14em] ${dark ? "text-lotus-200" : "text-lotus-600"} ${className}`}>
      {parts.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 ? <span aria-hidden="true" className={dark ? "text-white/30" : "text-ink-300"}>•</span> : null}
          <span>{p}</span>
        </React.Fragment>
      ))}
    </p>
  );
}

/**
 * The item's cover, presented by kind of work: website work as a wide stage
 * (website covers are usually device renders already, so no extra browser
 * chrome is drawn around them), social work as a post-style square, video as
 * a reel-style poster. Images sit on a tinted surface while they load.
 */
export function WorkVisual({ item, dark = false, eager = false, className = "" }) {
  const src = coverOf(item);
  const alt = coverAlt(item);
  if (!src) {
    return (
      <div aria-hidden="true" className={`grid aspect-[4/3] place-items-center rounded-2xl ${dark ? "bg-white/5 text-white/40" : "bg-mist text-ink-400"} ${className}`}>
        <span className="text-sm font-semibold">{item?.title}</span>
      </div>
    );
  }
  if (isScreenWork(item?.workType)) {
    return (
      <div className={`overflow-hidden rounded-2xl ${dark ? "bg-white/[0.06] ring-1 ring-white/10" : "bg-mist ring-1 ring-ink-200/70"} ${className}`}>
        <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} draggable={false} className="block aspect-[16/10] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
      </div>
    );
  }
  if (item?.workType === "video") {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-night ${className}`}>
        <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} draggable={false} className="block aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
        <span aria-hidden="true" className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-night shadow-lg">
          <FiPlay />
        </span>
      </div>
    );
  }
  return (
    <div className={`overflow-hidden rounded-2xl ${dark ? "bg-white/5" : "bg-mist"} ${className}`}>
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} draggable={false} className="block aspect-square w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
    </div>
  );
}
