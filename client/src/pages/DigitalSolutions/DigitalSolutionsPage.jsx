import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FiArrowRight } from "react-icons/fi";
import { BrandMark, SectionEyebrow } from "../../brand";
import { toWebsiteImageUrl } from "../../utils/websiteImages";
import { mergeDigitalProducts } from "../../data/coreDigitalProducts";

const API = process.env.REACT_APP_API_URL || "/api";

// /digital-solutions — software Expresso designs, builds and owns.
// Core products remain available independently of CMS publication. Published
// Digital Solution records enrich core metadata or add further products.

const PAGE_TITLE = "Digital Solutions — Software built by Expresso | Expresso Digital";
const PAGE_DESCRIPTION =
  "Digital Solutions are software products designed, built and owned by Expresso Digital, starting with CAS, our Clinic Appointment System.";

const SITE_PARTS = [
  {
    key: "services",
    eyebrow: "Digital Services",
    title: "We do the work for you",
    text: "Websites, apps, SEO, ads, social media, video and content, delivered by our team.",
    to: "/services",
    cta: "Explore Digital Services",
  },
  {
    key: "digital",
    eyebrow: "Digital Solutions",
    title: "Software we build and own",
    text: "Products designed, developed and supported by Expresso, ready for your organisation to use.",
    current: true,
  },
  {
    key: "technology",
    eyebrow: "Technology Solutions",
    title: "Technology we source and deliver",
    text: "ERP, cloud, infrastructure and connectivity, sourced and implemented through our vendor network.",
    to: "/it-solutions",
    cta: "Explore Technology Solutions",
  },
];

function productLinks(p) {
  return {
    to: p.to,
    cta: p.ctaLabel || `Explore ${p.title}`,
    demoTo: p.demoCtaHref || "",
    demoLabel: p.demoCtaLabel || "Request a demo",
  };
}

function Badge({ text, withMark }) {
  return (
    <span className="inline-flex items-center gap-2 self-start rounded-full border border-lotus-300/35 bg-lotus-400/15 py-1.5 pl-2.5 pr-3.5 text-[12px] font-bold text-lotus-200">
      {withMark ? (
        <BrandMark size={18} tone="white" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-lotus-300" aria-hidden="true" />
      )}
      {text || "Built by Expresso"}
    </span>
  );
}

function ProductActions({ p }) {
  const l = productLinks(p);
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        to={l.to}
        className="inline-flex items-center gap-2 rounded-full bg-lotus-400 px-6 py-3 text-sm font-bold text-night transition hover:bg-lotus-300"
      >
        {l.cta}
        <FiArrowRight size={15} aria-hidden="true" />
      </Link>
      {l.demoTo ? (
        <Link
          to={l.demoTo}
          className="inline-flex items-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/5"
        >
          {l.demoLabel}
        </Link>
      ) : null}
    </div>
  );
}

// One product: a wide card, copy beside the product screenshot.
// Several products: a two-column grid. Only the first card carries the
// lotus mark (rule of one mark per card group).
function ProductCard({ p, wide, first }) {
  const img = toWebsiteImageUrl(p.heroImageUrl);
  return (
    <article
      className={`relative flex overflow-hidden rounded-[28px] bg-night text-white ${
        wide ? "flex-col lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : "flex-col"
      }`}
    >
      <div className={`flex flex-col gap-4 p-7 sm:p-9 ${wide ? "lg:py-12 lg:pl-12" : ""}`}>
        <Badge text={p.badge} withMark={first} />
        <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-lotus-300">
          Digital Solution
        </div>
        <h3 className="m-0 text-3xl font-bold leading-tight sm:text-4xl">
          {p.title}
          {p.subtitle ? (
            <span className="mt-1 block text-xl font-semibold text-lotus-200 sm:text-2xl">
              {p.subtitle}
            </span>
          ) : null}
        </h3>
        {p.tagline || p.description ? (
          <p className="m-0 max-w-xl text-base leading-relaxed text-white/70">
            {p.tagline || p.description}
          </p>
        ) : null}
        <div className="mt-2">
          <ProductActions p={p} />
        </div>
      </div>
      {img ? (
        <div className={`relative ${wide ? "px-7 pb-0 sm:px-9 lg:pt-12 lg:pl-0 lg:pr-0" : "px-7 sm:px-9"}`}>
          <img
            src={img}
            alt={`${p.title} product screenshot`}
            loading={first ? "eager" : "lazy"}
            className={`block w-full border border-b-0 border-white/10 object-cover object-top ${
              wide ? "h-[260px] rounded-t-2xl sm:h-[340px] lg:h-full lg:min-h-[380px] lg:rounded-tr-none" : "h-[260px] rounded-t-2xl"
            }`}
          />
        </div>
      ) : null}
    </article>
  );
}

export default function DigitalSolutionsPage() {
  const [cmsProducts, setCmsProducts] = useState(null);
  const [error, setError] = useState(false);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setCmsProducts(null);
    setError(false);
    fetch(`${API}/web-content/solutions?kind=digital`)
      .then((r) => {
        if (!r.ok) throw new Error(`Solutions request failed: ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d?.ok === false || !Array.isArray(d?.items)) throw new Error("Invalid solutions response");
        if (alive) setCmsProducts(d.items);
      })
      .catch(() => { if (alive) setError(true); });
    return () => {
      alive = false;
    };
  }, [requestKey]);

  const products = mergeDigitalProducts(cmsProducts || []);
  const canonical =
    typeof window !== "undefined" ? `${window.location.origin}/digital-solutions` : null;

  return (
    <>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        {canonical ? <link rel="canonical" href={canonical} /> : null}
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden bg-night pb-20 pt-36 text-white sm:pt-40 md:pb-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(760px circle at 10% 10%, rgba(131,144,200,0.22), transparent 42%), radial-gradient(820px circle at 95% 0%, rgba(255,255,255,0.05), transparent 36%)",
          }}
        />
        <div className="relative mx-auto flex w-[min(1200px,92vw)] flex-col gap-6">
          <SectionEyebrow mark tone="dark">
            Digital Solutions
          </SectionEyebrow>
          <h1 className="m-0 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Software Expresso designs, builds and owns.
          </h1>
          <p className="m-0 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Our Digital Solutions are products created by the Expresso team, not resold or
            white-labelled. We design them, develop them and keep improving them, and we
            implement them with you.
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="bg-white py-16 md:py-24" aria-labelledby="ds-products">
        <div className="mx-auto flex w-[min(1200px,92vw)] flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-lotus-600">
              Built by Expresso
            </div>
            <h2 id="ds-products" className="m-0 text-3xl font-bold text-night sm:text-4xl">
              Our products
            </h2>
          </div>

          {cmsProducts === null && !error ? (
            <p role="status" aria-label="Loading products" className="py-4 text-center text-ink-600">
              Loading the latest product information…
            </p>
          ) : null}
          {error ? (
            <div role="alert" className="flex flex-col items-center gap-3 rounded-[28px] bg-mist px-6 py-14 text-center">
              <p className="m-0 text-lg font-semibold text-night">We couldn’t load the latest product information.</p>
              <p className="m-0 text-[15px] text-ink-600">You can still explore our products below. Please try again or contact our team for help.</p>
              <div className="mt-2 flex flex-wrap justify-center gap-4">
                <button type="button" onClick={() => setRequestKey((key) => key + 1)} className="rounded-full bg-lotus-600 px-6 py-3 text-sm font-bold text-white hover:bg-lotus-700">
                  Try again
                </button>
                <Link to="/contact-us?interest=digital-solutions" className="self-center font-semibold text-lotus-700 underline">
                  Contact Expresso
                </Link>
              </div>
            </div>
          ) : null}
          <div className={products.length > 1 ? "grid gap-6 md:grid-cols-2" : "grid"}>
            {products.map((p, i) => (
              <ProductCard key={p.slug} p={p} wide={products.length === 1} first={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Where Digital Solutions sit */}
      <section className="bg-mist py-16 md:py-20" aria-labelledby="ds-compare">
        <div className="mx-auto flex w-[min(1200px,92vw)] flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
              How Expresso helps
            </div>
            <h2 id="ds-compare" className="m-0 text-3xl font-bold text-night sm:text-4xl">
              Services, our software, and the technology we deliver.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {SITE_PARTS.map((part) => (
              <div
                key={part.key}
                className={`flex flex-col gap-3 rounded-[22px] p-6 ${
                  part.current
                    ? "border-2 border-lotus-400 bg-white"
                    : "border border-ink-200 bg-white"
                }`}
                aria-current={part.current ? "page" : undefined}
              >
                <div
                  className={`text-[12px] font-bold uppercase tracking-[0.14em] ${
                    part.current ? "text-lotus-600" : "text-ink-500"
                  }`}
                >
                  {part.eyebrow}
                  {part.current ? <span className="sr-only"> (this page)</span> : null}
                </div>
                <div className="text-xl font-bold text-night">{part.title}</div>
                <p className="m-0 text-[15px] leading-relaxed text-ink-600">{part.text}</p>
                {part.to ? (
                  <Link
                    to={part.to}
                    className="mt-auto inline-flex items-center gap-1.5 pt-2 text-[14px] font-bold text-lotus-600 hover:text-lotus-700"
                  >
                    {part.cta} <FiArrowRight size={14} aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="mt-auto pt-2 text-[14px] font-semibold text-ink-500">
                    You are here
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto flex w-[min(1200px,92vw)] flex-col items-start gap-6 rounded-[28px] border border-[#EDE3D9] bg-sand p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-espresso">
              Talk to the product team
            </div>
            <h2 className="m-0 text-2xl font-bold text-night sm:text-3xl">
              See how our software fits your organisation.
            </h2>
            <p className="m-0 text-[15px] leading-relaxed text-ink-600">
              Book a walkthrough and we will show you the product working with real scenarios.
            </p>
          </div>
          <Link
            to="/contact-us?interest=digital-solutions"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-night px-7 py-3.5 text-sm font-bold text-white transition hover:bg-lotus-900"
          >
            Contact the team
            <FiArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
