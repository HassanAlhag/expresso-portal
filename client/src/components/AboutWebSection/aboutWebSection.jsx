import React from "react";
import { motion } from "framer-motion";
import { FiArrowUpRight } from "react-icons/fi";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";

const AboutWebSection = ({
  backgroundImageUrl = "/business.webp",
  deviceImageUrl = "/iphone.webp",
}) => {
  const settings = useSiteSettings();
  const resolvedBackgroundImageUrl = resolveWebsiteImage(settings, backgroundImageUrl);
  const resolvedDeviceImageUrl = resolveWebsiteImage(settings, deviceImageUrl);

  return (
    <section id="mission-vision" className="relative overflow-hidden text-white">
      {/* ✅ Background image (from the 2nd code) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${resolvedBackgroundImageUrl}')` }}
      />

      {/* ✅ Dark cinematic overlays (from the 2nd code) */}
      <div className="absolute inset-0 bg-black/65" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_top_left,rgba(127,138,209,0.22),transparent_55%)]" />
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.7),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* LEFT (kept exactly like your first code) */}
          <div className="text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-widest text-white/80 backdrop-blur">
              ABOUT EXPRESSO{" "}
              <span className="h-1.5 w-1.5 rounded-full bg-[#7F8AD1]" />
              WEB & MARKETING
            </p>

            <h1 className="mt-6 text-4xl font-black tracking-tight leading-[1.08] sm:text-5xl lg:text-6xl">
              Empowering Businesses to Achieve{" "}
              <span className="text-[#7F8AD1]">Real Growth</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              At <span className="font-semibold text-white">Expresso</span>, we
              don’t just build solutions — we build growth engines. Our mission
              is to help businesses scale through innovative digital strategies.
              From increasing your digital presence to optimizing your funnel,
              we focus on measurable results that compound over time.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {/* Primary CTA */}
              <button className="group inline-flex items-center gap-2 rounded-2xl bg-[#7F8AD1] px-6 py-3 text-sm font-semibold text-black shadow-[0_16px_50px_rgba(127,138,209,0.35)] transition hover:brightness-110 active:scale-[0.98]">
                Read More
                <FiArrowUpRight className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>

              {/* Secondary CTA */}
              <button className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10 active:scale-[0.98]">
                View Services
              </button>
            </div>

            {/* Mini points */}
            <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                "Conversion-first websites",
                "Social media systems",
                "Performance ads",
              ].map((t) => (
                <div
                  key={t}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 backdrop-blur"
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT (your first code + image only, no surrounding box) */}
          <div className="relative flex items-center justify-center">
            {/* glow */}
            <div className="pointer-events-none absolute -inset-10 rounded-full bg-[#7F8AD1]/20 blur-3xl" />

            <motion.div
              className="relative"
              initial={{ y: 8, rotateY: -14, rotateX: 6 }}
              animate={{ y: -8 }}
              transition={{
                duration: 3.6,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
              whileHover={{ rotateY: -4, rotateX: 2, scale: 1.02 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <img
                src={resolvedDeviceImageUrl}
                alt="iPhone Mockup"
                className="h-[300px] w-auto object-contain sm:h-[420px] md:h-[520px] lg:h-[620px]"
                draggable={false}
              />

              {/* subtle reflection */}
              <div className="pointer-events-none absolute -bottom-10 left-1/2 h-16 w-[80%] -translate-x-1/2 rounded-full bg-black/50 blur-2xl" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutWebSection;
