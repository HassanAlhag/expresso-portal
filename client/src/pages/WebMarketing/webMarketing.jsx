import AboutUsSectionForAd from "../../components/About-Us-Section/aboutUsSectionGoogle";
import LandingHeroSection from "../../components/LandingHero/LandingHero";
import RecentWork from "../../components/RecentWorks/RecentWorks";
import { CountUpStats } from "../../components/StatsSection/statsSection";
import Testimonials from "../../components/Testimonials/Testimonials";
import UniqueServices from "../../components/UniqueServices/UniqueServices";
import OurWebServices from "../../components/WebServices/WebServices";
import WhyChooseUs from "../../components/WhyChooseUs/WhyChooseUs";
import WorkflowSection from "../../components/WorkFlowSection/WorkFlowSection";
import {
  FaHeadphonesAlt,
  FaLightbulb,
  FaProjectDiagram,
  FaServer,
} from "react-icons/fa";

// ─── Stats ────────────────────────────────────────────────────────────────────

const webDevStats = [
  {
    num: 98,
    suffix: "%",
    subheading: "Frontend performance score with optimized modern builds",
  },
  {
    num: 250,
    suffix: "+",
    subheading: "Automated checks & QA steps built into delivery",
  },
  {
    num: 3.5,
    decimals: 1,
    suffix: "x",
    subheading: "Faster load speed after performance improvements",
  },
  {
    num: 120,
    suffix: "+",
    subheading: "Reusable UI components for scalable growth",
  },
  {
    num: 14,
    suffix: "+",
    subheading: "Days average turnaround for a conversion-ready landing page",
  },
  {
    num: 35,
    suffix: "%",
    subheading: "Avg. lead conversion lift after UX + copy refinements",
  },
];

// ─── Unique services ──────────────────────────────────────────────────────────

const BRAND = "#838FC6";

const WEB_UNIQUE_SERVICES = [
  {
    icon: (
      <FaProjectDiagram className="text-[22px]" style={{ color: BRAND }} />
    ),
    title: "Creative Concepts",
    desc: "Campaign ideas, landing page structure, and messaging that aligns with your offer—and makes people click.",
  },
  {
    icon: (
      <FaHeadphonesAlt className="text-[22px]" style={{ color: BRAND }} />
    ),
    title: "Expert Support",
    desc: "Clear communication, fast response, and weekly updates so you always know what's next and what's done.",
  },
  {
    icon: <FaLightbulb className="text-[22px]" style={{ color: BRAND }} />,
    title: "Conversion Thinking",
    desc: "We design with intent: strong hierarchy, clean CTAs, and UX decisions that turn visitors into leads.",
  },
  {
    icon: <FaServer className="text-[22px]" style={{ color: BRAND }} />,
    title: "Scalable Delivery",
    desc: "Modern components, performance-first builds, and a setup that's easy to expand as you grow.",
  },
];

const WEB_VIDEO_URL = "https://www.youtube.com/embed/lcMh9DDOlrY?autoplay=1";

// ─── Page ─────────────────────────────────────────────────────────────────────

function WebMarketing() {
  return (
    <div className="bg-white">
      {/* HERO contains the lead form target id="lead-form" */}
      <LandingHeroSection />

      {/* Trust + about (CTA scrolls back to hero form) */}
      <AboutUsSectionForAd />

      <CountUpStats
        heading={{
          textBefore: "Achive More With",
          highlight: "Hight-Performance Web Expertiences",
          textAfter: "That Convert",
        }}
        stats={webDevStats}
      />

      <OurWebServices />
      <WhyChooseUs />
      <RecentWork />
      <WorkflowSection />
      <UniqueServices services={WEB_UNIQUE_SERVICES} videoUrl={WEB_VIDEO_URL} />
      <Testimonials />

      {/* Sticky bottom CTA for mobile */}
      <div className="fixed bottom-4 left-1/2 z-[60] w-[min(560px,92vw)] -translate-x-1/2 md:hidden">
        <button
          type="button"
          onClick={() =>
            document.getElementById("lead-form")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white/95 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur"
        >
          <span className="text-sm font-semibold text-neutral-900">
            Get a free consultation
          </span>
          <span className="rounded-xl bg-[#838FC6] px-3 py-2 text-xs font-bold text-white">
            Open Form
          </span>
        </button>
      </div>
    </div>
  );
}

export default WebMarketing;
