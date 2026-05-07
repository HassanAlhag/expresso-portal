import React from "react";
import AuroraHero from "../../components/BannerSection/bannerSection";
import HomeSection from "../../components/HomeSection/HomeSection";
import SolutionCard from "../../components/SolutionCard/SolutionCard";
import WhyExpressoGrid from "../../components/WhyExpressoGrid/WhyExpressoGrid";
import ProcurementProcess from "../../components/ProcurementProcess/ProcurementProcess";
import TechnologyCTA from "../../components/TechnologyCTA/TechnologyCTA";
import { STATIC_SOLUTIONS } from "../../data/technologySolutionsData";

export default function ITSolutionsPage() {
  return (
    <>
      <AuroraHero
        heading="Technology Solutions"
        subtitle="Enterprise IT Procurement, Simplified"
        description="From ERP and CRM to IoT, cloud infrastructure, and data center hardware — we source, procure, and deploy the right technology for your business."
      />

      <HomeSection
        eyebrow="What We Offer"
        title="12 solution"
        highlight="categories"
        subtitle="We cover every layer of enterprise technology — software, hardware, infrastructure, and consulting."
        align="center"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STATIC_SOLUTIONS.map((item, index) => (
            <SolutionCard
              key={item._id || item.title}
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
