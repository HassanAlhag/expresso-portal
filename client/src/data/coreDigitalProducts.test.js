import { CORE_DIGITAL_PRODUCTS, mergeDigitalProducts } from "./coreDigitalProducts";
import { groupTechnologySolutions } from "../utils/technologyGroups";

test("A: zero CMS records retains one core CAS with its canonical discovery metadata", () => {
  const products = mergeDigitalProducts([]);
  expect(products).toHaveLength(1);
  expect(products[0]).toMatchObject({
    slug: "cas", title: "CAS", to: "/digital-solutions/cas",
    kind: "digital", ownership: "expresso", badge: "Built by Expresso",
  });
  expect(products[0].heroImageUrl).toBeTruthy();
});

test("B: published CAS metadata enriches the core record once without replacing identity or ownership", () => {
  const cms = {
    slug: "cas", kind: "digital", isActive: true, ownership: "partner", to: "/wrong-route",
    title: "CAS for clinics", subtitle: "Clinic software", tagline: "Approved CMS tagline",
    description: "Approved description", heroImageUrl: "/approved-cas.webp",
    ctaLabel: "Discover CAS", demoCtaLabel: "Book a walkthrough",
    demoCtaHref: "/contact-us?interest=cas-walkthrough", order: 7,
  };
  const products = mergeDigitalProducts([cms, { ...cms, title: "Duplicate" }]);
  expect(products).toHaveLength(1);
  expect(products[0]).toMatchObject({
    slug: "cas", title: cms.title, subtitle: cms.subtitle, tagline: cms.tagline,
    description: cms.description, heroImageUrl: cms.heroImageUrl, ctaLabel: cms.ctaLabel,
    demoCtaLabel: cms.demoCtaLabel, demoCtaHref: cms.demoCtaHref, order: 7,
    to: "/digital-solutions/cas", ownership: "expresso", kind: "digital",
  });
  expect(CORE_DIGITAL_PRODUCTS[0].title).toBe("CAS");
  expect(cms.ownership).toBe("partner");
});

test("C: future published products coexist with CAS, deduplicate by slug and respect ordering", () => {
  const next = { slug: "next", kind: "digital", title: "Next product", order: 2 };
  expect(mergeDigitalProducts([next]).map((p) => p.slug)).toEqual(["cas", "next"]);
  const products = mergeDigitalProducts([next, next, { slug: "cas", kind: "digital", order: 3 }]);
  expect(products.map((p) => p.slug)).toEqual(["next", "cas"]);
  expect(products[0].to).toBe("/digital-solutions/next");
});

test("inactive, misclassified and blank CMS content cannot remove or erase the core product", () => {
  expect(mergeDigitalProducts([
    { slug: "cas", kind: "digital", isActive: false, title: "Unpublished override" },
    { slug: "cas", kind: "technology", title: "Wrong section" },
    { slug: "draft", kind: "digital", isActive: false },
    { slug: "erp-solution", kind: "technology" },
  ])).toEqual(mergeDigitalProducts([]));
  expect(mergeDigitalProducts([{ slug: "cas", kind: "digital", title: " ", heroImageUrl: "", order: null }]))
    .toEqual(mergeDigitalProducts([]));
});

test("core discovery records stay excluded from the Technology grouping helper", () => {
  const groups = groupTechnologySolutions([
    { slug: "erp-solution", title: "ERP" }, ...mergeDigitalProducts([]),
  ]);
  expect(groups.flatMap((g) => g.items.map((p) => p.slug))).toEqual(["erp-solution"]);
});
