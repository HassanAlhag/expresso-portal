import { CAS_IMAGES, CAS_PRODUCT } from "./casProduct";
import { BUSINESS_SUITE_PRODUCT } from "./businessSuiteProduct";
import { onlyDigital } from "../utils/solutionKinds";

// Core first-party products exist independently of CMS publication. Reuse the
// existing product configuration; do not copy the bespoke product page here.
export const CORE_DIGITAL_PRODUCTS = Object.freeze([
  Object.freeze({
    slug: CAS_PRODUCT.slug,
    title: CAS_PRODUCT.name,
    subtitle: CAS_PRODUCT.fullName,
    description: CAS_PRODUCT.shortDescription,
    to: CAS_PRODUCT.to,
    kind: "digital",
    ownership: "expresso",
    badge: CAS_PRODUCT.badge,
    heroImageUrl: CAS_IMAGES.adminDashboard.src,
    ctaLabel: CAS_PRODUCT.ctaLabel,
    demoCtaLabel: CAS_PRODUCT.demoCtaLabel,
    demoCtaHref: CAS_PRODUCT.demoHref,
    order: 0,
  }),
  Object.freeze({
    ...BUSINESS_SUITE_PRODUCT,
    kind: "digital",
    ownership: "expresso",
  }),
]);

const PRESENTATION_FIELDS = [
  "title", "subtitle", "description", "tagline", "badge", "heroImageUrl",
  "ctaLabel", "demoCtaLabel", "demoCtaHref",
];

const validOrder = (order) => typeof order === "number" && Number.isFinite(order);

// Shared discovery source for the landing page and both navigation layouts.
// Merge by stable slug, keep core identity/ownership/routes, ignore unpublished
// records and blank overrides, and sort by order with core entries first on ties.
export function mergeDigitalProducts(cmsItems = []) {
  const products = new Map(CORE_DIGITAL_PRODUCTS.map((p) => [p.slug, { ...p }]));
  const coreSlugs = new Set(products.keys());
  const seen = new Set();

  for (const item of onlyDigital(cmsItems)) {
    if (item.isActive === false || typeof item.slug !== "string" || !item.slug.trim()) continue;
    const slug = item.slug.trim();
    if (seen.has(slug)) continue;
    seen.add(slug);

    if (coreSlugs.has(slug)) {
      const product = products.get(slug);
      for (const field of PRESENTATION_FIELDS) {
        if (typeof item[field] === "string" && item[field].trim()) product[field] = item[field].trim();
      }
      if (validOrder(item.order)) product.order = item.order;
      // Reuse the existing CMS blocks for product content, including Suite
      // modules. Discovery identity and routes remain owned by the registry.
      if (Array.isArray(item.blocks)) product.blocks = item.blocks;
    } else {
      products.set(slug, {
        ...item,
        slug,
        kind: "digital",
        ownership: "expresso",
        to: `/digital-solutions/${slug}`,
        order: validOrder(item.order) ? item.order : 0,
      });
    }
  }

  return [...products.values()].sort((a, b) => a.order - b.order);
}
