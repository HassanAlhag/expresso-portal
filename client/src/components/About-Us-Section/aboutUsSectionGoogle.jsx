import React from "react";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";

const BRAND = "#838FC6";

const AboutUsSectionForAd = () => {
  const settings = useSiteSettings();
  const image = resolveWebsiteImage(settings, "/aboutforppc.png");

  const scrollToLeadForm = () => {
    document
      .getElementById("lead-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const points = [
    "Performance-first builds (speed, SEO, mobile).",
    "Modern UI/UX crafted for conversions.",
    "Clean, scalable code for long-term growth.",
    "Clear timeline + weekly updates.",
    "Post-launch support & improvements.",
    "Conversion tracking + analytics setup (GA4, pixels, events).",
  ];

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto w-[min(1100px,92vw)]">
        {/* ✅ Make columns stretch so we can align bottoms */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:items-stretch">
          {/* Left */}
          <div className="md:col-span-6 flex flex-col">
            <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500">
              ABOUT EXPRESSO
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-neutral-950 md:text-4xl">
              A partner that builds{" "}
              <span style={{ color: BRAND }}>web experiences</span> that sell.
            </h2>

            {/* ✅ enhanced paragraph */}
            <p className="mt-4 text-base leading-relaxed text-neutral-600">
              We design and develop conversion-focused websites and landing
              pages that{" "}
              <span className="font-semibold text-neutral-900">
                look premium
              </span>
              ,{" "}
              <span className="font-semibold text-neutral-900">load fast</span>,
              and{" "}
              <span className="font-semibold text-neutral-900">
                turn visitors into leads
              </span>
              . From strategy and UX to clean development and launch, we build
              with one goal:{" "}
              <span className="font-semibold text-neutral-900">
                make your business easier to choose
              </span>
              .
            </p>

            <ul className="mt-6 space-y-3">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-neutral-700">
                  <span
                    className="mt-2 h-2 w-2 rounded-full"
                    style={{ backgroundColor: BRAND }}
                  />
                  <span className="text-sm md:text-base">{p}</span>
                </li>
              ))}
            </ul>

            {/* ✅ Push chips to the bottom so they align with image bottom */}
            <div className="mt-auto pt-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-700">
                  UAE + Global Clients
                </span>
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-700">
                  Modern React / Next.js
                </span>
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-700">
                  Fast Delivery
                </span>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="md:col-span-6">
            <div className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-100 shadow-[0_18px_55px_rgba(0,0,0,0.10)]">
              <img
                src={image}
                alt="About Expresso"
                className="h-[420px] w-full object-cover md:h-[520px]"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

              {/* ✅ Label + CTA inside the image */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                <div className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold text-white backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate">
                      Conversion-driven design • Fast delivery
                    </span>

                    {/* ✅ CTA button on the picture */}
                    <button
                      type="button"
                      onClick={scrollToLeadForm}
                      className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-neutral-950 transition hover:brightness-95"
                      aria-label="Get my proposal"
                    >
                      Get proposal →
                    </button>
                  </div>

                  <div
                    className="mt-2 h-1 w-14 rounded-full"
                    style={{ backgroundColor: BRAND, opacity: 0.9 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional: if you still want a CTA under text on mobile only */}
        <div className="mt-8 md:hidden">
          <button
            onClick={scrollToLeadForm}
            className="w-full rounded-2xl bg-neutral-950 px-6 py-3 text-sm font-extrabold text-white transition hover:brightness-110"
          >
            Get my proposal →
          </button>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSectionForAd;
