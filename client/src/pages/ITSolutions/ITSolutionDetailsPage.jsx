import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { FiPackage } from "react-icons/fi";
import AuroraHero from "../../components/BannerSection/bannerSection";
import SolutionDetailRenderer from "../../components/SolutionDetailRenderer/SolutionDetailRenderer";
import SolutionDetailCTA from "../../components/SolutionDetailCTA/SolutionDetailCTA";
import { BRAND, BRAND_BG, ICON_META } from "../../data/technologyConstants";
import { CUSTOM_SOLUTION_PAGES } from "../DigitalSolutions/customPages";

const API = process.env.REACT_APP_API_URL || "/api";

// Shared detail page for CMS Solution records. `section` says which part of
// the site is rendering it: Technology Solutions (/it-solutions/:slug) or
// Digital Solutions (/digital-solutions/:slug). A record opened under the
// wrong section redirects to its canonical URL, so old links keep working.
const SECTIONS = {
  technology: {
    label: "Technology Solution",
    listPath: "/it-solutions",
    backLabel: "Back to Technology Solutions",
  },
  digital: {
    label: "Digital Solution",
    listPath: "/digital-solutions",
    backLabel: "Back to Digital Solutions",
  },
};

export default function ITSolutionDetailsPage({ section = "technology" }) {
  const cfg = SECTIONS[section] || SECTIONS.technology;
  const { slug } = useParams();
  const navigate = useNavigate();
  const [solution, setSolution] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    setNotFound(false);
    setSolution(null);
    fetch(`${API}/web-content/solutions/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.ok && d.item) setSolution(d.item);
        else setNotFound(true);
      })
      .catch(() => { if (alive) setNotFound(true); });
    return () => { alive = false; };
  }, [slug]);

  if (notFound) {
    return (
      <>
        <AuroraHero
          heading={cfg.label}
          subtitle="Solution Not Found"
          description="The solution you are looking for could not be found."
          useImageOverrides={false}
        />
        <section className="py-20">
          <div className="mx-auto w-[min(900px,92vw)] text-center">
            <button
              onClick={() => navigate(cfg.listPath)}
              className="rounded-2xl bg-lotus-600 px-6 py-3 text-sm font-bold text-white"
            >
              {cfg.backLabel}
            </button>
          </div>
        </section>
      </>
    );
  }

  if (!solution) {
    return (
      <AuroraHero
        heading={cfg.label}
        subtitle="Loading…"
        description=""
        useImageOverrides={false}
      />
    );
  }

  const isDigital = solution.kind === "digital";
  if (section === "technology" && isDigital) {
    return <Navigate to={`/digital-solutions/${solution.slug}`} replace />;
  }
  if (section === "digital" && !isDigital) {
    return <Navigate to={`/it-solutions/${solution.slug}`} replace />;
  }
  const Custom = isDigital ? CUSTOM_SOLUTION_PAGES[solution.customPage] : null;
  if (Custom) return <Custom solution={solution} />;

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
