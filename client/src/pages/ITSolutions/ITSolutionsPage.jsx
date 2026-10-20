import React, { useEffect, useState } from "react";
import AuroraHero from "../../components/BannerSection/bannerSection";
import HomeSection from "../../components/HomeSection/HomeSection";
import SolutionCard from "../../components/SolutionCard/SolutionCard";
import WhyExpressoGrid from "../../components/WhyExpressoGrid/WhyExpressoGrid";
import ProcurementProcess from "../../components/ProcurementProcess/ProcurementProcess";
import TechnologyCTA from "../../components/TechnologyCTA/TechnologyCTA";
import TechnologyVendorPanel from "../../components/TechnologyVendorPanel/TechnologyVendorPanel";
import { groupTechnologySolutions } from "../../utils/technologyGroups";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage, toWebsiteImageUrl } from "../../utils/websiteImages";

const API = process.env.REACT_APP_API_URL || "/api";

const DEFAULT_IT_SOLUTIONS_PAGE_COPY = {
  heroHeading: "Technology Solutions",
  heroSubtitle: "Enterprise IT Procurement, Simplified",
  heroDescription:
    "From ERP and CRM to IoT, cloud infrastructure, and data center hardware — we source, procure, and deploy the right technology for your business.",
  offerEyebrow: "What We Offer",
  offerTitle: "Technology for every",
  offerHighlight: "business layer",
  offerSubtitle:
    "Find the right technology across business software, cloud and hosting, infrastructure, and connectivity and advisory.",
};

function pageCopy(settings = {}, key) {
  return settings[key] || DEFAULT_IT_SOLUTIONS_PAGE_COPY[key];
}

export default function ITSolutionsPage() {
  const settings = useSiteSettings();
  const pageSettings = settings?.itSolutions || {};
  const [solutions, setSolutions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Strict Mode replays this effect. Ignore retired results instead of
    // aborting the read during cleanup (which creates a lifecycle AbortError).
    let alive = true;
    fetch(`${API}/web-content/solutions`)
      .then((r) => {
        if (!r.ok) throw new Error("Unable to load solutions");
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        if (!Array.isArray(d.items)) throw new Error("Invalid solutions response");
        setSolutions(d.items);
        setGroups(Array.isArray(d.groups) ? d.groups : []);
      })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const groupedSolutions = groupTechnologySolutions(solutions, groups);

  const heroImageUrl = pageSettings.heroImageUrl
    ? toWebsiteImageUrl(pageSettings.heroImageUrl)
    : resolveWebsiteImage(settings, "/81.webp");

  return (
    <>
      <AuroraHero
        key={heroImageUrl}
        heading={pageCopy(pageSettings, "heroHeading")}
        subtitle={pageCopy(pageSettings, "heroSubtitle")}
        description={pageCopy(pageSettings, "heroDescription")}
        backgroundImageUrl={heroImageUrl}
      />

      <HomeSection
        eyebrow={pageCopy(pageSettings, "offerEyebrow")}
        title={pageCopy(pageSettings, "offerTitle")}
        highlight={pageCopy(pageSettings, "offerHighlight")}
        subtitle={pageCopy(pageSettings, "offerSubtitle")}
        align="center"
      >
        <nav aria-label="Technology solution groups" className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {groupedSolutions.filter((group) => group.items.length).map((group) => (
            <a key={group.id} href={`#${group.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-lotus-200 bg-lotus-50 px-5 py-4 text-sm font-bold text-lotus-700 transition hover:border-lotus-400 hover:bg-white">
              {group.label}<span aria-hidden="true">↓</span>
            </a>
          ))}
        </nav>

        {loading && <p role="status" className="py-8 text-center text-ink-600">Loading technology solutions…</p>}
        {error && <p role="alert" className="rounded-2xl bg-mist p-6 text-center text-ink-600">We couldn’t load our solutions. Please refresh the page or <a className="font-semibold text-lotus-700 underline" href="/contact-us">contact our team</a> for help.</p>}
        {!loading && !error && !solutions.length && <p className="py-8 text-center text-ink-600">Our technology catalog is being updated. <a className="font-semibold text-lotus-700 underline" href="/contact-us">Tell us what you need.</a></p>}

        <div className="space-y-12 md:space-y-16">
          {groupedSolutions.filter((group) => group.items.length).map((group) => (
            <section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`} className="scroll-mt-32 border-t border-ink-200 pt-8">
              <div className="mb-6 max-w-2xl">
                <h2 id={`${group.id}-title`} className="font-dax-compact text-2xl font-bold text-night sm:text-3xl">{group.label}</h2>
                <p className="mt-2 text-base leading-relaxed text-ink-600">{group.description}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.items.map((item, index) => <SolutionCard key={item._id || item.slug} {...item} index={index} />)}
              </div>
            </section>
          ))}
        </div>
      </HomeSection>

      <TechnologyVendorPanel />

      <WhyExpressoGrid />

      <ProcurementProcess />

      <TechnologyCTA />
    </>
  );
}
