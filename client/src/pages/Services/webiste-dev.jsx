import React from "react";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import BasicFAQ from "../../components/ServicesComponents/faq";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage, resolveWebsiteImages } from "../../utils/websiteImages";

const BRAND = "#7F8AD1";

function WebsiteDevelopmentPage() {
  const settings = useSiteSettings();
  const descriptions = [
    "We build fast, responsive websites and apps that look premium and perform even better — tailored to your business goals.",
    "From strategy to launch, we handle everything (design, development, testing, deployment) so you can focus on growth while we deliver an experience your customers trust.",
  ];

  const steps = [
    {
      id: 1,
      callout: "Planning",
      title: "Defining Goals and Structure",
      description:
        "We align on objectives, audience, sitemap, pages, features, integrations, and the right tech stack — so everything is built with purpose from day one.",
      image: "/web2.png",
    },
    {
      id: 2,
      callout: "Design",
      title: "Creating a Visual Concept",
      description:
        "We craft a clean UI/UX direction (layout, colors, typography) with clear feedback rounds until it matches your brand perfectly.",
      image: "/web5.png",
    },
    {
      id: 3,
      callout: "Development",
      title: "Building the Website",
      description:
        "We develop with modern frameworks, integrate tools (payments, CRM, analytics), and optimize for performance, SEO, and accessibility.",
      image: "/web1.png",
    },
    {
      id: 4,
      callout: "Testing",
      title: "Ensuring Quality",
      description:
        "We test performance, responsiveness, forms, UX and security — ensuring everything works smoothly across devices.",
      image: "/web3.png",
    },
    {
      id: 5,
      callout: "Launch",
      title: "Going Live",
      description:
        "We deploy to production, configure hosting/SSL, and validate everything end-to-end before launch day.",
      image: "/web4.png",
    },
    {
      id: 6,
      callout: "Maintenance",
      title: "Support & Growth",
      description:
        "We monitor, update, and improve over time — keeping your site secure, stable, and ready to scale.",
      image: "/web7.png",
    },
  ];

  const faqQuestions = [
    {
      title: "Will my website be mobile-friendly?",
      content:
        "Absolutely. Everything we build is fully responsive across mobile, tablet, and desktop devices.",
      defaultOpen: true,
    },
    {
      title: "What technologies do you use?",
      content:
        "Based on your needs: React, Node.js, WordPress, Shopify, and other modern frameworks — we choose what fits your business.",
    },
    {
      title: "How long does it take to build a website?",
      content:
        "Basic websites typically take 2–3 weeks. Larger projects usually take 6–8 weeks depending on scope and integrations.",
    },
    {
      title: "Can I update the website myself after it's built?",
      content:
        "Yes. We can integrate a CMS (like Strapi) so you can update content easily without coding.",
    },
    {
      title: "Do you provide website maintenance services?",
      content:
        "Yes — we offer support plans for updates, fixes, monitoring, performance, and security.",
    },
    {
      title: "Will my website be SEO-friendly?",
      content:
        "Yes. We implement best practices (speed, structure, metadata) and can add advanced SEO services if needed.",
    },
    {
      title: "Can you help with domain and hosting setup?",
      content:
        "Absolutely — we can support domain, hosting setup, SSL, and production deployment.",
    },
  ];
  const resolvedSteps = resolveWebsiteImages(settings, steps);
  const editorialImage = resolveWebsiteImage(settings, "/web6.png");

  return (
    <div className="bg-white">
      {/* HERO (keep your existing banner) */}
      <ServiceBanner
        heading="🌐 Website & App Development – Digital That Delivers"
        subHeading="Your website isn’t just your digital home — it’s your best salesperson."
        backgroundImage="/web8.jpg"
        ctaText="Get Started"
        ctaLink="/contact-us"
        badgeText="EXPRESSO"
        badgeLink="/contact-us"
      />

      {/* EDITORIAL SECTION */}
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
            {/* image */}
            <div className="md:col-span-6">
              <div className="relative overflow-hidden rounded-[30px] border border-black/10 bg-neutral-100 shadow-[0_30px_100px_rgba(0,0,0,0.10)]">
                <img
                  src={editorialImage}
                  alt="Website development"
                  className="h-[380px] w-full object-cover md:h-[460px]"
                  draggable={false}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div
                  className="absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl"
                  style={{ backgroundColor: BRAND, opacity: 0.18 }}
                />
              </div>
            </div>

            {/* text */}
            <div className="md:col-span-6">
              <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500">
                WEBSITE DEVELOPMENT
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 md:text-5xl">
                Built to impress —
                <span style={{ color: BRAND }}> engineered to convert.</span>
              </h2>

              <div className="mt-5 space-y-4 text-base leading-relaxed text-neutral-700 md:text-lg">
                {descriptions.map((t, i) => (
                  <p key={i}>{t}</p>
                ))}
              </div>

              {/* little elegant chips */}
              <div className="mt-7 flex flex-wrap gap-2">
                <Chip>Performance-first</Chip>
                <Chip>Responsive UI</Chip>
                <Chip>SEO-ready</Chip>
                <Chip>CMS optional</Chip>
              </div>

              <a
                href="/contact-us"
                className="mt-8 inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ backgroundColor: BRAND }}
              >
                Request a Proposal
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS TIMELINE (Elegant + creative) */}
      <section className="bg-white">
        <div className="mx-auto w-[min(1150px,92vw)] py-12 md:py-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500">
                PROCESS
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-950 md:text-5xl">
                Your journey from idea to launch
                <span style={{ color: BRAND }}>.</span>
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-12">
            {/* left timeline */}
            <div className="md:col-span-7">
              <div className="relative pl-6">
                <div
                  className="absolute left-2 top-0 h-full w-px"
                  style={{ backgroundColor: `${BRAND}55` }}
                />
                <div className="space-y-8">
                  {resolvedSteps.map((s, idx) => (
                    <div key={s.id} className="relative">
                      <div
                        className="absolute -left-[6px] top-1 h-4 w-4 rounded-full"
                        style={{ backgroundColor: BRAND }}
                      />
                      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold tracking-[0.20em] text-neutral-500">
                            {String(idx + 1).padStart(2, "0")} •{" "}
                            {s.callout.toUpperCase()}
                          </p>
                          <span
                            className="h-2 w-12 rounded-full"
                            style={{ backgroundColor: `${BRAND}66` }}
                          />
                        </div>

                        <h3 className="mt-3 text-2xl font-black text-neutral-950 md:text-3xl">
                          {s.title}
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
                          {s.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* right preview stack */}
            <div className="md:col-span-5">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-3xl border border-black/10 bg-neutral-950 p-6 text-white shadow-[0_22px_80px_rgba(0,0,0,0.16)]">
                  <h3 className="text-2xl font-black md:text-3xl">
                    What you get
                    <span style={{ color: BRAND }}>.</span>
                  </h3>
                  <ul className="mt-4 space-y-3 text-white/85">
                    <li>• Modern UI/UX + strong brand alignment</li>
                    <li>• Fast load speed & clean structure</li>
                    <li>• SEO-friendly pages and best practices</li>
                    <li>• Optional CMS setup (Strapi)</li>
                  </ul>

                  <a
                    href="/contact-us"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:brightness-105"
                  >
                    Talk to us
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {resolvedSteps.slice(0, 4).map((s) => (
                    <div
                      key={s.id}
                      className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.06)]"
                    >
                      <img
                        src={s.image}
                        alt={s.callout}
                        className="h-28 w-full object-cover"
                        draggable={false}
                        loading="lazy"
                      />
                      <div className="p-3">
                        <p className="text-sm font-semibold text-neutral-900">
                          {s.callout}
                        </p>
                        <div
                          className="mt-2 h-1 w-10 rounded-full"
                          style={{ backgroundColor: BRAND }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ (fixed: light card on dark background) */}
      <section className="bg-neutral-950">
        <div className="mx-auto w-[min(1150px,92vw)] py-12 md:py-16">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white md:text-5xl">
              FAQ<span style={{ color: BRAND }}>.</span>
            </h2>
            <p className="mt-3 text-base text-white/70 md:text-lg">
              Quick answers before we build something great.
            </p>
          </div>

          <div className="mt-10 mx-auto max-w-4xl">
            <div className="rounded-[30px] bg-white p-6 shadow-[0_35px_120px_rgba(0,0,0,0.35)] md:p-10">
              <BasicFAQ
                heading="Website Development FAQs"
                questions={faqQuestions}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const Chip = ({ children }) => (
  <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
    {children}
  </span>
);

export default WebsiteDevelopmentPage;
