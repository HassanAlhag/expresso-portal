import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import WebDevelopmentSolutions from "../../components/ServicesComponents/webSolution";
import WebSteps from "../../components/ServicesComponents/webSteps";
import BasicFAQ from "../../components/ServicesComponents/faq";
import BrandedServiceDetail, { BrandedServiceLoading, BRANDED_SERVICE_SLUGS } from "./BrandedServiceDetail";

const BRAND = "#8390C8";
// Service pages restyled to the approved Expresso brand reference layout
// (web-dev, seo-marketing — approved one at a time); every other slug keeps
// the existing rendering below.
const BRANDED_REFERENCE_SLUGS = new Set(BRANDED_SERVICE_SLUGS);
const API = process.env.REACT_APP_API_URL || "/api";

// ─── Block renderers ──────────────────────────────────────────────────────────

function Chip({ children }) {
  return (
    <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
      {children}
    </span>
  );
}

function IntroBlock({ block }) {
  return (
    <section className="relative">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(900px circle at 15% 10%, ${BRAND}18, transparent 58%),
                       radial-gradient(900px circle at 85% 40%, ${BRAND}12, transparent 60%)`,
        }}
      />
      <div className="relative mx-auto w-[min(1150px,92vw)] py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-12 md:items-center">
          {block.imageUrl && (
            <div className="md:col-span-6">
              <div className="relative overflow-hidden rounded-[30px] border border-black/10 bg-neutral-100 shadow-[0_30px_100px_rgba(0,0,0,0.10)]">
                <img
                  src={block.imageUrl}
                  alt=""
                  className="h-[380px] w-full object-cover md:h-[460px]"
                  draggable={false}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            </div>
          )}
          <div className={block.imageUrl ? "md:col-span-6" : "md:col-span-12"}>
            {block.eyebrow && (
              <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500">{block.eyebrow}</p>
            )}
            {block.title && (
              <h2 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 md:text-5xl">
                {block.title}
                {block.highlight && (
                  <span style={{ color: BRAND }}> {block.highlight}</span>
                )}
              </h2>
            )}
            {(block.descriptions || []).length > 0 && (
              <div className="mt-5 space-y-4 text-base leading-relaxed text-neutral-700 md:text-lg">
                {(block.descriptions || []).map((t, i) => <p key={i}>{t}</p>)}
              </div>
            )}
            {(block.chips || []).length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2">
                {(block.chips || []).map((c, i) => <Chip key={i}>{c}</Chip>)}
              </div>
            )}
            {(block.ctaText || block.ctaLink) && (
              <a
                href={block.ctaLink || "/contact-us"}
                className="mt-8 inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ backgroundColor: BRAND }}
              >
                {block.ctaText || "Contact Us"}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function WebSolutionsBlock({ block }) {
  return (
    <WebDevelopmentSolutions
      image={block.imageUrl || ""}
      sectionBackgroundImage={block.sectionBgUrl || ""}
      heading={block.heading || ""}
      descriptions={block.descriptions || []}
      raw
    />
  );
}

function StepsBlock({ block }) {
  const features = (block.items || []).map((s, i) => ({
    id: s.id || i + 1,
    callout: s.callout || "",
    title: s.title || "",
    description: s.description || "",
    contentPosition: s.contentPosition || (i % 2 === 0 ? "r" : "l"),
    image: s.image || "",
  }));
  if (!features.length) return null;
  return <WebSteps features={features} />;
}

function ProcessBlock({ block }) {
  const steps = block.steps || [];
  if (!steps.length) return null;

  return (
    <section className="bg-white">
      <div className="mx-auto w-[min(1150px,92vw)] py-12 md:py-16">
        {(block.title || block.eyebrow) && (
          <div className="flex items-end justify-between gap-6">
            <div>
              {block.eyebrow && (
                <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500">{block.eyebrow}</p>
              )}
              {block.title && (
                <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-950 md:text-5xl">
                  {block.title}
                  <span style={{ color: BRAND }}>.</span>
                </h2>
              )}
            </div>
          </div>
        )}

        <div className="mt-10 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 h-full w-px" style={{ backgroundColor: `${BRAND}55` }} />
              <div className="space-y-8">
                {steps.map((s, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[6px] top-1 h-4 w-4 rounded-full" style={{ backgroundColor: BRAND }} />
                    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
                      <p className="text-xs font-semibold tracking-[0.20em] text-neutral-500">
                        {String(idx + 1).padStart(2, "0")} • {(s.callout || "").toUpperCase()}
                      </p>
                      {s.title && <h3 className="mt-3 text-2xl font-black text-neutral-950 md:text-3xl">{s.title}</h3>}
                      {s.description && <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">{s.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="sticky top-24">
              <div className="grid grid-cols-2 gap-3">
                {steps.slice(0, 4).filter((s) => s.image).map((s, i) => (
                  <div key={i} className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
                    <img src={s.image} alt={s.callout} className="h-28 w-full object-cover" loading="lazy" />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-neutral-900">{s.callout}</p>
                      <div className="mt-2 h-1 w-10 rounded-full" style={{ backgroundColor: BRAND }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqBlock({ block }) {
  const questions = (block.questions || [])
    .map((item) => {
      if (typeof item === "string") return { title: item, content: "" };
      if (!item || typeof item !== "object") return { title: "", content: "" };
      return {
        ...item,
        title: item.title || item.question || "",
        content: item.content || item.answer || "",
      };
    })
    .filter((item) => item.title || item.content);
  if (!questions.length) return null;
  return (
    <section className="bg-neutral-950">
      <div className="mx-auto w-[min(1150px,92vw)] py-12 md:py-16">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white md:text-5xl">
            {block.heading || "FAQ"}
            <span style={{ color: BRAND }}>.</span>
          </h2>
          {block.subtitle && (
            <p className="mt-3 text-base text-white/70 md:text-lg">{block.subtitle}</p>
          )}
        </div>
        <div className="mt-10 mx-auto max-w-4xl">
          <div className="rounded-[30px] bg-white p-6 shadow-[0_35px_120px_rgba(0,0,0,0.35)] md:p-10">
            <BasicFAQ heading={block.heading || "FAQ"} questions={questions} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceBlock({ block }) {
  switch (block.type) {
    case "intro":     return <IntroBlock block={block} />;
    case "webSolutions": return <WebSolutionsBlock block={block} />;
    case "steps":     return <StepsBlock block={block} />;
    case "process":   return <ProcessBlock block={block} />;
    case "faq":       return <FaqBlock block={block} />;
    default:          return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setNotFound(false);
    setService(null);
    fetch(`${API}/web-content/services/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.item) setService(d.item);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white py-24 text-center">
        <h1 className="text-3xl font-black text-neutral-900">Service Not Found</h1>
        <p className="text-neutral-500">The service you are looking for could not be found.</p>
        <button
          onClick={() => navigate("/services")}
          className="rounded-2xl bg-lotus-600 px-6 py-3 text-sm font-bold text-white"
        >
          Back to Services
        </button>
      </div>
    );
  }

  const branded = BRANDED_REFERENCE_SLUGS.has(slug);

  if (!service) {
    if (branded) return <BrandedServiceLoading />;
    return (
      <ServiceBanner
        heading="Loading…"
        subHeading=""
        backgroundImage=""
        ctaText=""
        ctaLink=""
        useImageOverrides={false}
      />
    );
  }

  if (branded) {
    return (
      <BrandedServiceDetail
        service={service}
        renderFallback={(block, idx) => <ServiceBlock key={idx} block={block} />}
      />
    );
  }

  return (
    <div className="bg-white">
      <ServiceBanner
        heading={service.heroHeading || service.title}
        subHeading={service.heroSubheading || service.description}
        backgroundImage={service.heroImageUrl || ""}
        ctaText={service.heroCtaText || "Get Started"}
        ctaLink={service.heroCtaLink || "/contact-us"}
        badgeText={service.tag || ""}
        badgeLink="/contact-us"
        useImageOverrides={false}
      />

      {(service.blocks || []).map((block, idx) => (
        <ServiceBlock key={idx} block={block} />
      ))}
    </div>
  );
}
