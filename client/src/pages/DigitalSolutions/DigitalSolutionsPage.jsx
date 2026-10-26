import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import { BrandMark, SectionEyebrow } from "../../brand";
import { toWebsiteImageUrl } from "../../utils/websiteImages";
import { CAS_IMAGES, CAS_PLATFORM_SUMMARY } from "../../data/casProduct";
import { getBusinessSuiteBlocks } from "../../data/businessSuiteProduct";
import useDigitalProducts from "../../hooks/useDigitalProducts";
import BusinessSuiteVisual from "./BusinessSuiteVisual";
import ProductLoadStatus from "./ProductLoadStatus";

// Preserve the original explanation of how Expresso's three offerings differ.
const SITE_PARTS = [
  { key: "services", eyebrow: "Digital Services", title: "We do the work for you", text: "Websites, apps, SEO, ads, social media, video and content, delivered by our team.", to: "/services", cta: "Explore Digital Services" },
  { key: "digital", eyebrow: "Digital Solutions", title: "Software we build and own", text: "Products designed, developed and supported by Expresso, ready for your organisation to use.", current: true },
  { key: "technology", eyebrow: "Technology Solutions", title: "Technology we source and deliver", text: "ERP, cloud, infrastructure and connectivity, sourced and implemented through our vendor network.", to: "/it-solutions", cta: "Explore Technology Solutions" },
];

function ProductCard({ product, first }) {
  const suite = product.slug === "business-suite";
  const cas = product.slug === "cas";
  const image = toWebsiteImageUrl(product.heroImageUrl);
  const modules = suite ? getBusinessSuiteBlocks(product.blocks).filter((block) => block?.type === "useCases").map((block) => block.title) : [];
  const capabilities = cas
    ? [CAS_PLATFORM_SUMMARY.patient.items.slice(0, 2).join(" · "), CAS_PLATFORM_SUMMARY.patient.items.slice(2).join(" · "), CAS_PLATFORM_SUMMARY.clinic.items.slice(0, 3).join(" · ")]
    : suite ? [modules.slice(0, 2).join(" · "), modules.slice(2, 4).join(" · "), modules.slice(4).join(" · ")].filter(Boolean) : [];
  return (
    <article id={product.slug} aria-labelledby={`product-${product.slug}`} className="flex min-w-0 scroll-mt-28 flex-col overflow-hidden rounded-[28px] border border-ink-200 bg-white">
      <div className="bg-mist p-4 sm:p-6">
        {suite ? <BusinessSuiteVisual imageUrl={product.heroImageUrl} eager /> : image ? (
          <figure className="m-0">
            <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_16px_48px_rgba(21,18,31,0.10)]">
              <div className="border-b border-ink-200 px-4 py-3 text-[11px] font-semibold text-ink-500">{product.title} / {product.subtitle}</div>
              <picture>
                {cas && product.heroImageUrl === CAS_IMAGES.adminDashboard.src ? <source media="(max-width: 639px)" srcSet={CAS_IMAGES.doctorsMobile.src} /> : null}
                <img src={image} alt={`${product.title} product screenshot`} width={1440} height={1420} loading={first ? "eager" : "lazy"} className="block aspect-[1360/780] w-full object-cover object-top max-sm:aspect-[4/5]" />
              </picture>
            </div>
            <figcaption className="mt-3 text-xs text-ink-500">{cas ? "Patient booking and clinic operations" : product.title}</figcaption>
          </figure>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col items-start gap-4 p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-lotus-600">{first ? <BrandMark size={22} tone="lotus-600" /> : null}{product.badge || "Built by Expresso"}</span>
        <div>
          <h3 id={`product-${product.slug}`} className="m-0 text-3xl font-bold leading-tight tracking-tight text-night">{product.title}</h3>
          {product.subtitle ? <p className="mb-0 mt-2 text-base font-semibold text-lotus-700">{product.subtitle}</p> : null}
        </div>
        <p className="m-0 text-sm leading-relaxed text-ink-600 sm:text-base">{product.tagline || product.description}</p>
        {capabilities.length ? <ul className="m-0 grid list-none gap-3 p-0 text-sm leading-relaxed text-ink-700">{capabilities.map((item) => <li key={item} className="flex items-start gap-2"><FiCheck className="mt-0.5 shrink-0 text-lotus-600" aria-hidden="true" /><span>{item}</span></li>)}</ul> : null}
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
          <Link to={product.to} className="inline-flex items-center gap-2 rounded-full bg-night px-5 py-3 text-sm font-bold text-white transition hover:bg-lotus-900">{product.ctaLabel || `Explore ${product.title}`}<FiArrowRight aria-hidden="true" /></Link>
          {product.demoCtaHref ? <Link to={product.demoCtaHref} className="text-sm font-semibold text-lotus-700 underline underline-offset-4">{product.demoCtaLabel || "Request a demo"}</Link> : null}
        </div>
      </div>
    </article>
  );
}

export default function DigitalSolutionsPage() {
  const { products, loading, error, retry } = useDigitalProducts();
  const { hash } = useLocation();
  useEffect(() => {
    // Keep the previous optional anchor usable; discovery CTAs use detail URLs.
    if (hash === "#business-suite") document.getElementById("business-suite")?.scrollIntoView?.({ block: "start" });
  }, [hash]);
  const primary = products.filter((product) => ["cas", "business-suite"].includes(product.slug));
  const other = products.filter((product) => !["cas", "business-suite"].includes(product.slug));
  return (
    <>
      <Helmet>
        <title>Digital Solutions — Software built by Expresso | Expresso Digital</title>
        <meta name="description" content="Software designed, built and owned by Expresso: CAS, our Clinic Appointment System, and Expresso Business Suite, a modular business operations platform." />
        {typeof window !== "undefined" ? <link rel="canonical" href={`${window.location.origin}/digital-solutions`} /> : null}
      </Helmet>
      <section className="relative overflow-hidden bg-night pb-16 pt-36 text-white sm:pt-40 md:pb-20">
        <div className="mx-auto flex w-[min(1200px,92vw)] flex-col gap-6">
          <SectionEyebrow mark tone="dark">Digital Solutions</SectionEyebrow>
          <h1 className="m-0 max-w-4xl text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl md:text-6xl">Software Expresso designs, builds and owns.</h1>
          <p className="m-0 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">Our Digital Solutions are products created by the Expresso team, not resold or white-labelled. We design them, develop them and keep improving them, and we implement them with you.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#our-products" className="inline-flex items-center gap-2 rounded-full bg-lotus-400 px-6 py-3.5 text-sm font-bold text-night hover:bg-lotus-300">Explore our solutions<FiArrowRight aria-hidden="true" /></a>
            <Link to="/contact-us?interest=digital-solutions" className="rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/5">Request a demo</Link>
          </div>
        </div>
      </section>
      <section id="our-products" aria-labelledby="ds-products" className="scroll-mt-24 bg-white py-16 md:py-24">
        <div className="mx-auto flex w-[min(1200px,92vw)] flex-col gap-8">
          <div><p className="m-0 text-[11px] font-bold uppercase tracking-[0.18em] text-lotus-600">Built by Expresso</p><h2 id="ds-products" className="mb-3 mt-3 text-3xl font-bold text-night sm:text-4xl">Our products</h2><p className="m-0 max-w-2xl text-base leading-relaxed text-ink-600">A specialised clinic solution and a modular business platform. Two products, built around different operational needs.</p></div>
          <ProductLoadStatus loading={loading} error={error} retry={retry} />
          <div className="grid items-stretch gap-6 md:grid-cols-2">{primary.map((product, index) => <ProductCard key={product.slug} product={product} first={index === 0} />)}</div>
          {other.length ? <><h2 className="mb-0 mt-8 text-2xl font-bold text-night">More software from Expresso</h2><div className="grid gap-6 md:grid-cols-2">{other.map((product) => <ProductCard key={product.slug} product={product} />)}</div></> : null}
        </div>
      </section>
      <section className="bg-mist py-16 md:py-20" aria-labelledby="ds-compare">
        <div className="mx-auto flex w-[min(1200px,92vw)] flex-col gap-8">
          <div><p className="m-0 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">How Expresso helps</p><h2 id="ds-compare" className="mb-0 mt-3 max-w-3xl text-3xl font-bold text-night sm:text-4xl">Services, our software, and the technology we deliver.</h2></div>
          <div className="grid gap-4 md:grid-cols-3">{SITE_PARTS.map((part) => <div key={part.key} className={`flex flex-col gap-3 rounded-[22px] bg-white p-6 ${part.current ? "border-2 border-lotus-400" : "border border-ink-200"}`} aria-current={part.current ? "page" : undefined}><div className={`text-[12px] font-bold uppercase tracking-[0.14em] ${part.current ? "text-lotus-600" : "text-ink-500"}`}>{part.eyebrow}{part.current ? <span className="sr-only"> (this page)</span> : null}</div><h3 className="m-0 text-xl font-bold text-night">{part.title}</h3><p className="m-0 text-[15px] leading-relaxed text-ink-600">{part.text}</p>{part.to ? <Link to={part.to} className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-bold text-lotus-600">{part.cta}<FiArrowRight aria-hidden="true" /></Link> : <span className="mt-auto pt-2 text-sm font-semibold text-ink-500">You are here</span>}</div>)}</div>
        </div>
      </section>
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto flex w-[min(1200px,92vw)] flex-col items-start gap-6 rounded-[28px] border border-ink-200 bg-sand p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl"><p className="m-0 text-[11px] font-bold uppercase tracking-[0.18em] text-espresso">Talk to the product team</p><h2 className="mb-3 mt-3 text-2xl font-bold text-night sm:text-3xl">See how our software fits your organisation.</h2><p className="m-0 text-[15px] leading-relaxed text-ink-600">Book a walkthrough and we will show you the product working with real scenarios.</p></div>
          <Link to="/contact-us?interest=digital-solutions" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-night px-7 py-3.5 text-sm font-bold text-white hover:bg-lotus-900">Contact the team<FiArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
    </>
  );
}
