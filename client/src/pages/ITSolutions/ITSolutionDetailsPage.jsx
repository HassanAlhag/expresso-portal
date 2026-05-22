import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiPackage } from "react-icons/fi";
import AuroraHero from "../../components/BannerSection/bannerSection";
import SolutionDetailRenderer from "../../components/SolutionDetailRenderer/SolutionDetailRenderer";
import SolutionDetailCTA from "../../components/SolutionDetailCTA/SolutionDetailCTA";
import { BRAND, BRAND_BG, ICON_META } from "../../data/technologyConstants";

const API = process.env.REACT_APP_API_URL || "/api";

export default function ITSolutionDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [solution, setSolution] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setNotFound(false);
    setSolution(null);
    fetch(`${API}/web-content/solutions/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.item) setSolution(d.item);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <>
        <AuroraHero
          heading="Technology Solution"
          subtitle="Solution Not Found"
          description="The technology solution you are looking for could not be found."
          useImageOverrides={false}
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

  if (!solution) {
    return (
      <AuroraHero
        heading="Technology Solution"
        subtitle="Loading…"
        description=""
        useImageOverrides={false}
      />
    );
  }

  const meta = ICON_META[solution.icon] || { Icon: FiPackage, color: BRAND, bg: BRAND_BG };

  const heroImageUrl = solution.heroImageUrl || "/81.webp";

  return (
    <>
      <AuroraHero
        key={heroImageUrl}
        heading={solution.title}
        subtitle={solution.subtitle}
        description={solution.description}
        backgroundImageUrl={heroImageUrl}
        useImageOverrides={false}
      />

      <SolutionDetailRenderer
        blocks={solution.blocks || []}
        accentColor={meta.color}
        accentBg={meta.bg}
      />

      <SolutionDetailCTA solution={solution} />
    </>
  );
}
