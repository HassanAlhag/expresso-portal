/* eslint-disable testing-library/no-node-access, testing-library/no-container */
// Layout assertions (which layout rendered, the ribbon directly after the hero,
// the panel each FAQ button controls) need structural DOM access.
import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import ServiceDetailPage from "./ServiceDetailPage";
import { WEB_BUILDS, WEB_ENGINEERING, WEB_FINAL_CTA, WEB_STATEMENT, WEB_WORK } from "../../data/webDevelopmentContent";
import { SEO_SERVICES_INTRO, SEO_WHY } from "../../data/seoMarketingContent";

// CRA's Jest resolver predates React Router 7's package exports.
let mockSlug = "web-dev";
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
  useParams: () => ({ slug: mockSlug }),
}), { virtual: true });
jest.mock("../../hooks/useSiteSettings", () => ({ useSiteSettings: () => ({}) }));
let mockPortfolio = { items: [], loading: false, error: null };
jest.mock("../../hooks/usePortfolioItems", () => ({ usePortfolioItems: () => mockPortfolio }));

const SERVICE = {
  slug: "web-dev",
  title: "Website Development",
  tag: "WEB",
  description: "Fast, responsive websites and web apps built to convert.",
  heroHeading: "Website & App Development – Digital That Delivers",
  heroSubheading: "Your website isn't just your digital home — it's your best salesperson.",
  heroImageUrl: "/web8.jpg",
  heroCtaText: "Get Started",
  heroCtaLink: "/contact-us",
  blocks: [
    {
      type: "intro",
      eyebrow: "WEBSITE DEVELOPMENT",
      title: "Built to impress —",
      highlight: "engineered to convert.",
      imageUrl: "/web6.png",
      descriptions: ["We build fast, responsive websites.", "From strategy to launch, we handle everything."],
      chips: ["Performance-first", "Responsive UI"],
      ctaText: "Request a Proposal",
      ctaLink: "/contact-us",
    },
    {
      type: "process",
      eyebrow: "PROCESS",
      title: "Your journey from idea to launch",
      steps: [
        { callout: "Planning", title: "Defining Goals and Structure", description: "We align on objectives.", image: "/p1.png" },
        { callout: "Design", title: "Creating a Visual Concept", description: "We craft a clean UI/UX direction.", image: "/p2.png" },
        { callout: "Launch", title: "Going Live", description: "We deploy to production.", image: "/p5.png" },
      ],
    },
    {
      type: "faq",
      heading: "FAQ",
      subtitle: "Quick answers before we build something great.",
      questions: [
        { title: "Will my website be mobile-friendly?", content: "Absolutely.", defaultOpen: true },
        { question: "What technologies do you use?", answer: "Based on your needs." },
      ],
    },
  ],
};

const CASES = [
  { _id: "c1", title: "Sudatel", category: "Website", excerpt: "", solutionImage: "/s.png" },
  { _id: "c2", title: "Profit Assurance", category: "Website Design", excerpt: "We built a fast website.", bannerTitle: "Design That Speaks", solutionImage: "/p.png" },
  { _id: "c3", title: "Baytwaard", category: "Social Media", excerpt: "Not a website.", solutionImage: "/b.png" },
];

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  mockSlug = "web-dev";
  mockPortfolio = { items: [], loading: false, error: null };
});
const serve = (item) => {
  global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ ok: true, item }) });
};

test("web-dev keeps every piece of its own content and link in the reference layout", async () => {
  serve(SERVICE);
  const { container } = render(<ServiceDetailPage />);
  expect(await screen.findByRole("heading", { level: 1, name: SERVICE.heroHeading })).toBeTruthy();
  expect(container.querySelector('[data-service-layout="brand-reference"]')).toBeTruthy();
  expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/web-content\/services\/web-dev$/));

  for (const text of [
    "WEB", SERVICE.heroSubheading, "WEBSITE DEVELOPMENT", "We build fast, responsive websites.", "From strategy to launch, we handle everything.",
    "Performance-first", "Responsive UI", "PROCESS", "01 • PLANNING", "02 • DESIGN", "03 • LAUNCH", "Defining Goals and Structure", "We align on objectives.",
    "Going Live", "Quick answers before we build something great.", "Absolutely.", "Based on your needs.",
  ]) {
    expect(screen.getAllByText(text).length).toBeGreaterThan(0);
  }
  expect(screen.getByRole("heading", { level: 2, name: "Built to impress — engineered to convert." })).toBeTruthy();
  expect(screen.getByRole("heading", { level: 2, name: /^Your journey from idea to launch\s?\.$/ })).toBeTruthy();
  expect(screen.getByRole("heading", { level: 2, name: /^FAQ\s?\.$/ })).toBeTruthy();

  // CTAs keep their text and destination, and are real links.
  expect(screen.getAllByRole("link", { name: /^Get Started/ }).every((a) => a.getAttribute("href") === "/contact-us")).toBe(true);
  expect(screen.getByRole("link", { name: /^Request a Proposal/ }).getAttribute("href")).toBe("/contact-us");

  // The approved technology ribbon directly follows the hero.
  const hero = screen.getByRole("heading", { level: 1 }).closest("section");
  expect(within(hero.nextElementSibling).getAllByText("React").length).toBeGreaterThan(0);

  // Every process phase shows its own image.
  for (const [alt, src] of [["Planning", "/p1.png"], ["Design", "/p2.png"], ["Launch", "/p5.png"]]) {
    expect(screen.getByRole("img", { name: alt }).getAttribute("src")).toBe(src);
  }
});

test("supporting sections reuse existing repository content and real routes only", async () => {
  serve(SERVICE);
  render(<ServiceDetailPage />);
  await screen.findByRole("heading", { level: 1 });
  // What we build (WebServices.jsx), led by the service record's own description.
  expect(screen.getByRole("heading", { level: 2, name: /^Built for the web\s?\.$/ })).toBeTruthy();
  expect(screen.getByText(SERVICE.description)).toBeTruthy();
  for (const item of WEB_BUILDS.items) {
    expect(screen.getByRole("heading", { level: 3, name: item.title })).toBeTruthy();
    for (const point of item.points) expect(screen.getByText(point)).toBeTruthy();
  }
  // Why Expresso (webPricingPage.jsx + case-study statement).
  expect(screen.getByRole("heading", { level: 2, name: WEB_ENGINEERING.title })).toBeTruthy();
  expect(screen.getByText(WEB_STATEMENT)).toBeTruthy();
  for (const f of WEB_ENGINEERING.features) expect(screen.getByRole("heading", { level: 3, name: f.title })).toBeTruthy();
  expect(screen.getAllByRole("link", { name: "Website pricing" }).every((a) => a.getAttribute("href") === "/pricing/web-dev")).toBe(true);
  // Final CTA (home page copy) with real links.
  expect(screen.getByRole("heading", { level: 2, name: `${WEB_FINAL_CTA.heading} ${WEB_FINAL_CTA.headingHighlight}` })).toBeTruthy();
  expect(screen.getByRole("link", { name: /^Build Your Plan/ }).getAttribute("href")).toBe("/build-your-plan");
  expect(screen.getByRole("link", { name: "Schedule a Call" }).getAttribute("href")).toBe("/contact-us");
  // No case studies published: the work section is simply absent.
  expect(screen.queryByRole("heading", { level: 2, name: WEB_WORK.title })).toBeNull();
});

test("the work showcase lists only published website case studies, featuring one with a summary", async () => {
  mockPortfolio = { items: CASES, loading: false, error: null };
  serve(SERVICE);
  render(<ServiceDetailPage />);
  expect(await screen.findByRole("heading", { level: 2, name: WEB_WORK.title })).toBeTruthy();
  const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
  expect(titles.indexOf("Profit Assurance")).toBeLessThan(titles.indexOf("Sudatel"));
  expect(titles).not.toContain("Baytwaard");
  expect(screen.getByText("Design That Speaks")).toBeTruthy();
  expect(screen.getByRole("link", { name: `${WEB_WORK.itemLinkLabel} — Profit Assurance` }).getAttribute("href")).toBe("/case-studies/c2");
  expect(screen.getByRole("link", { name: `${WEB_WORK.itemLinkLabel} — Sudatel` }).getAttribute("href")).toBe("/case-studies/c1");
  expect(screen.getByRole("img", { name: "Profit Assurance website" }).getAttribute("src")).toBe("/p.png");
  expect(screen.getByRole("link", { name: WEB_WORK.link.label }).getAttribute("href")).toBe("/case-studies");
});

test("FAQ is an accessible disclosure: default-open item open, others toggle by button", async () => {
  serve(SERVICE);
  render(<ServiceDetailPage />);
  const first = await screen.findByRole("button", { name: "Will my website be mobile-friendly?" });
  const second = screen.getByRole("button", { name: "What technologies do you use?" });
  expect(first.getAttribute("aria-expanded")).toBe("true");
  expect(second.getAttribute("aria-expanded")).toBe("false");
  const panel = document.getElementById(second.getAttribute("aria-controls"));
  expect(panel.getAttribute("aria-hidden")).toBe("true");
  fireEvent.click(second);
  expect(second.getAttribute("aria-expanded")).toBe("true");
  expect(panel.getAttribute("aria-hidden")).toBe("false");
});

test("other service slugs keep the existing layout (the reference design is not propagated)", async () => {
  mockSlug = "google-ads";
  serve({ ...SERVICE, slug: "google-ads", heroHeading: "Ads heading", blocks: [] });
  const { container } = render(<ServiceDetailPage />);
  expect(await screen.findByRole("heading", { level: 1, name: "Ads heading" })).toBeTruthy();
  expect(container.querySelector("[data-service-layout]")).toBeNull();
  expect(container.querySelector("section.bg-black")).toBeTruthy();
  expect(screen.queryByRole("heading", { level: 2, name: WEB_ENGINEERING.title })).toBeNull();
});

const SEO = {
  slug: "seo-marketing",
  title: "SEO",
  tag: "SEO",
  description: "Data-driven SEO strategies.",
  heroHeading: "SEO – Because Page 2 of Google Is a Dead End",
  heroSubheading: "Get found by the right people.",
  heroImageUrl: "/seo7.jpg",
  heroCtaText: "Get Started",
  heroCtaLink: "/contact-us",
  blocks: [
    { type: "webSolutions", heading: "Supercharge Your Online Visibility with Expert SEO", descriptions: ["SEO paragraph one.", "SEO paragraph two."], imageUrl: "/seo4.jpg" },
    { type: "steps", items: [
      { callout: "Keyword Research", title: "Unleashing the Power of High-Impact Keywords", description: "Keywords first.", image: "/s1.png" },
      { callout: "SEO Analytics", title: "Monitoring & Maximizing Performance", description: "Track and refine.", image: "/s5.png" },
    ] },
    { type: "faq", heading: "Frequently Asked Questions", subtitle: "Everything you need to know about our SEO services.",
      questions: [{ title: "How does SEO help my business?", content: "More organic traffic.", defaultOpen: true }] },
  ],
};

test("seo-marketing uses the reference layout with its own content and reused SEO copy only", async () => {
  mockSlug = "seo-marketing";
  mockPortfolio = { items: CASES, loading: false, error: null };
  serve(SEO);
  const { container } = render(<ServiceDetailPage />);
  expect(await screen.findByRole("heading", { level: 1, name: SEO.heroHeading })).toBeTruthy();
  expect(container.querySelector('[data-service-layout="brand-reference"]')).toBeTruthy();
  const hero = screen.getByRole("heading", { level: 1 }).closest("section");
  expect(within(hero.nextElementSibling).getAllByText("React").length).toBeGreaterThan(0);

  expect(screen.getByRole("heading", { level: 2, name: /Supercharge Your Online Visibility with Expert SEO/ })).toBeTruthy();
  for (const text of [SEO.heroSubheading, "SEO paragraph one.", "SEO paragraph two.", "01 • KEYWORD RESEARCH", "02 • SEO ANALYTICS",
    "Keywords first.", "Track and refine.", SEO_SERVICES_INTRO.text, "Everything you need to know about our SEO services.", "More organic traffic."]) {
    expect(screen.getAllByText(text).length).toBeGreaterThan(0);
  }
  expect(screen.getByRole("heading", { level: 2, name: new RegExp(`^${SEO_SERVICES_INTRO.title}\\s?\\.$`) })).toBeTruthy();
  expect(screen.getByRole("img", { name: "Keyword Research" }).getAttribute("src")).toBe("/s1.png");
  expect(screen.getByRole("heading", { level: 2, name: SEO_WHY.title })).toBeTruthy();
  for (const f of SEO_WHY.features) expect(screen.getByRole("heading", { level: 3, name: f.title })).toBeTruthy();
  expect(screen.getAllByRole("link", { name: "SEO pricing" }).every((a) => a.getAttribute("href") === "/pricing/seo")).toBe(true);

  // Website-only sections and copy do not leak onto the SEO page.
  expect(screen.queryByRole("heading", { level: 2, name: /^Built for the web/ })).toBeNull();
  expect(screen.queryByRole("heading", { level: 2, name: WEB_WORK.title })).toBeNull();
  expect(screen.queryByRole("heading", { level: 2, name: WEB_ENGINEERING.title })).toBeNull();
  expect(screen.queryByText(WEB_STATEMENT)).toBeNull();
  expect(screen.queryByRole("link", { name: "Website pricing" })).toBeNull();
});

test("web-dev shows a branded loading state, then the page", async () => {
  let resolve;
  global.fetch = jest.fn(() => new Promise((done) => { resolve = done; }));
  render(<ServiceDetailPage />);
  expect(screen.getByRole("status").textContent).toBe("Loading…");
  await act(async () => resolve({ json: async () => ({ ok: true, item: SERVICE }) }));
  expect(screen.getByRole("heading", { level: 1, name: SERVICE.heroHeading })).toBeTruthy();
});
