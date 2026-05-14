import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import HomeSection from "../HomeSection/HomeSection";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage, resolveWebsiteImages } from "../../utils/websiteImages";

const BRAND = "#7F8AD1";

const DEFAULT_TESTIMONIALS = [
  {
    img: "/godfel-logo.png",
    description:
      "Working with Expresso transformed our marketing efforts. Their innovative strategies and expert execution drove significant growth for our brand. Highly recommended!",
    name: "Felix Afram",
    title: "General Manager, Godfel Group",
  },
  {
    img: "/pat-logo.png",
    description:
      "The team at Expresso truly understands the digital landscape. Their user-focused approach helped us enhance our customer experience, making a lasting impact on our platform.",
    name: "Omar Gomma",
    title: "UX Research, Profit Assurance",
  },
  {
    img: "/floraison-logo.png",
    description:
      "Expresso’s creativity and technical expertise are unmatched. They delivered a tailored solution that exceeded our expectations and drove measurable results.",
    name: "Dr. Anita George",
    title: "GP & Cosmetic Dentist",
  },
  {
    img: "/mih-logo.png",
    description:
      "Expresso is a game-changer! Their data-driven insights and marketing strategies helped us reach a wider audience and achieve our business goals.",
    name: "Dr. Yasir Ali Pullat",
    title: "Senior Dentist, Mih Dental",
  },
  {
    img: "/alb-logo.png",
    description:
      "A top-notch team at Expresso combines professionalism with creativity. They delivered an exceptional solution that aligned perfectly with our objectives.",
    name: "Daniel Henderson",
    title: "Engineering Manager, Alb Filter",
  },
  {
    img: "/aroma-logo.png",
    description:
      "Expresso’s innovative approach to digital marketing has been instrumental in helping us achieve higher engagement and better ROI. Fantastic team to work with!",
    name: "Varun Devnani",
    title: "Founder",
  },
];

export default function StackedCardTestimonials({ testimonials = DEFAULT_TESTIMONIALS }) {
  const settings = useSiteSettings();
  const [selected, setSelected] = useState(0);
  const resolvedTestimonials = useMemo(
    () => resolveWebsiteImages(settings, testimonials),
    [settings, testimonials]
  );
  const logo = resolveWebsiteImage(settings, "/logo.png");

  useEffect(() => {
    const timer = setInterval(() => {
      setSelected((prev) =>
        prev === resolvedTestimonials.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [resolvedTestimonials.length]);

  const active = resolvedTestimonials[selected] || resolvedTestimonials[0];

  return (
    <section className="relative w-full overflow-hidden py-20 md:py-24">
      {/* dark elegant section background */}
      <div className="absolute inset-0 bg-[#0B0B11]" />
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(900px circle at 16% 20%, rgba(127,138,209,0.18), transparent 34%),
            radial-gradient(700px circle at 84% 22%, rgba(127,138,209,0.10), transparent 28%),
            radial-gradient(1000px circle at 50% 60%, rgba(255,255,255,0.03), transparent 40%),
            linear-gradient(135deg, #0B0B11 0%, #11131D 55%, #0B0B11 100%)
          `,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_36%,rgba(0,0,0,0.28)_100%)]" />

      <HomeSection
        eyebrow="TESTIMONIALS"
        title="Real words. Real results."
        highlight="Real relationships."
        subtitle="We do not just deliver work — we build trust, momentum, and partnerships that clients genuinely value."
        align="center"
        theme="dark"
      >
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm md:p-10">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl"
            style={{ backgroundColor: BRAND, opacity: 0.16 }}
          />
          <div
            className="pointer-events-none absolute -left-16 -bottom-16 h-52 w-52 rounded-full blur-3xl"
            style={{ backgroundColor: BRAND, opacity: 0.1 }}
          />
          <img
            src={logo}
            alt=""
            className="pointer-events-none absolute right-6 top-6 h-20 w-20 object-contain opacity-[0.05]"
            draggable={false}
          />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            {/* LEFT */}
            <div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-white/72">
                CLIENT FEEDBACK
              </div>

              <h3 className="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl">
                The best proof is what clients say{" "}
                <span style={{ color: BRAND }}>after the work ships.</span>
              </h3>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/[0.78] md:text-lg">
                From strategy to final delivery, we focus on making the process
                smooth, collaborative, and genuinely valuable.
              </p>

              <p className="mt-3 max-w-xl text-base leading-relaxed text-white/[0.70] md:text-lg">
                These are not just compliments — they reflect the kind of
                relationships and outcomes we aim to create with every project.
              </p>

              <div className="mt-8">
                <ProgressTabs
                  selected={selected}
                  setSelected={setSelected}
                  count={resolvedTestimonials.length}
                />
              </div>
            </div>

            {/* RIGHT */}
            <div className="grid gap-5">
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="rounded-[30px] border border-white/10 bg-white/[0.96] p-6 text-neutral-950 shadow-[0_20px_60px_rgba(0,0,0,0.22)] md:p-8"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex rounded-full border border-[rgba(127,138,209,0.18)] bg-[rgba(127,138,209,0.08)] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-neutral-700">
                    FEATURED TESTIMONIAL
                  </div>

                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: BRAND }}
                  />
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
                    <img
                      src={active.img}
                      alt={active.name}
                      className="max-h-full max-w-full object-contain"
                      draggable={false}
                    />
                  </div>

                  <div>
                    <div className="text-lg font-black text-neutral-950">
                      {active.name}
                    </div>
                    <div className="mt-1 text-sm text-neutral-500">
                      {active.title}
                    </div>
                  </div>
                </div>

                <blockquote className="mt-6 text-lg leading-8 text-neutral-700 md:text-[20px] md:leading-9">
                  “{active.description}”
                </blockquote>
              </motion.div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {resolvedTestimonials.map((item, index) => {
                  const isActive = selected === index;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelected(index)}
                      className={[
                        "group relative rounded-2xl border p-3 transition",
                        isActive
                          ? "border-[rgba(127,138,209,0.35)] bg-white/[0.10] shadow-[0_16px_35px_rgba(127,138,209,0.12)]"
                          : "border-white/10 bg-white/[0.05] hover:border-white/20",
                      ].join(" ")}
                    >
                      <div className="flex h-14 items-center justify-center">
                        <img
                          src={item.img}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain opacity-90 transition group-hover:opacity-100"
                          draggable={false}
                        />
                      </div>

                      {isActive ? (
                        <div
                          className="absolute inset-x-3 bottom-0 h-1 rounded-full"
                          style={{ backgroundColor: BRAND }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </HomeSection>
    </section>
  );
}

function ProgressTabs({ count, selected, setSelected }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => setSelected(index)}
          className="relative h-2 w-full overflow-hidden rounded-full bg-white/10"
          aria-label={`Go to testimonial ${index + 1}`}
        >
          {selected === index ? (
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ backgroundColor: BRAND }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          ) : (
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: selected > index ? "100%" : "0%",
                backgroundColor: BRAND,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
