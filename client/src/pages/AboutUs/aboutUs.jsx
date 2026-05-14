import React from "react";
import { AiFillSchedule } from "react-icons/ai";
import { SiAdguard } from "react-icons/si";
import { BsCloudCheckFill } from "react-icons/bs";
import AuroraHero from "../../components/BannerSection/bannerSection";
import AboutUsSection from "../../components/AboutUsSection/aboutUsSection";
import { CountUpStats } from "../../components/StatsSection/statsSection";
import AboutWebSection from "../../components/AboutWebSection/aboutWebSection";
import WebDevelopmentProcess from "../../components/WebDevolopmentProcess/webDevelopmentProcess";
import { DrawCircleText } from "../../components/CircleText/circleText";
import SectionHeader from "../../components/SectionHeader/SectionHeader";
import { DisappearingFeatures } from "../../components/CaseStudySection/caseStudySection";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";

// ─── Stats ────────────────────────────────────────────────────────────────────

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

// ─── About section content ────────────────────────────────────────────────────

const ABOUT_PARAGRAPHS = [
  "Expresso Digital Agency is a dynamic extension of Expresso Telecom Group (UAE / DIFC) bringing cutting-edge digital solutions to businesses across the Middle East & Africa—rooted in innovation and backed by a legacy of telecom excellence.",
  "We bridge the gap between creativity and technology to help brands thrive in the digital era.",
  "Operating from our regional hubs — the Expresso Telecom head office in Dubai Financial Center and our Digital Agency office in Al Garhoud — we are committed to delivering full-spectrum digital marketing services tailored to the unique needs of each market.",
];

const ABOUT_TAGS = [
  "UAE / DIFC presence",
  "Middle East & Africa",
  "Telecom-backed legacy",
  "Full-spectrum digital",
];

const ABOUT_FEATURES = [
  {
    icon: <AiFillSchedule size={22} />,
    title: "Empowering Growth",
    desc: "We build strategies that scale with your business — not just short-term wins.",
  },
  {
    icon: <BsCloudCheckFill size={22} />,
    title: "Customer-Centric",
    desc: "Clear communication, fast execution, and outcomes aligned with your goals.",
  },
  {
    icon: <SiAdguard size={22} />,
    title: "Excellence Always",
    desc: "Quality control at every step — design, content, campaigns, and delivery.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function AboutUsPage() {
  const settings = useSiteSettings();
  const aboutImages = settings?.about || {};

  const blueprintCards = [
    {
      image:
        aboutImages.blueprintCustomerImageUrl ||
        resolveWebsiteImage(settings, "/professional.webp"),
      title: "Putting Customers at the Center of Everything We Do",
      description:
        "Every business starts with its customers. That's why our strategies are customized to fit your audience's needs. By crafting campaigns that speak directly to your target market, we ensure personalized engagement at every touchpoint. The result? Stronger relationships, higher conversions, and a growth trajectory that aligns with your business goals. With us, your success is not just a plan — it's a partnership.",
    },
    {
      image:
        aboutImages.blueprintInnovationImageUrl ||
        resolveWebsiteImage(settings, "/designer.webp"),
      title: "Innovative Strategies for the Modern Digital World",
      description:
        "Staying ahead of the digital curve is key to long-term growth. At Expresso, we use cutting-edge digital marketing tactics to propel your business forward. Whether it's paid ads, social media campaigns, or conversion rate optimization, we continuously push boundaries to create innovative solutions that set your business apart. Our focus is always on delivering results that help you grow faster, smarter, and more sustainably.",
    },
    {
      image:
        aboutImages.blueprintQualityImageUrl ||
        resolveWebsiteImage(settings, "/developing.webp"),
      title: "Quality That Delivers Results Into Success",
      description:
        "At Expresso, we don't just promise quality; we deliver impact. We understand that success in digital marketing isn't about vanity metrics — it's about the numbers that matter: conversions, engagement, sales, and ROI. With a sharp focus on outcomes, we ensure that every campaign, every strategy, and every execution is designed to meet your goals. Excellence isn't a goal; it's a commitment we make to every client, with every project.",
    },
  ];

  const teamMembers = [
    {
      key: "mohamed",
      image: aboutImages.teamMohamedImageUrl || "/manager.webp",
      name: "Mohamed Bashir",
      position: "Head of Business Development",
      description:
        "Driving partnerships and uncovering growth opportunities to expand business reach and impact.",
      socialMedia: {
        linkedin: "https://www.linkedin.com/in/mohamed-bashir-b8105928/",
      },
    },
    {
      key: "hassan",
      image: aboutImages.teamHassanImageUrl || "/hassan.webp",
      name: "Hassan (Elhag) Omer Ahmed Omer",
      position: "Digital & Social Media Analyst",
      description:
        "Turning digital data into actionable insights to optimize brand performance across platforms.",
      socialMedia: {
        linkedin: "https://www.linkedin.com/in/hassanalhag/",
      },
    },
    {
      key: "swekshya",
      image: aboutImages.teamSwekshyaImageUrl || "/swekshya.webp",
      name: "Swekshya Basnet",
      position: "HR & Finance",
      description:
        "Ensuring financial health through smart planning, risk management, and strategic investments.",
      socialMedia: {
        linkedin: "https://www.linkedin.com/in/swekshya-basnet-a10444158/",
      },
    },
    {
      key: "afrid",
      image: aboutImages.teamAfridImageUrl || "/11.webp",
      name: "Afrid Ahamed",
      position: "Social Media Stratergist",
      description:
        "Designing actionable strategies that align business goals with market trends and user needs.",
      socialMedia: {
        linkedin: "https://www.linkedin.com/in/-afrid-ahamed/",
      },
    },
    {
      key: "nazim",
      image: aboutImages.teamNazimImageUrl || "/gal2.webp",
      name: "Mohammed Nazim",
      position: "Marketing Advisor",
      description:
        "Shaping impactful marketing strategies that build strong brand presence and engagement.",
      socialMedia: {
        linkedin: "www.linkedin.com/in/nazimrasheed",
      },
    },
    {
      key: "saad",
      image: aboutImages.teamSaadImageUrl || "/saad.webp",
      name: "Saad",
      position: "SEO Specialist",
      description:
        "Crafting marketing campaigns that connect brands with their audience authentically.",
      socialMedia: {
        linkedin: "https://www.linkedin.com/in/saadsalman37/",
      },
    },
    {
      key: "yasir",
      image: aboutImages.teamYasirImageUrl || "/10.webp",
      name: "Muhammed Yasir",
      position: "Web Developer",
      description:
        "Building high-performing web solutions with clean architecture, seamless UI, and optimal speed.",
      socialMedia: {
        linkedin: "https://www.linkedin.com/in/muhammed-yasir-m-115943215/",
      },
    },
  ];

  return (
    <div>
      <AuroraHero
        heading="Who We Are"
        subtitle="Turning Ideas Into Digital Impact"
        description="At Expresso Digital, we don't just market brands — we engineer digital growth. From strategy to storytelling, performance to platforms, we build campaigns that capture attention, convert audiences, and create momentum."
        backgroundImageUrl={
          aboutImages.heroImageUrl || resolveWebsiteImage(settings, "/81.webp")
        }
      />

      <AboutUsSection
        imageUrl={aboutImages.teamPhotoUrl || "/about.webp"}
        subheading="About Expresso"
        heading="Our Story — Expresso Digital Agency"
        paragraphs={ABOUT_PARAGRAPHS}
        tags={ABOUT_TAGS}
        features={ABOUT_FEATURES}
        bottomCaption="Strategy + Creative + Performance — under one roof."
      />

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
          <WebDevelopmentProcess cards={blueprintCards} />
        </div>
      </section>

      <DisappearingFeatures members={teamMembers} />

      <DrawCircleText />
    </div>
  );
}

export default AboutUsPage;
