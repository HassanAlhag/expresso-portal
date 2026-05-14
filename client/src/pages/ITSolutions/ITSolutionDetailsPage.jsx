import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiPackage } from "react-icons/fi";
import AuroraHero from "../../components/BannerSection/bannerSection";
import SolutionDetailRenderer from "../../components/SolutionDetailRenderer/SolutionDetailRenderer";
import SolutionDetailCTA from "../../components/SolutionDetailCTA/SolutionDetailCTA";
import {
  BRAND,
  BRAND_BG,
  ICON_META,
  STATIC_SOLUTIONS,
} from "../../data/technologySolutionsData";
import { TECHNOLOGY_SOLUTION_DETAILS } from "../../data/technologySolutionDetailsData";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";

export default function ITSolutionDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const settings = useSiteSettings();

  const baseSolution = STATIC_SOLUTIONS.find((item) => item.slug === slug);
  const detail = TECHNOLOGY_SOLUTION_DETAILS[slug];
  const solution = detail && baseSolution ? { ...baseSolution, ...detail } : detail;

  if (!solution) {
    return (
      <>
        <AuroraHero
          heading="Technology Solution"
          subtitle="Solution Not Found"
          description="The technology solution you are looking for could not be found."
        />

        <section className="py-20">
          <div className="mx-auto w-[min(900px,92vw)] text-center">
            <button
              onClick={() => navigate("/it-solutions")}
              className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white"
            >
              Back to Technology Solutions
            </button>
          </div>
        </section>
      </>
    );
  }

  const meta = ICON_META[solution.icon] || {
    Icon: FiPackage,
    color: BRAND,
    bg: BRAND_BG,
  };

  const heroSettingKey = solution.heroSettingKey;
  const heroImageUrl = resolveWebsiteImage(
    settings,
    (heroSettingKey ? settings?.itSolutions?.[heroSettingKey] : "") ||
      solution.heroImageUrl ||
      "/81.webp"
  );

  return (
    <>
      <AuroraHero
        key={heroImageUrl}
        heading={solution.title}
        subtitle={solution.subtitle}
        description={solution.description}
        backgroundImageUrl={heroImageUrl}
      />

      <SolutionDetailRenderer
        blocks={solution.blocks}
        accentColor={meta.color}
        accentBg={meta.bg}
      />

      <SolutionDetailCTA solution={solution} />
    </>
  );
}
