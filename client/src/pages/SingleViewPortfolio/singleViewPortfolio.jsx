import React from "react";
import { useParams } from "react-router-dom";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import ShiftingContactForm from "../../components/ContactForm/contactForm";
import ContactUsSection from "../../components/ContactUsSection/contactSection";
import portfolioData from "./portfolioData";
import PortfolioCaseStudy from "../../components/PortfolioComponents/PortfolioCaseStudy";
import PortfolioGallerySection from "../../components/PortfolioComponents/PortfolioGallerySection";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImages } from "../../utils/websiteImages";

function PrtofolioSingleViewPage() {
  const { id } = useParams();
  const settings = useSiteSettings();
  const resolvedPortfolioData = resolveWebsiteImages(settings, portfolioData);
  const portfolio = resolvedPortfolioData.find((item) => item.id === parseInt(id, 10));

  if (!portfolio) {
    return <div className="text-center py-20">Portfolio not found!</div>;
  }

  const {
    clientName,
    category,
    bannerTitle,
    bannerDesc,
    startDate,
    endDate,
    introDescription,
    problems,
    solutions,
    solutionImage,
    bannerImage,
    result,
  } = portfolio;

  return (
    <div>
      <ServiceBanner
        heading={bannerTitle}
        subHeading={bannerDesc}
        backgroundImage={bannerImage}
        ctaText="Get Started"
        ctaLink="/contact-us"
        badgeText="HEY!"
        badgeText2="EXPLORE"
        badgeLink="https://www.producthunt.com"
        overlayOpacity={0.8}
      />
      <PortfolioCaseStudy
        clientName={clientName}
        category={category}
        startDate={startDate}
        endDate={endDate}
        introDescription={introDescription}
        problems={problems}
        solutions={solutions}
        solutionImage={solutionImage}
        result={result}
      />
      <PortfolioGallerySection
        title="Expresso Case Study Gallery"
        images={portfolio.imageUrls} // can be ["url", "url"] OR [{src, alt}]
        height={600}
      />
      <ContactUsSection
        heading="Crafting Stories Through Design"
        content="Step into a world where creativity meets precision. Each project we undertake is driven by our passion, skill, and unwavering commitment to excellence. From concept to completion, we bring ideas to life, ensuring they leave a lasting impression. Discover how we turn vision into reality."
      />
      <ShiftingContactForm />
    </div>
  );
}

export default PrtofolioSingleViewPage;
