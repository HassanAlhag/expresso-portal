// /src/components/PortfolioComponents/PortfolioGallerySection.jsx
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiX } from "react-icons/fi";

const BRAND = "#7F8AD1";

export default function PortfolioGallerySection({ images = [] }) {
  const prepared = useMemo(() => {
    const arr = Array.isArray(images) ? images : [];
    return arr
      .map((x, i) =>
        typeof x === "string"
          ? { src: x, alt: `Image ${i + 1}` }
          : { src: x?.src, alt: x?.alt || `Image ${i + 1}` }
      )
      .filter((x) => x?.src);
  }, [images]);

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const has = prepared.length > 0;
  const active = prepared[idx];

  const go = (dir) => {
    if (!has) return;
    setIdx((i) => (i + dir + prepared.length) % prepared.length);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prepared.length]);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        {/* Elegant Box */}
        <div className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_22px_70px_rgba(0,0,0,0.10)]">
          {/* top brand line */}
          <div
            className="h-1 w-full"
            style={{
              background: `linear-gradient(90deg, ${BRAND} 0%, rgba(127,138,209,0.35) 55%, rgba(0,0,0,0) 100%)`,
            }}
          />

          {/* Header */}
          <div className="relative px-5 py-6 sm:px-8">
            {/* subtle glow */}
            <div
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
              style={{ backgroundColor: BRAND, opacity: 0.1 }}
            />

            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-5 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: BRAND }}
                />
                <h3 className="text-sm font-black tracking-[0.28em] text-neutral-900">
                  GALLERY
                </h3>
              </div>
            </div>

            <div className="mt-6 h-px w-full bg-neutral-200" />
          </div>

          {/* Grid */}
          <div className="px-5 pb-7 sm:px-8 sm:pb-8">
            {!has ? (
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-10 text-center">
                <p className="text-lg font-semibold text-neutral-800">
                  No images yet
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  Pass <code className="font-semibold">images</code> to this
                  component.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {prepared.map((img, i) => (
                  <button
                    key={img.src + i}
                    type="button"
                    onClick={() => {
                      setIdx(i);
                      setOpen(true);
                    }}
                    className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 text-left shadow-[0_18px_55px_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_80px_rgba(0,0,0,0.14)] focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    aria-label={`Open ${img.alt}`}
                  >
                    <div
                      className={[
                        "relative w-full",
                        i === 0 ? "aspect-[16/10]" : "aspect-[4/3]",
                      ].join(" ")}
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        loading="lazy"
                        draggable={false}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                      />

                      {/* Hover overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      {/* Hover UI */}
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 opacity-0 transition duration-300 group-hover:opacity-100">
                        <div className="flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {img.alt}
                            </p>
                            <div
                              className="mt-2 h-1 w-16 rounded-full"
                              style={{ backgroundColor: BRAND }}
                            />
                          </div>

                          <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
                            View
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Viewer */}
      <AnimatePresence>
        {open && has ? (
          <motion.div
            className="fixed inset-0 z-[9999] bg-black/85 p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setOpen(false)}
          >
            <div
              className="mx-auto flex h-full max-w-6xl items-center"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
                {/* brand glow */}
                <div
                  className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full blur-3xl"
                  style={{ backgroundColor: BRAND, opacity: 0.18 }}
                />

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 backdrop-blur transition hover:bg-white/15"
                >
                  <FiX /> Close
                </button>

                {/* Prev/Next */}
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-4 top-1/2 z-20 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur transition hover:bg-white/15"
                  aria-label="Previous"
                >
                  <FiArrowLeft />
                </button>

                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-4 top-1/2 z-20 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur transition hover:bg-white/15"
                  aria-label="Next"
                >
                  <FiArrowRight />
                </button>

                {/* Image */}
                <div className="relative aspect-[16/9] w-full">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={active?.src}
                      src={active?.src}
                      alt={active?.alt}
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-contain"
                      initial={{ opacity: 0, scale: 1.01 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.01 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                  </AnimatePresence>

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                  {/* Caption */}
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <p className="text-sm font-semibold text-white">
                      {active?.alt}
                    </p>
                    <div
                      className="mt-3 h-1 w-20 rounded-full"
                      style={{ backgroundColor: BRAND, opacity: 0.95 }}
                    />
                  </div>
                </div>

                {/* Swipe */}
                <motion.div
                  className="absolute inset-0 z-10"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.12}
                  onDragEnd={(e, info) => {
                    const offset = info.offset.x;
                    const v = info.velocity.x;
                    if (offset > 90 || v > 600) go(-1);
                    if (offset < -90 || v < -600) go(1);
                  }}
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
