import React, { memo, useEffect, useMemo, useState } from "react";
import {
  MonitorSmartphone,
  Megaphone,
  Search,
  PenTool,
  BarChart3,
  Clapperboard,
} from "lucide-react";
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
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImages } from "../../utils/websiteImages";

// ─── Stats ───────────────────────────────────────────────────────────────────

const MARKETING_STATS = [
  { num: 85, suffix: " %", subheading: "Increase in website traffic with SEO optimization" },
  { num: 25, decimals: 1, suffix: " K+", subheading: "Social media followers gained through campaigns" },
  { num: 50, suffix: " M+", subheading: "Ad impressions from targeted PPC campaigns" },
];

const COUNTUP_HEADING = {
  textBefore: "DRIVE SUCCESS WITH",
  highlight: "EXPRESSO DIGITAL MARKETING",
  textAfter: "",
};

// ─── Services section ─────────────────────────────────────────────────────────

const HOME_SERVICE_CARDS = [
  {
    title: "Website Design & Development",
    text: "Conversion-focused websites and landing pages built to look premium and perform fast.",
    Icon: MonitorSmartphone,
    tone: "brand",
    size: "hero",
  },
  {
    title: "SEO Optimization",
    text: "Structure, content, and search visibility improvements that help quality traffic grow.",
    Icon: Search,
    tone: "light",
  },
  {
    title: "Paid Ads & PPC",
    text: "Performance campaigns designed to generate leads, sales, and measurable growth.",
    Icon: Megaphone,
    tone: "light",
  },
  {
    title: "Branding & Visual Direction",
    text: "Sharper positioning, cleaner visuals, and brand systems that make your business stand out.",
    Icon: PenTool,
    tone: "brand-soft",
  },
  {
    title: "Tracking & Analytics",
    text: "Clear reporting and setup that helps you understand what is working and where to improve.",
    Icon: BarChart3,
    tone: "light",
  },
  {
    title: "Social Media Content",
    text: "Creative content systems for brands that want consistency, reach, and stronger presence.",
    Icon: Clapperboard,
    tone: "image",
    image: "/home2.jpg",
    size: "tall",
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────

const HOME_TESTIMONIALS = [
  {
    img: "/godfel-logo.png",
    description:
      "Working with Expresso transformed our marketing efforts. Their innovative strategies and expert execution drove significant growth for our brand. Highly recommended!",
    name: "Felix Afram",
    title: "General Manager, Godfel Group",
  },
  {
    img: "/pat-logo.png",
    description:
      "The team at Expresso truly understands the digital landscape. Their user-focused approach helped us enhance our customer experience, making a lasting impact on our platform.",
    name: "Omar Gomma",
    title: "UX Research, Profit Assurance",
  },
  {
    img: "/floraison-logo.png",
    description:
      "Expresso's creativity and technical expertise are unmatched. They delivered a tailored solution that exceeded our expectations and drove measurable results.",
    name: "Dr. Anita George",
    title: "GP & Cosmetic Dentist",
  },
  {
    img: "/mih-logo.png",
    description:
      "Expresso is a game-changer! Their data-driven insights and marketing strategies helped us reach a wider audience and achieve our business goals.",
    name: "Dr. Yasir Ali Pullat",
    title: "Senior Dentist, Mih Dental",
  },
  {
    img: "/alb-logo.png",
    description:
      "A top-notch team at Expresso combines professionalism with creativity. They delivered an exceptional solution that aligned perfectly with our objectives.",
    name: "Daniel Henderson",
    title: "Engineering Manager, Alb Filter",
  },
  {
    img: "/aroma-logo.png",
    description:
      "Expresso's innovative approach to digital marketing has been instrumental in helping us achieve higher engagement and better ROI. Fantastic team to work with!",
    name: "Varun Devnani",
    title: "Founder",
  },
];

// ─── CTA section ──────────────────────────────────────────────────────────────

const HOME_CTA = {
  badge: "READY TO MOVE?",
  heading: "Let's turn your idea",
  headingHighlight: "into a clear growth plan",
  description:
    "Tell us your goal, your style, and what you need. We'll help shape the right direction for your brand, website, or campaign.",
  primaryLabel: "Build Your Plan",
  secondaryLabel: "Schedule a Call",
  secondaryLink: "/contact",
};

// ─── Gallery defaults ─────────────────────────────────────────────────────────

const DEFAULT_GALLERY = [
  { src: "/gal3.png", alt: "Gallery 1" },
  { src: "/gal1.png", alt: "Gallery 2" },
  { src: "/afrid.PNG", alt: "Gallery 3" },
  { src: "/gal2.png", alt: "Gallery 4" },
  { src: "/gal4.png", alt: "Gallery 5" },
  { src: "/ultimate1.png", alt: "Gallery 6" },
  { src: "/odeur1.png", alt: "Gallery 7" },
  { src: "/mih1.png", alt: "Gallery 8" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function Home() {
  const [productionItems, setProductionItems] = useState([]);
  const settings = useSiteSettings();

  const scrollToLeadForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    listWebsiteReels()
      .then((res) => setProductionItems(Array.isArray(res?.items) ? res.items : []))
      .catch(() => setProductionItems([]));
  }, []);

  const reels = useMemo(() => mapWebsiteReels(productionItems), [productionItems]);

  const galleryImages = useMemo(() => {
    const configured = (settings?.gallery?.images || []).filter((i) => i?.url);
    if (configured.length > 0) {
      return configured.map((i) => ({ src: i.url, alt: i.alt || "Gallery" }));
    }
    return resolveWebsiteImages(settings, DEFAULT_GALLERY);
  }, [settings]);

  const marqueeItems = useMemo(() => {
    const configured = (settings?.marquee?.brands || []).filter((b) => b?.imageUrl);
    return configured.length > 0 ? configured : null;
  }, [settings]);

  return (
    <main className="min-h-screen bg-white text-black">
      <Banner />

      <div className="relative z-10">
        <CountUpStats heading={COUNTUP_HEADING} stats={MARKETING_STATS} />
        <TextParallaxContentExample />
        <ServicesSection
          onPrimaryClick={scrollToLeadForm}
          cards={HOME_SERVICE_CARDS}
        />
        <ShuffleHero items={marqueeItems} />
        <ReelsShowcase reels={reels} onCtaClick={scrollToLeadForm} />
        <StackedCardTestimonials testimonials={HOME_TESTIMONIALS} />
        <DragCards
          title="EXPRESSO"
          images={galleryImages}
          onPrimaryClick={scrollToLeadForm}
        />
        <FinalCTASection onPrimaryClick={scrollToLeadForm} {...HOME_CTA} />
      </div>
    </main>
  );
}

export default memo(Home);
