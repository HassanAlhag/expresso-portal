import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FiArrowRight, FiChevronRight } from "react-icons/fi";
import { BrandMark } from "../../brand";
import useDigitalProducts from "../../hooks/useDigitalProducts";
import BusinessSuiteVisual from "../DigitalSolutions/BusinessSuiteVisual";
import BusinessSuiteSection from "../DigitalSolutions/BusinessSuiteSection";
import ProductLoadStatus from "../DigitalSolutions/ProductLoadStatus";

export default function BusinessSuitePage() {
  const { products, loading, error, retry } = useDigitalProducts();
  const product = products.find((item) => item.slug === "business-suite");
  return (
    <>
      <Helmet>
        <title>{product.title} — Modular Business Operations | Expresso Digital</title>
        <meta name="description" content={product.description} />
        {typeof window !== "undefined" ? <link rel="canonical" href={`${window.location.origin}${product.to}`} /> : null}
      </Helmet>
      <section className="overflow-hidden bg-night pb-16 pt-32 text-white sm:pt-36 lg:pb-24">
        <div className="mx-auto w-[min(1200px,92vw)]">
          <nav aria-label="Breadcrumb" className="mb-9 text-[13px] font-medium text-white/60"><ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0"><li><Link to="/digital-solutions" className="hover:text-white">Digital Solutions</Link></li><li aria-hidden="true"><FiChevronRight /></li><li aria-current="page">Expresso Business Suite</li></ol></nav>
          <div className="grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-lotus-300/30 bg-lotus-400/10 px-3 py-2 text-xs font-bold text-lotus-200"><BrandMark size={22} tone="white" />{product.badge}</span>
              <h1 className="mb-4 mt-5 text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">{product.title}</h1>
              <p className="mb-4 mt-0 text-xl font-semibold leading-snug text-lotus-200 sm:text-2xl">{product.tagline}</p>
              <p className="m-0 max-w-xl text-base leading-relaxed text-white/65">{product.description}</p>
              <div className="mt-7 flex flex-wrap gap-3"><Link to={product.demoCtaHref} className="inline-flex items-center gap-2 rounded-full bg-lotus-400 px-6 py-3.5 text-sm font-bold text-night hover:bg-lotus-300">{product.demoCtaLabel}<FiArrowRight aria-hidden="true" /></Link><a href="#modules" className="rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/5">Explore modules</a></div>
            </div>
            <BusinessSuiteVisual imageUrl={product.heroImageUrl} eager dark />
          </div>
        </div>
      </section>
      <section className="bg-white py-16 md:py-24" aria-labelledby="suite-overview">
        <div className="mx-auto flex w-[min(1200px,92vw)] flex-col gap-8">
          <ProductLoadStatus loading={loading} error={error} retry={retry} />
          <div className="grid min-w-0 items-center gap-9 lg:grid-cols-2 lg:gap-16">
            <div className="min-w-0 lg:order-2"><p className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-lotus-600">Modular business operations</p><h2 id="suite-overview" className="mb-5 mt-3 text-3xl font-bold leading-tight tracking-tight text-night sm:text-4xl">Start with what you need.<br /><span className="text-lotus-600">Add modules as your business grows.</span></h2><p className="m-0 text-base leading-relaxed text-ink-600">Bring customer relationships, delivery work and everyday operations into one connected workspace. Choose the modules that fit your team, with client and vendor access where it is needed.</p><p className="mb-0 mt-4 text-sm leading-relaxed text-ink-600">From the first enquiry to a project and its invoice, related records help your team keep the context of the work.</p><a href="#modules" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-lotus-700">Find your starting point<FiArrowRight aria-hidden="true" /></a></div>
            <div className="min-w-0 lg:order-1"><BusinessSuiteVisual view="projects" /></div>
          </div>
        </div>
      </section>
      <BusinessSuiteSection product={product} />
      <section className="bg-white py-10 md:py-12" aria-labelledby="suite-closing-title">
        <div className="mx-auto flex w-[min(1200px,92vw)] min-w-0 flex-col items-center gap-5 rounded-[28px] border border-ink-200 bg-sand px-6 py-8 text-center sm:px-8 sm:py-10">
          <div className="min-w-0 max-w-2xl">
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-espresso">Ready to get started?</p>
            <h2 id="suite-closing-title" className="mb-3 mt-3 text-3xl font-bold leading-tight tracking-tight text-night sm:text-4xl">Build the Business Suite around your operation.</h2>
            <p className="mx-auto mb-0 mt-0 max-w-xl text-base leading-relaxed text-ink-600">Start with the modules you need today and expand as your business grows.</p>
          </div>
          <Link to="/contact-us?interest=business-suite-demo" className="inline-flex max-w-full items-center justify-center gap-2 rounded-full bg-night px-6 py-3.5 text-sm font-bold text-white transition hover:bg-lotus-900">Request a Business Suite Demo<FiArrowRight className="shrink-0" aria-hidden="true" /></Link>
        </div>
        <div className="mx-auto mt-8 flex w-[min(1200px,92vw)] flex-wrap justify-between gap-4 text-sm"><Link to="/digital-solutions" className="font-semibold text-lotus-700">All Digital Solutions</Link><Link to="/digital-solutions/cas" className="font-semibold text-lotus-700">Looking for clinic software? Explore CAS →</Link></div>
      </section>
    </>
  );
}
