import React from "react";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import { ProtfolioHeader } from "../../components/ServicesComponents/portfolioHeader";
import PortfolioGrid from "../../components/PortfolioComponents/portfolioList";
import { useSiteSettings } from "../../hooks/useSiteSettings";

export default function PortfolioPage() {
  const settings = useSiteSettings();

  return (
    <div>
      <ServiceBanner
        heading="Our Work, Your Success"
        subHeading="A curated selection of brands we’ve helped grow through design, development, and performance marketing. Explore real projects, real outcomes, and work that turns visitors into customers."
        backgroundImage={settings?.portfolio?.heroImageUrl || "/80.jpg"}
        ctaText="Contact Us"
        ctaLink="/contact-us"
        badgeText="Go"
        badgeText2="Brands That Leveled Up"
        badgeLink="https://www.yourportfolio.com"
      />

      <ProtfolioHeader />

      <PortfolioGrid />
    </div>
  );
}
