// /client/src/components/Banner/banner.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { listPublicHomepageSlides } from "../../api/homepageSlides";
import { toWebsiteImageUrl } from "../../utils/websiteImages";

const FALLBACK_SLIDES = [
  {
    id: 1,
    eyebrowLeft: "EXPRESSO DIGITAL",
    eyebrowRight: "GROWTH SYSTEMS",
    heading: "Build Your Digital Presence",
    description:
      "We design and develop fast, modern websites that convert visitors into customers — built for growth from day one.",
    mainBg: "",
    thumbImage: "",
    ctaLabel: "Explore Services",
    ctaUrl: "/services",
    secondaryCtaLabel: "Talk to Us",
    secondaryCtaUrl: "/contact-us",
  },
];

const BRAND = "#7F8AD1";
const AUTO_SECONDS = 5;

const CARD_W = 278;
const CARD_H = 196;
const R = 240;
const HUB_X = 158;
const STEP_DEG = 72;

const SPRING = { type: "spring", stiffness: 200, damping: 28 };

const wrap = (n, len) => (len ? ((n % len) + len) % len : 0);

function arcPos(d) {
  const abs = Math.abs(d);
  const angle = (180 + d * STEP_DEG) * (Math.PI / 180);

  return {
    x: R * Math.cos(angle) + HUB_X,
    y: -(R * Math.sin(angle)),
    scale: abs === 0 ? 1 : abs === 1 ? 0.82 : 0.66,
    opacity: abs === 0 ? 1 : abs === 1 ? 0.6 : 0,
    rotateZ: d * 14,
    z: abs === 0 ? 10 : abs === 1 ? 5 : 0,
  };
}

const preload = (src) =>
  new Promise((resolve) => {
    if (!src) return resolve();

    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });

function normalizeSlides(items) {
  const rows = Array.isArray(items) ? items : [];

  return rows
    .filter(
      (item) =>
        item.title ||
        item.subtitle ||
        item.imageUrl ||
        item.heading ||
        item.description ||
        item.mainBg
    )
    .map((item, index) => ({
      id: item.id || item._id || index,

      eyebrowLeft: item.eyebrowLeft || "EXPRESSO DIGITAL",
      eyebrowRight: item.eyebrowRight || "GROWTH SYSTEMS",

      heading: item.title || item.heading || "Untitled slide",
      description: item.subtitle || item.description || "",

      mainBg: item.imageUrl || item.mainBg || "",

      thumbImage:
        item.thumbImageUrl ||
        item.thumbImage ||
        item.imageUrl ||
        item.mainBg ||
        "",

      ctaLabel: item.ctaLabel || "Explore Services",
      ctaUrl: item.ctaUrl || "/services",

      secondaryCtaLabel: item.secondaryCtaLabel || "Talk to Us",
      secondaryCtaUrl: item.secondaryCtaUrl || "/contact-us",

      order: item.order || 0,
    }));
}

export default function Banner() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bgSrc, setBgSrc] = useState("");

  const timer = useRef(null);
  const nav = useNavigate();

  const setActiveSafe = useCallback(
    (index) => setActive(() => wrap(index, slides.length)),
    [slides.length]
  );

  useEffect(() => {
    let dead = false;

    async function loadSlides() {
      try {
        const res = await listPublicHomepageSlides();
        const dynamicSlides = normalizeSlides(res?.items);

        const nextSlides = (dynamicSlides.length
          ? dynamicSlides
          : FALLBACK_SLIDES
        ).map((slide) => ({
          ...slide,
          mainBg: toWebsiteImageUrl(slide.mainBg),
          thumbImage: toWebsiteImageUrl(slide.thumbImage),
        }));
        const firstImage = nextSlides?.[0]?.mainBg || FALLBACK_SLIDES[0].mainBg;

        await preload(firstImage);

        if (!dead) {
          setSlides(nextSlides);
          setActive(0);
          setBgSrc(firstImage);
        }
      } catch (err) {
        console.error("Failed to load homepage slides:", err);

        const firstImage = FALLBACK_SLIDES[0].mainBg;
        await preload(firstImage);

        if (!dead) {
          setSlides(
            FALLBACK_SLIDES.map((slide) => ({
              ...slide,
              mainBg: toWebsiteImageUrl(slide.mainBg),
              thumbImage: toWebsiteImageUrl(slide.thumbImage),
            }))
          );
          setActive(0);
          setBgSrc(firstImage);
        }
      } finally {
        if (!dead) {
          setLoading(false);
        }
      }
    }

    loadSlides();

    return () => {
      dead = true;
    };
  }, []);

  const current = slides[active] || slides[0];
  const backgroundSource = bgSrc || current?.mainBg || "";

  useEffect(() => {
    clearInterval(timer.current);

    if (slides.length <= 1 || paused) return;

    timer.current = setInterval(() => {
      setActive((prev) => wrap(prev + 1, slides.length));
    }, AUTO_SECONDS * 1000);

    return () => clearInterval(timer.current);
  }, [slides.length, paused]);

  useEffect(() => {
    let dead = false;

    async function swapBackground() {
      const next = current?.mainBg;

      if (!next || next === bgSrc) return;

      await preload(next);

      if (!dead) setBgSrc(next);
    }

    swapBackground();

    return () => {
      dead = true;
    };
  }, [current?.mainBg, bgSrc]);

  const visible = useMemo(() => {
    const len = slides.length;

    if (!len) return [];

    return slides
      .map((slide, index) => {
        let distance = index - active;

        if (distance > len / 2) distance -= len;
        if (distance < -len / 2) distance += len;

        if (Math.abs(distance) > 2) return null;

        return {
          ...slide,
          __i: index,
          __d: distance,
        };
      })
      .filter(Boolean);
  }, [slides, active]);

  const hasSlideMedia = visible.some(
    (slide) => slide.thumbImage || slide.mainBg
  );
  const textColumnClass = hasSlideMedia ? "lg:col-span-7" : "lg:col-span-9";

  const handlePrimaryClick = () => {
    const url = current?.ctaUrl || "/services";

    if (url.startsWith("http")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    nav(url);
  };

  const handleSecondaryClick = () => {
    const url = current?.secondaryCtaUrl || "/contact-us";

    if (url.startsWith("http")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    nav(url);
  };

  if (loading) {
    return (
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black/85" />

        <div className="mx-auto flex min-h-screen w-[min(1220px,92vw)] items-center">
          <div className="text-white/80">
            <div
              className="mb-4 h-2 w-32 rounded-full"
              style={{ backgroundColor: "rgba(127,138,209,0.35)" }}
            />
            <div className="h-10 w-[min(520px,80vw)] rounded-xl bg-white/10" />
            <div className="mt-4 h-4 w-[min(560px,84vw)] rounded-lg bg-white/10" />
            <div className="mt-2 h-4 w-[min(440px,70vw)] rounded-lg bg-white/10" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative isolate min-h-screen overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="absolute inset-0 -z-30">
        {backgroundSource ? (
          <img
            src={backgroundSource}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-slate-950" />
        )}

        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/85" />
        <div className="absolute inset-0 [background:radial-gradient(900px_circle_at_18%_30%,rgba(255,255,255,0.14),transparent_55%)]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(700px circle at 78% 62%, rgba(127,138,209,0.20), transparent 55%)",
          }}
        />
      </div>

      <div className="mx-auto grid min-h-screen w-[min(1220px,92vw)] items-center gap-10 py-20 lg:grid-cols-12">
        <div className={textColumnClass}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-white/80 backdrop-blur-xl">
            {current?.eyebrowLeft || "EXPRESSO DIGITAL"}
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: BRAND }}
            />
            {current?.eyebrowRight || "GROWTH SYSTEMS"}
          </div>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
            <span className="relative">
              {current?.heading || "Build Your Digital Presence"}
              <span
                className="pointer-events-none absolute -bottom-2 left-0 h-[3px] w-24 rounded-full opacity-90"
                style={{ backgroundColor: BRAND }}
              />
            </span>
          </h1>

          {current?.description ? (
            <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/80 sm:text-lg">
              {current.description}
            </p>
          ) : null}

          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="rounded-2xl px-7 py-3 text-sm font-semibold text-black shadow-[0_18px_60px_rgba(0,0,0,0.30)] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(127,138,209,1) 0%, rgba(255,255,255,0.95) 110%)",
              }}
            >
              {current?.ctaLabel || "Explore Services"}
            </button>

            <button
              type="button"
              onClick={handleSecondaryClick}
              className="rounded-2xl border border-white/18 bg-white/5 px-7 py-3 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/10 active:scale-[0.98]"
            >
              {current?.secondaryCtaLabel || "Talk to Us"}
            </button>
          </div>

          {slides.length > 1 ? (
            <div className="mt-8 flex items-center gap-3">
              <div className="flex items-center gap-2">
                {slides.slice(0, Math.min(6, slides.length)).map((_, index) => {
                  const isOn = index === active;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveSafe(index)}
                      className="h-2.5 w-2.5 rounded-full transition"
                      style={{
                        backgroundColor: isOn
                          ? BRAND
                          : "rgba(255,255,255,0.22)",
                        boxShadow: isOn
                          ? "0 0 0 6px rgba(127,138,209,0.12)"
                          : "none",
                      }}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  );
                })}
              </div>

              <span className="text-sm text-white/65">
                {active + 1} / {slides.length}
              </span>
            </div>
          ) : null}
        </div>

        {hasSlideMedia ? (
          <div className="flex lg:col-span-5 lg:justify-end">
            <div
              className="relative w-full max-w-[500px]"
              style={{ height: 600, overflow: "visible" }}
            >
              <div
                className="pointer-events-none absolute rounded-full blur-3xl"
                style={{
                  width: 320,
                  height: 320,
                  right: -40,
                  top: "50%",
                  transform: "translateY(-50%)",
                  backgroundColor: BRAND,
                  opacity: 0.15,
                }}
              />

              <div
                className="pointer-events-none absolute rounded-full"
                style={{
                  width: R * 2,
                  height: R * 2,
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${HUB_X}px), -50%)`,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />

              <div
                className="pointer-events-none absolute rounded-full"
                style={{
                  width: (R - 22) * 2,
                  height: (R - 22) * 2,
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${HUB_X}px), -50%)`,
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              />

              {[...visible]
                .sort((a, b) => arcPos(a.__d).z - arcPos(b.__d).z)
                .map((slide) => {
                  const position = arcPos(slide.__d);
                  const isActive = slide.__i === active;
                  const isGhost = Math.abs(slide.__d) >= 2;

                  return (
                    <motion.button
                      key={slide.id}
                      type="button"
                      onClick={() => !isActive && setActiveSafe(slide.__i)}
                      tabIndex={isGhost ? -1 : 0}
                      className={[
                        "absolute left-1/2 top-1/2 overflow-hidden rounded-2xl border",
                        "bg-black/20 backdrop-blur-xl",
                        "shadow-[0_20px_60px_rgba(0,0,0,0.55)]",
                        isActive
                          ? "cursor-default border-white/40"
                          : "cursor-pointer border-white/12",
                      ].join(" ")}
                      style={{
                        width: CARD_W,
                        height: CARD_H,
                        marginLeft: -(CARD_W / 2),
                        marginTop: -(CARD_H / 2),
                        zIndex: position.z,
                        pointerEvents: isGhost ? "none" : "auto",
                      }}
                      animate={{
                        x: position.x,
                        y: position.y,
                        scale: position.scale,
                        opacity: position.opacity,
                        rotateZ: position.rotateZ,
                      }}
                      transition={SPRING}
                    >
                      {slide.thumbImage || slide.mainBg ? (
                        <img
                          src={slide.thumbImage || slide.mainBg}
                          alt={slide.heading || "slide"}
                          className="h-full w-full object-cover"
                          draggable={false}
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-950" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {isActive ? (
                        <>
                          <div
                            className="absolute inset-0 rounded-2xl"
                            style={{ boxShadow: `inset 0 0 0 2px ${BRAND}` }}
                          />

                          <div
                            className="absolute bottom-3 left-3 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90"
                            style={{
                              background: "rgba(127,138,209,0.35)",
                              backdropFilter: "blur(8px)",
                            }}
                          >
                            {String(slide.__i + 1).padStart(2, "0")}
                          </div>
                        </>
                      ) : null}
                    </motion.button>
                  );
                })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
