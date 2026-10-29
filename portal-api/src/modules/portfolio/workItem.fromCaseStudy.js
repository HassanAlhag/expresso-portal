// Derive a Portfolio work item draft from an existing case study (a Portfolio
// model record). Pure: it only reads the case study object it is given and
// returns a new plain object. Used by "Create from Case Study" and the
// initial development seed. Only factual, already-published fields are
// reused; nothing is inferred beyond the work type, and narrative fields
// (challenge, solutions, outcome) stay with the case study.

const clean = (v) => String(v ?? "").trim();

/** Internal path or https URL only (same rule as other website CMS links). */
export function safeAssetSrc(v) {
  const s = clean(v);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  if (/^https:\/\//i.test(s)) return s;
  return "";
}

export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Work type from the case study's own category/headline wording. */
export function workTypeFromCaseStudy(cs = {}) {
  const category = clean(cs.category);
  const headline = [cs.title, cs.bannerTitle, cs.excerpt].map(clean).join(" ");
  if (/social/i.test(category)) return "social";
  if (/e-?commerce/i.test(headline) || /e-?commerce/i.test(category)) return "ecommerce";
  if (/web/i.test(category)) return "website";
  return "other";
}

function imageSources(cs) {
  const urls = (Array.isArray(cs.imageUrls) ? cs.imageUrls : [])
    .map((u) => safeAssetSrc(typeof u === "string" ? u : u?.src))
    .filter(Boolean);
  return [...new Set(urls)];
}

/**
 * @param {object} cs  case-study record (lean)
 * @param {object} [options]
 * @param {boolean} [options.link=true]       link the new item to the case study
 * @param {boolean} [options.withGallery=true] reuse the case-study gallery
 */
export function workItemFromCaseStudy(cs, { link = true, withGallery = true } = {}) {
  if (!cs) throw new Error("case study required");
  const title = clean(cs.title) || clean(cs.clientName);
  const name = clean(cs.clientName) || title;
  const coverSrc = safeAssetSrc(cs.thumbnailImg) || safeAssetSrc(cs.bannerImage) || safeAssetSrc(cs.coverMedia?.url);
  const gallery = withGallery
    ? imageSources(cs).map((src, i) => ({ src, alt: `${title} — image ${i + 1}`, media: null }))
    : [];
  const category = clean(cs.category);

  return {
    title,
    slug: slugify(cs.slug || title),
    clientName: clean(cs.clientName),
    workType: workTypeFromCaseStudy(cs),
    industry: "",
    year: null,
    shortDescription: (clean(cs.excerpt) || clean(cs.bannerDesc)).slice(0, 320),
    cover: { src: coverSrc, alt: coverSrc ? `${name}${category ? ` — ${category}` : ""}` : "", media: null },
    gallery,
    video: { src: "", poster: "", media: null },
    services: category ? [category] : [],
    technologies: [],
    featured: false,
    sortOrder: Number.isFinite(cs.sortOrder) ? cs.sortOrder : 0,
    status: "draft",
    publishedAt: null,
    caseStudy: link && cs._id ? cs._id : null,
    seo: { metaTitle: "", metaDesc: "" },
  };
}
