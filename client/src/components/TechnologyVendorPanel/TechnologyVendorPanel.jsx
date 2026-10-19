import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import SectionEyebrow from "../../brand/SectionEyebrow";

export default function TechnologyVendorPanel() {
  return (
    <section aria-labelledby="technology-vendor-title" className="bg-sand py-14 md:py-20">
      <div className="mx-auto grid w-[min(1200px,92vw)] items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
        <div className="max-w-2xl">
          <SectionEyebrow mark>For technology suppliers</SectionEyebrow>
          <h2 id="technology-vendor-title" className="mt-4 font-dax-compact text-3xl font-bold leading-tight text-night sm:text-4xl">
            Become an Expresso Vendor
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-600">
            Supply technology to businesses through Expresso. Register your company
            and solution or product categories to participate in our procurement
            and request for quotation (RFQ) process.
          </p>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-center">
          <Link to="/vendor-registration" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-night px-6 py-3 text-sm font-bold text-white transition hover:bg-night-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lotus-600">
            Register as a Vendor <FiArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/portal/login" className="text-sm font-semibold text-espresso underline-offset-4 hover:underline">
            Already approved? Vendor Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
