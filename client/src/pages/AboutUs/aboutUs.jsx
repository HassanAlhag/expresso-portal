import React from "react";
import AuroraHero from "../../components/BannerSection/bannerSection";
import AboutUsSection from "../../components/AboutUsSection/aboutUsSection";
import { CountUpStats } from "../../components/StatsSection/statsSection";
import AboutWebSection from "../../components/AboutWebSection/aboutWebSection";
import WebDevelopmentProcess from "../../components/WebDevolopmentProcess/webDevelopmentProcess";
import { DrawCircleText } from "../../components/CircleText/circleText";
import SectionHeader from "../../components/SectionHeader/SectionHeader";
import { DisappearingFeatures } from "../../components/CaseStudySection/caseStudySection";

const cardData = [
  {
    image: "/professional.webp",
    title: "Putting Customers at the Center of Everything We Do",
    description:
      "Every business starts with its customers. That’s why our strategies are customized to fit your audience’s needs. By crafting campaigns that speak directly to your target market, we ensure personalized engagement at every touchpoint. The result? Stronger relationships, higher conversions, and a growth trajectory that aligns with your business goals. With us, your success is not just a plan — it’s a partnership.",
  },
  {
    image: "/designer.webp",
    title: "Innovative Strategies for the Modern Digital World",
    description:
      "Staying ahead of the digital curve is key to long-term growth. At Expresso, we use cutting-edge digital marketing tactics to propel your business forward. Whether it’s paid ads, social media campaigns, or conversion rate optimization, we continuously push boundaries to create innovative solutions that set your business apart. Our focus is always on delivering results that help you grow faster, smarter, and more sustainably.",
  },
  {
    image: "/developing.webp",
    title: "Quality That Delivers Results Into Success",
    description:
      "At Expresso, we don’t just promise quality; we deliver impact. We understand that success in digital marketing isn’t about vanity metrics — it’s about the numbers that matter: conversions, engagement, sales, and ROI. With a sharp focus on outcomes, we ensure that every campaign, every strategy, and every execution is designed to meet your goals. Excellence isn’t a goal; it’s a commitment we make to every client, with every project.",
  },
];

function AboutUsPage() {
  return (
    <div>
      <AuroraHero
        heading="Who We Are"
        subtitle="Turning Ideas Into Digital Impact"
        description="At Expresso Digital, we don’t just market brands — we engineer digital growth. From strategy to storytelling, performance to platforms, we build campaigns that capture attention, convert audiences, and create momentum."
      />

      <AboutUsSection />
      <CountUpStats />
      <AboutWebSection />

      <section className="bg-white px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            highlight="UX Strategy"
            title="+ Modern Design Blueprint"
            description="We map the user journey, structure your content, and design screens that feel premium and easy to navigate—so visitors find what they need and take action faster."
          />

          <WebDevelopmentProcess cards={cardData} />
        </div>
      </section>

      <DisappearingFeatures />
      <DrawCircleText />
    </div>
  );
}

export default AboutUsPage;
