// Navigation information architecture (approved Oct 2026):
//   About · Digital Services · Digital Solutions · Technology Solutions ·
//   Our Work · Work With Us   (+ Client Portal; the logo links Home)
// One source for the desktop mega menu and the mobile drawer.
import { useEffect, useState } from "react";
import { CAS_PRODUCT } from "../../data/casProduct";
import { groupTechnologySolutions } from "../../utils/technologyGroups";

const API = process.env.REACT_APP_API_URL || "/api";

// ---- CMS data (cached for the session) -------------------------------------
const cache = { services: null, solutions: null, solutionGroups: [] };
const inflight = {};

function load(kind, path) {
  if (cache[kind]) return Promise.resolve(cache[kind]);
  if (!inflight[kind]) {
    inflight[kind] = fetch(`${API}${path}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (kind === "solutions") cache.solutionGroups = Array.isArray(d?.groups) ? d.groups : [];
        cache[kind] = Array.isArray(d?.items) ? d.items : [];
        return cache[kind];
      })
      .catch(() => [])
      .finally(() => {
        delete inflight[kind];
      });
  }
  return inflight[kind];
}

export function useCmsNavData() {
  const [services, setServices] = useState(cache.services || []);
  const [solutions, setSolutions] = useState(cache.solutions || []);
  useEffect(() => {
    let alive = true;
    load("services", "/web-content/services").then((x) => alive && setServices(x));
    load("solutions", "/web-content/solutions").then((x) => alive && setSolutions(x));
    return () => {
      alive = false;
    };
  }, []);
  return { services, solutions, solutionGroups: cache.solutionGroups };
}

// ---- Digital Services grouping (Build · Grow · Create) ----------------------
const SERVICE_GROUP = {
  "web-dev": "Build",
  "seo-marketing": "Grow",
  "google-ads": "Grow",
  "social-media-marketing": "Grow",
  videography: "Create",
  "content-creation": "Create",
};
const SERVICE_GROUP_ORDER = ["Build", "Grow", "Create", "More"];

function groupServices(services) {
  const groups = new Map(SERVICE_GROUP_ORDER.map((g) => [g, []]));
  for (const s of services) {
    const g = SERVICE_GROUP[s.slug] || "More";
    groups.get(g).push({
      title: s.title,
      desc: s.description,
      to: s.slug ? `/service/${s.slug}` : "/services",
    });
  }
  return [...groups]
    .filter(([, items]) => items.length)
    .map(([label, items]) => ({ label, items }));
}

// ---- Menus -------------------------------------------------------------------
export function buildMenus({ services = [], solutions = [], solutionGroups = [] } = {}) {
  return [
    {
      key: "about",
      text: "About",
      href: "/about-us",
      match: ["/about-us", "/careers", "/contact-us"],
      width: 760,
      context: {
        eyebrow: "About Expresso",
        title: "Who we are and how we work.",
        text: "Our story, the clients we work with, and how to join the team.",
        link: { to: "/about-us", label: "About Expresso" },
      },
      groups: [
        {
          label: "Company",
          items: [
            { title: "Our story", desc: "Who we are and what we stand for", to: "/about-us" },
            { title: "Clients & partners", desc: "Brands we support", to: "/services#clients" },
          ],
        },
        {
          label: "Join & connect",
          items: [
            { title: "Careers", desc: "Open roles and team culture", to: "/careers" },
            { title: "Contact", desc: "Talk to the Expresso team", to: "/contact-us" },
          ],
        },
      ],
    },
    {
      key: "services",
      text: "Digital Services",
      href: "/services",
      match: ["/services", "/service/", "/pricing", "/build-your-plan", "/marketing-solutions"],
      width: 1040,
      context: {
        eyebrow: "Digital Services",
        title: "What we do for you.",
        text: "Websites, apps, SEO, ads, social media, video and content — delivered by our team.",
        link: { to: "/services", label: "All digital services" },
      },
      groups: groupServices(services),
      emptyText: "Loading services…",
      action: {
        tone: "lotus",
        eyebrow: "Plan & pricing",
        title: "Build your plan",
        text: "Pick the services you need and get a clear monthly plan.",
        primary: { to: "/build-your-plan", label: "Build your plan" },
        links: [
          { to: "/pricing/web-dev", label: "Website pricing" },
          { to: "/pricing/seo", label: "SEO pricing" },
          { to: "/pricing/google-ads", label: "Google Ads pricing" },
          { to: "/pricing/social-media", label: "Social media pricing" },
        ],
      },
    },
    {
      key: "digital-solutions",
      text: "Digital Solutions",
      // Stage 2 introduces the /digital-solutions listing; until then the
      // menu heading opens the existing CAS page.
      href: CAS_PRODUCT.to,
      match: ["/products/", "/digital-solutions"],
      width: 900,
      context: {
        eyebrow: "Digital Solutions",
        title: "Software Expresso designs, builds and owns.",
        text: "Products built by our team — not resold, not white-labelled.",
        mark: true,
      },
      featured: [
        {
          title: `${CAS_PRODUCT.name} — ${CAS_PRODUCT.fullName}`,
          desc: CAS_PRODUCT.shortDescription,
          to: CAS_PRODUCT.to,
          badge: "Built by Expresso",
          cta: CAS_PRODUCT.ctaLabel,
        },
      ],
      action: {
        tone: "lotus",
        eyebrow: "See it working",
        title: "Request a demo",
        text: "A walkthrough of CAS for your clinic, with the Expresso team.",
        primary: { to: CAS_PRODUCT.demoHref, label: CAS_PRODUCT.demoCtaLabel },
      },
    },
    {
      key: "technology",
      text: "Technology Solutions",
      href: "/it-solutions",
      match: ["/it-solutions", "/vendor-registration"],
      width: 1140,
      context: {
        eyebrow: "Technology Solutions",
        title: "Enterprise technology, sourced and delivered.",
        text: "We source, implement and support the systems your business runs on — through a vetted vendor network.",
        link: { to: "/it-solutions", label: "All technology solutions" },
      },
      groups: groupTechnologySolutions(solutions, solutionGroups)
        .filter((group) => group.items.length)
        .map((group) => ({
          label: group.label,
          items: group.items.map((s) => ({
            title: s.title,
            desc: s.subtitle,
            to: `/it-solutions/${s.slug}`,
          })),
        })),
      emptyText: "Loading solutions…",
      action: {
        tone: "sand",
        eyebrow: "For vendors & suppliers",
        title: "Become an Expresso Vendor",
        text: "Register your company and solution or product categories to participate in our procurement and RFQ process.",
        primary: { to: "/vendor-registration", label: "Register as a Vendor" },
        secondary: { to: "/portal/login", label: "Already approved? Vendor sign in" },
      },
    },
    {
      key: "work",
      text: "Our Work",
      href: "/portfolio",
      match: ["/portfolio", "/case-studies"],
      width: 760,
      context: {
        eyebrow: "Our Work",
        title: "Work we are proud of.",
        text: "Selected projects, the stories behind them and the brands we work with.",
        link: { to: "/case-studies", label: "Read case studies" },
      },
      groups: [
        {
          label: "Our work",
          items: [
            { title: "Portfolio", desc: "Visual gallery of selected work", to: "/portfolio" },
            { title: "Case studies", desc: "Process, decisions and results", to: "/case-studies" },
            { title: "Clients", desc: "Brands and partners we support", to: "/services#clients" },
          ],
        },
      ],
    },
    {
      key: "work-with-us",
      text: "Work With Us",
      href: "/build-your-plan",
      match: [],
      width: 900,
      context: {
        eyebrow: "Work With Us",
        title: "Start a project, supply us, or join us.",
        text: "Choose how you would like to work with Expresso.",
        link: { to: "/contact-us", label: "Contact the team" },
      },
      groups: [
        {
          label: "As a client",
          items: [
            { title: "Build your plan", desc: "Configure services and pricing", to: "/build-your-plan" },
            { title: "Request a proposal", desc: "Tell us what you need built", to: "/contact-us" },
          ],
        },
        {
          label: "As a vendor",
          items: [
            { title: "Register as a vendor", desc: "Join our procurement network", to: "/vendor-registration" },
          ],
        },
        {
          label: "As talent",
          items: [{ title: "Careers", desc: "Open roles and team culture", to: "/careers" }],
        },
      ],
    },
  ];
}

export function isMenuActive(menu, pathname) {
  if (!pathname || pathname === "/") return false;
  if (pathname === menu.href || pathname.startsWith(`${menu.href}/`)) return true;
  return (menu.match || []).some((m) => pathname === m || pathname.startsWith(m));
}
