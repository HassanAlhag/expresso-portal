import React, { useEffect, useState } from "react";
import AuroraHero from "../../components/BannerSection/bannerSection";
import HomeSection from "../../components/HomeSection/HomeSection";
import SolutionCard from "../../components/SolutionCard/SolutionCard";
import WhyExpressoGrid from "../../components/WhyExpressoGrid/WhyExpressoGrid";
import ProcurementProcess from "../../components/ProcurementProcess/ProcurementProcess";
import TechnologyCTA from "../../components/TechnologyCTA/TechnologyCTA";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage, toWebsiteImageUrl } from "../../utils/websiteImages";

const DEFAULT_IT_SOLUTIONS_PAGE_COPY = {
  heroHeading: "Technology Solutions",
  heroSubtitle: "Enterprise IT Procurement, Simplified",
  heroDescription:
    "From ERP and CRM to IoT, cloud infrastructure, and data center hardware — we source, procure, and deploy the right technology for your business.",
  offerEyebrow: "What We Offer",
  offerTitle: "Our solution",
  offerHighlight: "categories",
  offerSubtitle:
    "We cover every layer of enterprise technology — software, hardware, infrastructure, and consulting.",
};

function pageCopy(settings = {}, key) {
  return settings[key] || DEFAULT_IT_SOLUTIONS_PAGE_COPY[key];
}

export default function ITSolutionsPage() {
  const settings = useSiteSettings();
  const pageSettings = settings?.itSolutions || {};
  const [solutions, setSolutions] = useState([]);
  const API = process.env.REACT_APP_API_URL || "/api";

  useEffect(() => {
    fetch(`${API}/web-content/solutions`)
      .then((r) => r.json())
      .then((d) => setSolutions(d.items || []))
      .catch(() => {});
  }, []);

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
        title={pageSettings.offerTitle || `${solutions.length || "Our"} solution`}
        highlight={pageCopy(pageSettings, "offerHighlight")}
        subtitle={pageCopy(pageSettings, "offerSubtitle")}
        align="center"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {solutions.map((item, index) => (
            <SolutionCard
              key={item._id || item.slug}
              {...item}
              index={index}
            />
          ))}
        </div>
      </HomeSection>

      <WhyExpressoGrid />

      <ProcurementProcess />

      <TechnologyCTA />
    </>
  );
}
