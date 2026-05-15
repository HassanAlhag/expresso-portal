import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import HomeSection from "../HomeSection/HomeSection";
import Lightbox from "../Lightbox/Lightbox";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";

const BRAND = "#7F8AD1";

const DEFAULT_LAYOUT = [
  { top: "12%", left: "18%", rotate: "-10deg", size: "w-28 md:w-40" },
  { top: "8%", left: "42%", rotate: "8deg", size: "w-32 md:w-44" },
  { top: "18%", left: "64%", rotate: "-6deg", size: "w-28 md:w-40" },
  { top: "42%", left: "12%", rotate: "7deg", size: "w-32 md:w-44" },
  { top: "36%", left: "38%", rotate: "-4deg", size: "w-36 md:w-52" },
  { top: "48%", left: "62%", rotate: "10deg", size: "w-30 md:w-44" },
  { top: "66%", left: "22%", rotate: "-8deg", size: "w-28 md:w-40" },
  { top: "70%", left: "50%", rotate: "6deg", size: "w-32 md:w-44" },
];

export const DragCards = ({
  title = "EXPRESSO",
  images = [],
  onPrimaryClick,
}) => {
  const settings = useSiteSettings();
  const logo = resolveWebsiteImage(settings, "/logo.png");

  return (
    <HomeSection
      eyebrow="GALLERY"
      title="Creative work you can"
      highlight="explore"
      subtitle="A playful gallery where visitors can drag, explore, and open selected work from our portfolio."
      align="center"
    >
      <div className="relative overflow-hidden rounded-[32px] border border-neutral-200 bg-gradient-to-br from-[rgba(127,138,209,0.08)] via-white to-white p-6 md:p-10 shadow-[0_22px_70px_rgba(0,0,0,0.08)]">
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl"
          style={{ backgroundColor: BRAND, opacity: 0.16 }}
        />
        <div
          className="pointer-events-none absolute -left-16 -bottom-16 h-52 w-52 rounded-full blur-3xl"
          style={{ backgroundColor: BRAND, opacity: 0.08 }}
        />
        <img
          src={logo}
          alt=""
          className="pointer-events-none absolute right-6 top-6 h-20 w-20 object-contain opacity-5"
          draggable={false}
        />

        <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-[0.95fr,1.05fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-[rgba(127,138,209,0.18)] bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-neutral-700">
              DRAG + DISCOVER
            </div>

            <h3 className="mt-5 text-4xl font-black tracking-tight text-neutral-950 md:text-5xl">
              {title}
              <span className="ml-1" style={{ color: BRAND }}>
                .
              </span>
            </h3>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-600 md:text-lg">
              Move the cards around, explore selected visuals, and open any
              piece for a larger preview. This turns the gallery into an
              experience instead of a static grid.
            </p>

            <p className="mt-3 max-w-xl text-base leading-relaxed text-neutral-600 md:text-lg">
              The cards begin in a designed center composition, so the work is
              instantly visible and still fun to interact with.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onPrimaryClick}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold text-black transition hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(135deg, #7F8AD1 0%, #D9DDFC 130%)",
                }}
              >
                Build Your Plan
                <ArrowUpRight size={16} />
              </button>

              <a
                href="/case-studies"
                className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                View portfolio
              </a>
            </div>
          </div>

          <Cards images={images} />
        </div>
      </div>
    </HomeSection>
  );
};

function Cards({ images }) {
  const containerRef = useRef(null);
  const maxZ = useRef(20);

  const [open, setOpen] = useState(false);
  const [activeSrc, setActiveSrc] = useState("");
  const [activeAlt, setActiveAlt] = useState("");

  const prepared = useMemo(() => {
    const safe = Array.isArray(images) ? images.filter((x) => x?.src) : [];
    return safe.slice(0, 8).map((img, index) => ({
      ...img,
      ...DEFAULT_LAYOUT[index % DEFAULT_LAYOUT.length],
    }));
  }, [images]);

  const onOpen = (src, alt) => {
    setActiveSrc(src);
    setActiveAlt(alt || "Preview");
    setOpen(true);
  };

  return (
    <>
      <div className="relative">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-60 w-60 rounded-full blur-3xl"
          style={{ backgroundColor: BRAND, opacity: 0.12 }}
        />

        <div
          ref={containerRef}
          className="relative mx-auto h-[520px] w-full max-w-[560px] overflow-hidden rounded-[28px] border border-neutral-200 bg-white/75 shadow-[0_18px_55px_rgba(0,0,0,0.10)] backdrop-blur"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_circle_at_50%_45%,rgba(127,138,209,0.08),transparent_60%)]" />

          {prepared.map((image, index) => (
            <Card
              key={image.src + index}
              containerRef={containerRef}
              maxZ={maxZ}
              onOpen={onOpen}
              {...image}
            />
          ))}

          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-neutral-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-neutral-600 shadow-sm">
            Drag cards • Double click to preview
          </div>
        </div>
      </div>

      <Lightbox
        open={open}
        onClose={() => setOpen(false)}
        src={activeSrc}
        alt={activeAlt}
      />
    </>
  );
}

function Card({
  containerRef,
  maxZ,
  src,
  alt,
  top,
  left,
  rotate,
  size,
  onOpen,
}) {
  const [zIndex, setZIndex] = useState(1);

  const bringToFront = () => {
    maxZ.current += 1;
    setZIndex(maxZ.current);
  };

  return (
    <motion.button
      type="button"
      onPointerDown={bringToFront}
      onDoubleClick={() => onOpen?.(src, alt)}
      style={{ top, left, rotate, zIndex }}
      className={[
        "absolute select-none overflow-hidden rounded-[22px] border border-neutral-200 bg-white p-1 pb-3 shadow-[0_18px_40px_rgba(0,0,0,0.14)] transition hover:shadow-[0_22px_50px_rgba(0,0,0,0.18)]",
        "cursor-grab active:cursor-grabbing",
        size,
      ].join(" ")}
      drag
      dragConstraints={containerRef}
      dragElastic={0.35}
      whileTap={{ scale: 1.02 }}
      aria-label="Drag image"
      title="Drag (double click to view)"
    >
      <img
        src={src}
        alt={alt}
        className="block aspect-[4/5] w-full rounded-[16px] object-cover"
        draggable={false}
      />
      <div className="mt-2 px-2 text-left text-[11px] font-medium text-neutral-600">
        Double click to view
      </div>
    </motion.button>
  );
}
