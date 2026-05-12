import React from "react";
import AuroraHero from "../../components/BannerSection/bannerSection";
import AboutUsSection from "../../components/AboutUsSection/aboutUsSection";
import { CountUpStats } from "../../components/StatsSection/statsSection";
import AboutWebSection from "../../components/AboutWebSection/aboutWebSection";
import WebDevelopmentProcess from "../../components/WebDevolopmentProcess/webDevelopmentProcess";
import { DrawCircleText } from "../../components/CircleText/circleText";
import SectionHeader from "../../components/SectionHeader/SectionHeader";
import { DisappearingFeatures } from "../../components/CaseStudySection/caseStudySection";
import { useSiteSettings } from "../../hooks/useSiteSettings";

const ABOUT_STATS = [
  {
    num: 12,
    suffix: "+",
    subheading: "Regional markets supported across the Middle East and Africa",
  },
  {
    num: 360,
    suffix: "°",
    subheading: "Strategy, creative, performance, and technology delivery",
  },
  {
    num: 1,
    suffix: " team",
    subheading: "One accountable partner from discovery to ongoing growth",
  },
];

function AboutUsPage() {
  const settings = useSiteSettings();
  const aboutImages = settings?.about || {};

  const cardData = [
    {
      image: aboutImages.blueprintCustomerImageUrl || "/professional.webp",
      title: "Putting Customers at the Center of Everything We Do",
      description:
        "Every business starts with its customers. That’s why our strategies are customized to fit your audience’s needs. By crafting campaigns that speak directly to your target market, we ensure personalized engagement at every touchpoint. The result? Stronger relationships, higher conversions, and a growth trajectory that aligns with your business goals. With us, your success is not just a plan — it’s a partnership.",
    },
    {
      image: aboutImages.blueprintInnovationImageUrl || "/designer.webp",
      title: "Innovative Strategies for the Modern Digital World",
      description:
        "Staying ahead of the digital curve is key to long-term growth. At Expresso, we use cutting-edge digital marketing tactics to propel your business forward. Whether it’s paid ads, social media campaigns, or conversion rate optimization, we continuously push boundaries to create innovative solutions that set your business apart. Our focus is always on delivering results that help you grow faster, smarter, and more sustainably.",
    },
    {
      image: aboutImages.blueprintQualityImageUrl || "/developing.webp",
      title: "Quality That Delivers Results Into Success",
      description:
        "At Expresso, we don’t just promise quality; we deliver impact. We understand that success in digital marketing isn’t about vanity metrics — it’s about the numbers that matter: conversions, engagement, sales, and ROI. With a sharp focus on outcomes, we ensure that every campaign, every strategy, and every execution is designed to meet your goals. Excellence isn’t a goal; it’s a commitment we make to every client, with every project.",
    },
  ];

  return (
    <div>
      <AuroraHero
        heading="Who We Are"
        subtitle="Turning Ideas Into Digital Impact"
        description="At Expresso Digital, we don’t just market brands — we engineer digital growth. From strategy to storytelling, performance to platforms, we build campaigns that capture attention, convert audiences, and create momentum."
        backgroundImageUrl={aboutImages.heroImageUrl || "/81.webp"}
      />

      <AboutUsSection imageUrl={aboutImages.teamPhotoUrl} />
      <div id="approach">
        <CountUpStats
          stats={ABOUT_STATS}
          heading={{
            eyebrow: "OUR IMPACT",
            textBefore: "Built on telecom heritage,",
            highlight: "focused on digital growth",
          }}
          subtitle="A snapshot of the reach, capability, and delivery mindset behind Expresso Digital."
        />
      </div>
      <AboutWebSection
        backgroundImageUrl={aboutImages.missionImageUrl}
        deviceImageUrl={aboutImages.missionDeviceImageUrl}
      />

      <section id="process" className="bg-white px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            highlight="UX Strategy"
            title="+ Modern Design Blueprint"
            description="We map the user journey, structure your content, and design screens that feel premium and easy to navigate—so visitors find what they need and take action faster."
          />

          <WebDevelopmentProcess cards={cardData} />
        </div>
      </section>

      <DisappearingFeatures
        teamImages={{
          mohamed: aboutImages.teamMohamedImageUrl,
          hassan: aboutImages.teamHassanImageUrl,
          swekshya: aboutImages.teamSwekshyaImageUrl,
          afrid: aboutImages.teamAfridImageUrl,
          nazim: aboutImages.teamNazimImageUrl,
          saad: aboutImages.teamSaadImageUrl,
          yasir: aboutImages.teamYasirImageUrl,
        }}
      />
      <DrawCircleText />
    </div>
  );
}

export default AboutUsPage;
