import { useEffect, useState } from "react";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";
import {
  FaHeadphonesAlt,
  FaLightbulb,
  FaProjectDiagram,
  FaServer,
} from "react-icons/fa";

const BRAND = "#838FC6";

const DEFAULT_SERVICES = [
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

const DEFAULT_VIDEO_URL = "https://www.youtube.com/embed/lcMh9DDOlrY?autoplay=1";

const UniqueServices = ({
  services = DEFAULT_SERVICES,
  videoUrl = DEFAULT_VIDEO_URL,
  sectionEyebrow = "VALUE",
  sectionHeading = "HOW WE\nADD VALUE",
  sectionDescription = "A premium delivery experience—designed to reduce friction, improve clarity, and drive results.",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const settings = useSiteSettings();
  const videoPoster = resolveWebsiteImage(settings, "/youtube.jpg");

  const handleGetQuote = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="relative bg-neutral-50 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-neutral-200 pb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500">
              {sectionEyebrow}
            </p>
            <h2 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-neutral-950 whitespace-pre-line">
              {sectionHeading}
            </h2>
          </div>

          <p className="text-neutral-600 max-w-md mt-6 md:mt-0 text-sm leading-relaxed">
            {sectionDescription}
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left - Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {services.map((service, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(0,0,0,0.10)]"
              >
                {/* soft brand glow */}
                <div
                  className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl opacity-0 transition duration-500 group-hover:opacity-30"
                  style={{ background: BRAND }}
                />

                <div className="relative flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(131,143,198,0.18), rgba(131,143,198,0.04))",
                    }}
                  >
                    {service.icon}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-neutral-950">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                      {service.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-6 h-px w-full bg-neutral-200/70" />
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500">
                    Expresso Digital
                  </span>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: BRAND }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Right - Video card */}
          <div className="lg:col-span-5">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsOpen(true)}
              onKeyDown={(e) => e.key === "Enter" && setIsOpen(true)}
              className="group relative h-full min-h-[360px] overflow-hidden rounded-3xl border border-neutral-200 bg-black shadow-[0_18px_55px_rgba(0,0,0,0.10)] cursor-pointer"
            >
              <img
                src={videoPoster}
                alt="See our process"
                className="h-full w-full object-cover opacity-95 transition duration-500 group-hover:scale-[1.03]"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Label */}
              <div className="absolute top-5 left-5 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                Watch how we deliver
                <div
                  className="mt-2 h-1 w-14 rounded-full"
                  style={{ backgroundColor: BRAND, opacity: 0.9 }}
                />
              </div>

              {/* Play button */}
              <div className="absolute inset-0 grid place-items-center">
                <div
                  className="grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-white/10 text-white text-2xl backdrop-blur transition group-hover:scale-105"
                  style={{
                    boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
                  }}
                  aria-hidden="true"
                >
                  ▶
                </div>
              </div>

              {/* Bottom CTA row */}
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-white">
                    A smoother journey. Better results.
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    Click to open video (Esc to close)
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGetQuote();
                  }}
                  className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-xs font-extrabold text-white transition hover:brightness-110"
                  style={{ backgroundColor: BRAND }}
                >
                  Get Quote →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-[92vw] max-w-4xl aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              className="w-full h-full"
              src={videoUrl}
              title="Expresso Digital"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            <button
              className="absolute top-4 right-4 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur hover:bg-white/15 transition"
              onClick={() => setIsOpen(false)}
            >
              Close (Esc)
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default UniqueServices;
