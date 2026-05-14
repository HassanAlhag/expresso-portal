import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FiArrowUpRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";

const IMG_PADDING = 8;
const BRAND = "#7F8AD1";

const PARALLAX_FALLBACK = "/home2.jpg";
const CARD_FALLBACK = "/home4.jpg";

export default function TextParallaxContentExample() {
  const settings = useSiteSettings();

  // Registry overrides (set via Website Images panel) take priority over structured settings.
  // resolveWebsiteImage returns the original path unchanged when no registry entry exists.
  const registryParallax = resolveWebsiteImage(settings, PARALLAX_FALLBACK);
  const registryCard = resolveWebsiteImage(settings, CARD_FALLBACK);

  const parallaxImg =
    registryParallax !== PARALLAX_FALLBACK
      ? registryParallax
      : settings?.homepageSections?.aboutImageUrl || PARALLAX_FALLBACK;

  const cardImg =
    registryCard !== CARD_FALLBACK
      ? registryCard
      : settings?.homepageSections?.servicesImageUrl || CARD_FALLBACK;

  return (
    <div className="bg-white">
      <ParallaxSection
        imgUrl={parallaxImg}
        subheading="Strategic Excellence for Business Growth"
        heading="Empowering Businesses to Lead in the Digital Age."
      >
        <GlassContent
          heading="Igniting Business Growth with Strategy That Matters"
          description1="At Expresso Digital, we unlock your business’s true potential through strategies tailored just for you. We don’t do cookie-cutter solutions — we craft insight-driven, purpose-built plans that align with your goals and drive real results."
          description2="Blending industry expertise with creative innovation, our team transforms challenges into opportunities and vision into action. Let Expresso Digital elevate your digital presence and shape a brand that stands strong in today’s competitive world."
          cardImgUrl={cardImg}
        />
      </ParallaxSection>
    </div>
  );
}

function ParallaxSection({
  imgUrl,
  subheading,
  heading,
  children,
  isLast = false,
}) {
  const settings = useSiteSettings();
  const resolvedImgUrl = resolveWebsiteImage(settings, imgUrl);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const overlayY = useTransform(scrollYProgress, [0, 1], [180, -180]);
  const overlayOpacity = useTransform(
    scrollYProgress,
    [0.25, 0.5, 0.75],
    [0, 1, 0]
  );

  return (
    <section
      className="bg-white"
      style={{
        paddingTop: 40,
        paddingBottom: isLast ? 18 : 40, // ✅ less space after last section
      }}
    >
      <div ref={ref} className="relative">
        <div className="relative h-[78vh] md:h-[88vh]">
          <motion.div
            className="absolute inset-0 left-1/2 w-screen -translate-x-1/2 overflow-hidden rounded"
            style={{
              backgroundImage: `url(${resolvedImgUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              top: IMG_PADDING,
            }}
          >
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_25%,rgba(255,255,255,0.14),transparent_55%)]" />
          </motion.div>

          <motion.div
            style={{ y: overlayY, opacity: overlayOpacity }}
            className="relative z-10 flex h-full w-full items-center justify-center px-4 text-white"
          >
            <div className="w-[min(1100px,92vw)] text-center">
              <p className="mb-3 text-lg md:text-3xl">{subheading}</p>
              <h2 className="text-3xl font-bold md:text-7xl">{heading}</h2>
            </div>
          </motion.div>
        </div>

        <div className="relative z-20" style={{ marginTop: -180 }}>
          <div className="mx-auto w-[min(1100px,92vw)] px-4">
            <div className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white/70 p-7 backdrop-blur-2xl shadow-[0_35px_120px_rgba(0,0,0,0.18)] md:p-10">
              <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-white/80 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white/10" />
              <div className="relative">{children}</div>
            </div>
          </div>
        </div>

        <div className={isLast ? "h-1" : "h-3"} />
      </div>
    </section>
  );
}

function GlassContent({
  heading,
  description1,
  description2,
  description3,
  cardImgUrl = "/home4.jpg", // use any existing image
  cardImgAlt = "Gallery image",
}) {
  const settings = useSiteSettings();
  const resolvedCardImgUrl = resolveWebsiteImage(settings, cardImgUrl);
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
      {/* LEFT */}
      <div className="col-span-1 md:col-span-4">
        <h3 className="text-2xl font-bold text-neutral-900 md:text-3xl">
          {heading}
        </h3>

        {/* ✅ fills the empty space ONLY (fixed height, does not expand layout) */}
        {resolvedCardImgUrl ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.10)]">
            <div className="relative h-[140px] w-full">
              <img
                src={resolvedCardImgUrl}
                alt={cardImgAlt}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
                loading="lazy"
              />
              {/* subtle overlay so it feels premium */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
                style={{ backgroundColor: BRAND, opacity: 0.14 }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* RIGHT */}
      <div className="col-span-1 md:col-span-8">
        {description1 && (
          <p className="mb-4 text-base text-neutral-700 md:text-lg">
            {description1}
          </p>
        )}
        {description2 && (
          <p className="mb-4 text-base text-neutral-700 md:text-lg">
            {description2}
          </p>
        )}
        {description3 && (
          <p className="mb-6 text-base text-neutral-700 md:text-lg">
            {description3}
          </p>
        )}

        <button
          className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 transition hover:bg-neutral-800"
          onClick={() => navigate("/services")}
        >
          Learn more <FiArrowUpRight />
        </button>
      </div>
    </div>
  );
}
