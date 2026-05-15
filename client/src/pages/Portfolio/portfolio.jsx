import React from "react";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import { ProtfolioHeader } from "../../components/ServicesComponents/portfolioHeader";
import PortfolioGrid from "../../components/PortfolioComponents/portfolioList";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImageSetting } from "../../utils/websiteImages";

export default function PortfolioPage() {
  const settings = useSiteSettings();

  return (
    <div className="bg-white">
      <ServiceBanner
        heading="Case Studies"
        subHeading="A curated selection of brands we’ve helped grow through design, development, and performance marketing. Explore real projects, real outcomes, and work that turns visitors into customers."
        backgroundImage={resolveWebsiteImageSetting(
          settings,
          "/80.jpg",
          settings?.portfolio?.heroImageUrl
        )}
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
