// Navigation information architecture (approved Oct 2026):
//   About · Digital Services · Digital Solutions · Technology Solutions ·
//   Our Work · Work With Us   (+ Client Portal; the logo links Home)
// One source for the desktop mega menu and the mobile drawer.
import { useEffect, useState } from "react";

const API = process.env.REACT_APP_API_URL || "/api";

// ---- CMS data (cached for the session) -------------------------------------
const cache = { services: null, solutions: null, digital: null };
const inflight = {};

function load(kind, path) {
  if (cache[kind]) return Promise.resolve(cache[kind]);
  if (!inflight[kind]) {
    inflight[kind] = fetch(`${API}${path}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
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
  const [digital, setDigital] = useState(cache.digital || []);
  // Distinguishes "still loading" from "loaded, nothing published yet".
  const [digitalLoaded, setDigitalLoaded] = useState(cache.digital !== null);
  useEffect(() => {
    let alive = true;
    load("services", "/web-content/services").then((x) => alive && setServices(x));
    // Technology Solutions: the API default excludes kind "digital".
    load("solutions", "/web-content/solutions").then((x) => alive && setSolutions(x));
    load("digital", "/web-content/solutions?kind=digital").then((x) => {
      if (!alive) return;
      setDigital(x);
      setDigitalLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  return { services, solutions, digital, digitalLoaded };
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
// Digital Solutions: CMS Solution records with kind "digital".
function digitalFeatured(digital) {
  return digital.map((p) => ({
    title: p.subtitle ? `${p.title} — ${p.subtitle}` : p.title,
    desc: p.tagline || p.description,
    to: `/digital-solutions/${p.slug}`,
    badge: p.badge || "Built by Expresso",
    cta: p.ctaLabel || `Explore ${p.title}`,
  }));
}

function digitalAction(digital) {
  const withDemo = digital.find((p) => p.demoCtaHref);
  return {
    tone: "lotus",
    eyebrow: "See it working",
    title: "Request a demo",
    text: withDemo
      ? `A walkthrough of ${withDemo.title} with the Expresso team.`
      : "A walkthrough of our software with the Expresso team.",
    primary: {
      to: withDemo?.demoCtaHref || "/contact-us?interest=digital-solutions",
      label: withDemo?.demoCtaLabel || "Request a demo",
    },
  };
}

// Shown when the CMS has no published Digital Solution (or the API is down):
// the menu still leads somewhere useful instead of "Loading…" forever.
const DIGITAL_FALLBACK_GROUPS = [
  {
    label: "Digital Solutions",
    columns: 1,
    items: [
      {
        title: "See our Digital Solutions",
        desc: "Software designed, built and owned by Expresso",
        to: "/digital-solutions",
      },
    ],
  },
];

export function buildMenus({
  services = [],
  solutions = [],
  digital = [],
  digitalLoaded = false,
} = {}) {
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
      href: "/digital-solutions",
      match: ["/digital-solutions", "/products/"],
      width: 900,
      context: {
        eyebrow: "Digital Solutions",
        title: "Software Expresso designs, builds and owns.",
        text: "Products built by our team — not resold, not white-labelled.",
        mark: true,
        link: { to: "/digital-solutions", label: "All digital solutions" },
      },
      featured: digitalFeatured(digital),
      groups: digitalLoaded && !digital.length ? DIGITAL_FALLBACK_GROUPS : [],
      emptyText: "Loading solutions…",
      action: digitalAction(digital),
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
      // Stage 3 replaces this single list with the four approved groups.
      groups: [
        {
          label: "Solutions",
          columns: 3,
          items: solutions.map((s) => ({
            title: s.title,
            desc: s.subtitle,
            to: `/it-solutions/${s.slug}`,
          })),
        },
      ],
      emptyText: "Loading solutions…",
      action: {
        tone: "sand",
        eyebrow: "For vendors & suppliers",
        title: "Become an Expresso vendor",
        text: "Join the procurement network behind our technology solutions. Approved vendors receive matching RFQs.",
        primary: { to: "/vendor-registration", label: "Register as a vendor" },
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
