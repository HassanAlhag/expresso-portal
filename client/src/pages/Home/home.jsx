import React, { memo, useEffect, useMemo, useState } from "react";
import Banner from "../../components/Banner/banner";
import TextParallaxContentExample from "../../components/TextParallax/textParallaxComponent";
import ShuffleHero from "../../components/ShuffleSection/shuffleSection";
import { DragCards } from "../../components/DragCardSection/dragCardSection";
import StackedCardTestimonials from "../../components/TestimonialSection/testimonialSection";
import { CountUpStats } from "../../components/StatsSection/statsSection";
import ReelsShowcase from "../../components/ReelsShowcase/ReelsShowcase";
import ServicesSection from "../../components/ServicesSection/ServicesSection";
import FinalCTASection from "../../components/FinalCTASection/FinalCTASection";
import { listWebsiteReels } from "../../api/websiteProductions";
import { mapWebsiteReels } from "../../utils/mapWebsiteReels";

const MARKETING_STATS = [
  {
    num: 85,
    suffix: " %",
    subheading: "Increase in website traffic with SEO optimization",
  },
  {
    num: 25,
    decimals: 1,
    suffix: " K+",
    subheading: "Social media followers gained through campaigns",
  },
  {
    num: 50,
    suffix: " M+",
    subheading: "Ad impressions from targeted PPC campaigns",
  },
];

const COUNTUP_HEADING = {
  textBefore: "DRIVE SUCCESS WITH",
  highlight: "EXPRESSO DIGITAL MARKETING",
  textAfter: "",
};

const DRAG_CARDS_DATA = {
  title: "EXPRESSO",
  images: [
    { src: "/gal3.png", alt: "Gallery 1" },
    { src: "/gal1.png", alt: "Gallery 2" },
    { src: "/afrid.PNG", alt: "Gallery 3" },
    { src: "/gal2.png", alt: "Gallery 4" },
    { src: "/gal4.png", alt: "Gallery 5" },
    { src: "/ultimate1.png", alt: "Gallery 6" },
    { src: "/odeur1.png", alt: "Gallery 7" },
    { src: "/mih1.png", alt: "Gallery 8" },
  ],
};

function Home() {
  const [productionItems, setProductionItems] = useState([]);

  const scrollToLeadForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    const loadReels = async () => {
      try {
        const res = await listWebsiteReels();
        setProductionItems(Array.isArray(res?.items) ? res.items : []);
      } catch (err) {
        console.error("Failed to load website reels:", err);
        setProductionItems([]);
      }
    };

    loadReels();
  }, []);

  const reels = useMemo(
    () => mapWebsiteReels(productionItems),
    [productionItems]
  );

  return (
    <main className="min-h-screen bg-white text-black">
      <Banner />

      <div className="relative z-10">
        <CountUpStats heading={COUNTUP_HEADING} stats={MARKETING_STATS} />
        <TextParallaxContentExample />
        <ServicesSection onPrimaryClick={scrollToLeadForm} />
        <ShuffleHero />
        <ReelsShowcase reels={reels} onCtaClick={scrollToLeadForm} />
        <StackedCardTestimonials />
        <DragCards
          title={DRAG_CARDS_DATA.title}
          images={DRAG_CARDS_DATA.images}
          onPrimaryClick={scrollToLeadForm}
        />
        <FinalCTASection onPrimaryClick={scrollToLeadForm} />
      </div>
    </main>
  );
}

export default memo(Home);
