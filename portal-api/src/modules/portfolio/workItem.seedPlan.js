// Initial Portfolio work items: the pure seed plan (no database access).
// Used by src/scripts/seedWorkItems.js and covered by tests.
import { workItemFromCaseStudy } from "./workItem.fromCaseStudy.js";

// Complete case studies: one linked portfolio item each, derived from the
// case study's own published fields.
export const LINKED_CASE_STUDIES = Object.freeze([
  "profit-assurance",
  "odeur-perfumes-website",
  "godfel-group",
  "ultimate-mena",
  "odeur-perfumes-social",
  "baytwaard",
]);

// Sudatel's case study has no story yet. Its listing screenshot is a real
// capture of the delivered website, so it becomes a visual-only item: not
// linked (no empty case study behind it) and without the case-study gallery,
// whose images are generic artwork rather than project screens.
export const VISUAL_ONLY_CASE_STUDIES = Object.freeze(["sudatel"]);

// Social-media accounts already shown on the website as client work: the
// home page "OUR ACCOUNTS — Brands we helped stand out" strip
// (components/ShuffleSection) and the Clients logo strip
// (components/Clients). Each image is an existing feed composite in
// client/public. Client names are taken only from what the creatives (or the
// client's logo) themselves print; year, industry and description are left
// blank for the admin. /afrid.PNG is not seeded: it is an office photo, not
// client work.
export const ASSET_ONLY_ITEMS = Object.freeze([
  { slug: "floraison-dental-clinic", title: "Floraison Dental Clinic", clientName: "Floraison Dental Clinic", images: ["/floraison1.png", "/floraison2.png"] },
  // The creatives and mih-logo.png print "MIH DENTAL".
  { slug: "mih-dental", title: "MIH Dental", clientName: "MIH Dental", images: ["/mih1.png", "/mih2.png"] },
  { slug: "alpha-dental-center", title: "Alpha Dental Center", clientName: "Alpha Dental Center", images: ["/alpha1.png", "/alpha2.png"] },
  // "Ayur" on the home strip; the creatives print "Kottakkal Ayur Health Hub".
  { slug: "kottakkal-ayur-health-hub", title: "Kottakkal Ayur Health Hub", clientName: "Kottakkal Ayur Health Hub", images: ["/ayur1.png", "/ayur2.png"] },
  // "Smile" on the home strip; the creatives print "Smile Essentials Dental Clinic".
  { slug: "smile-essentials-dental-clinic", title: "Smile Essentials Dental Clinic", clientName: "Smile Essentials Dental Clinic", images: ["/smile1.png", "/smile2.png"] },
  // "Angelic" on the home strip; the Clients strip logo (aroma-logo.png) reads
  // "Angelic Aroma Perfumes", matching the perfume creatives.
  { slug: "angelic-aroma-perfumes", title: "Angelic Aroma Perfumes", clientName: "Angelic Aroma Perfumes", images: ["/angelic1.png"] },
  { slug: "expresso-digital", title: "Expresso Digital", clientName: "Expresso Digital", images: ["/expresso1.png"] },
]);

function assetOnlyDraft(def, sortOrder) {
  const [cover, ...rest] = def.images;
  const label = def.clientName || def.title;
  return {
    title: def.title,
    slug: def.slug,
    clientName: def.clientName,
    workType: "social",
    industry: "",
    year: null,
    shortDescription: "",
    cover: { src: cover, alt: `${label} — social media posts`, media: null },
    gallery: [cover, ...rest].map((src, i) => ({ src, alt: `${label} — social media posts ${i + 1}`, media: null })),
    video: { src: "", poster: "", media: null },
    services: ["Social Media"],
    technologies: [],
    featured: false,
    sortOrder,
    status: "draft",
    publishedAt: null,
    caseStudy: null,
    seo: { metaTitle: "", metaDesc: "" },
  };
}

/**
 * Pure plan: which drafts to insert and which to skip.
 * @param {Map<string, object>} caseStudies  case studies by slug (lean)
 * @param {Set<string>} existingSlugs        work item slugs already stored
 */
export function planWorkItemSeed(caseStudies, existingSlugs) {
  const create = [];
  const skipped = [];
  const take = (draft, source) => {
    if (existingSlugs.has(draft.slug)) skipped.push({ slug: draft.slug, reason: "already exists" });
    else create.push({ draft, source });
  };
  for (const slug of LINKED_CASE_STUDIES) {
    const cs = caseStudies.get(slug);
    if (!cs) skipped.push({ slug, reason: "case study not found" });
    else take(workItemFromCaseStudy(cs), `case study ${slug} (linked)`);
  }
  for (const slug of VISUAL_ONLY_CASE_STUDIES) {
    const cs = caseStudies.get(slug);
    if (!cs) skipped.push({ slug, reason: "case study not found" });
    else take(workItemFromCaseStudy(cs, { link: false, withGallery: false }), `case study ${slug} (visual only, not linked)`);
  }
  ASSET_ONLY_ITEMS.forEach((def, i) => take(assetOnlyDraft(def, 100 + i), "repository assets"));
  return { create, skipped };
}
