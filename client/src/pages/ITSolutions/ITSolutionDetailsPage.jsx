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
  const [error, setError] = useState(false);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setNotFound(false);
    setError(false);
    setSolution(null);
    fetch(`${API}/web-content/solutions/${slug}`)
      .then((r) => {
        if (r.status === 404) {
          if (alive) setNotFound(true);
          return undefined;
        }
        if (!r.ok) throw new Error(`Solution request failed: ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!alive || d === undefined) return;
        if (!d?.ok || !d.item?.slug) throw new Error("Invalid solution response");
        setSolution(d.item);
      })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [slug, requestKey]);

  if (error) {
    return (
      <>
        <AuroraHero
          heading={cfg.label}
          subtitle="Solution Unavailable"
          description="We couldn’t load this solution. Please try again."
          useImageOverrides={false}
        />
        <section className="py-20" role="alert" aria-label="Solution loading failed">
          <div className="mx-auto flex w-[min(900px,92vw)] flex-wrap justify-center gap-4">
            <button onClick={() => setRequestKey((key) => key + 1)} className="rounded-2xl bg-lotus-600 px-6 py-3 text-sm font-bold text-white">
              Try again
            </button>
            <button onClick={() => navigate(cfg.listPath)} className="rounded-2xl border border-lotus-200 px-6 py-3 text-sm font-bold text-lotus-700">
              {cfg.backLabel}
            </button>
          </div>
        </section>
      </>
    );
  }

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
