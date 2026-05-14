import { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImages } from "../../utils/websiteImages";

// ✅ MOVE OUTSIDE so it doesn't recreate each render
const WORKS = [
  {
    title: "SaaS Dashboard",
    subtitle: "React Application",
    images: [
      { src: "/pat-thumb.jpg", description: "" },
      {
        src: "/pat-gallery1.png",
        description:
          "Interactive analytics page with real-time data visualization and custom charts.",
      },
      {
        src: "/pat5.png",
        description:
          "Responsive admin dashboard with seamless user experience across devices.",
      },
      {
        src: "/pat6.png",
        description:
          "Responsive admin dashboard with seamless user experience across devices.",
      },
    ],
  },
  {
    title: "Corporate Portfolio",
    subtitle: "WordPress Website",
    images: [
      { src: "/godfel.jpeg", description: "" },
      {
        src: "/godfel.png",
        description:
          "Modern homepage with smooth scrolling animations and case study sections.",
      },
      {
        src: "/godfel2.png",
        description:
          "Modern homepage with smooth scrolling animations and case study sections.",
      },
    ],
  },
  {
    title: "Online Storefront",
    subtitle: "eCommerce Platform",
    images: [
      { src: "/odeur.jpg", description: "" },
      {
        src: "/odeur1.jpeg",
        description:
          "Category listing with smart filters and quick-view functionality.",
      },
      {
        src: "/odeur2.jpeg",
        description: "Optimized checkout flow improving conversions by 22%.",
      },
      {
        src: "/odeur3.jpeg",
        description: "Optimized checkout flow improving conversions by 22%.",
      },
    ],
  },
];

const RecentWork = () => {
  const settings = useSiteSettings();
  const works = useMemo(() => resolveWebsiteImages(settings, WORKS), [settings]);

  // ✅ lightbox state
  const [lightbox, setLightbox] = useState({
    open: false,
    workIndex: 0,
    imageIndex: 0,
  });

  const openLightbox = (workIndex, imageIndex) =>
    setLightbox({ open: true, workIndex, imageIndex });

  const closeLightbox = () => setLightbox((s) => ({ ...s, open: false }));

  // ✅ use WORKS (stable)
  const activeWork = useMemo(
    () => works[lightbox.workIndex],
    [works, lightbox.workIndex]
  );

  const activeImages = activeWork?.images || [];
  const activeImage = activeImages[lightbox.imageIndex];

  const lbNext = () =>
    setLightbox((s) => ({
      ...s,
      imageIndex: (s.imageIndex + 1) % activeImages.length,
    }));

  const lbPrev = () =>
    setLightbox((s) => ({
      ...s,
      imageIndex:
        (s.imageIndex - 1 + activeImages.length) % activeImages.length,
    }));

  // ✅ keyboard support
  useEffect(() => {
    if (!lightbox.open) return;

    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") lbNext();
      if (e.key === "ArrowLeft") lbPrev();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox.open, activeImages.length]);

  return (
    <section className="bg-gray-50 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* ---- HEADING ---- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 border-b border-gray-300 pb-6">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-gray-900">
            OUR RECENT <br /> WORK
          </h2>
          <p className="text-gray-600 max-w-md mt-6 md:mt-0 text-sm">
            Explore our latest projects built with React, WordPress, and modern
            web technologies — helping brands grow through innovation and
            design.
          </p>
        </div>

        {/* ---- WORK GRID ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {works.map((work, i) => (
            <WorkCard key={i} work={work} workIndex={i} onOpen={openLightbox} />
          ))}
        </div>
      </div>

      {/* ✅ LIGHTBOX */}
      {lightbox.open && activeImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={closeLightbox}
        >
          <div
            className="relative w-[min(1100px,96vw)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="mb-3 flex items-center justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="text-sm text-white/70">{activeWork.subtitle}</p>
                <h3 className="truncate text-lg font-semibold">
                  {activeWork.title}
                </h3>
              </div>
              <button
                onClick={closeLightbox}
                className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 p-3 transition"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            {/* Image */}
            <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
              <img
                src={activeImage.src}
                alt={activeWork.title}
                className="w-full max-h-[78vh] object-contain bg-black"
                draggable={false}
              />

              {/* Arrows */}
              {activeImages.length > 1 && (
                <>
                  <button
                    onClick={lbPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 p-3 text-white transition"
                    aria-label="Previous"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={lbNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 p-3 text-white transition"
                    aria-label="Next"
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}

              {/* Caption */}
              {activeImage.description && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5">
                  <p className="text-sm text-white/90 max-w-3xl">
                    {activeImage.description}
                  </p>
                </div>
              )}
            </div>

            {/* Thumbs */}
            {activeImages.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {activeImages.map((img, idx) => {
                  const active = idx === lightbox.imageIndex;
                  return (
                    <button
                      key={img.src + idx}
                      onClick={() =>
                        setLightbox((s) => ({ ...s, imageIndex: idx }))
                      }
                      className={[
                        "relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border transition",
                        active
                          ? "border-white/80"
                          : "border-white/15 hover:border-white/35",
                      ].join(" ")}
                      aria-label={`Open image ${idx + 1}`}
                    >
                      <img
                        src={img.src}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                      {active && (
                        <div className="absolute inset-0 ring-2 ring-white/60" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

const WorkCard = ({ work, workIndex, onOpen }) => {
  const [index, setIndex] = useState(0);
  const total = work.images.length;
  const currentImage = work.images[index];

  const next = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % total);
  };
  const prev = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + total) % total);
  };

  const open = () => onOpen(workIndex, index);

  return (
    <button
      type="button"
      onClick={open}
      className="relative group overflow-hidden rounded-2xl shadow hover:shadow-lg transition-all duration-300 bg-white text-left"
      aria-label={`Open gallery for ${work.title}`}
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={currentImage.src}
          alt={work.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          draggable={false}
        />

        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

        <div className="absolute z-20 top-3 right-3 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition backdrop-blur">
          Click to view
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute z-30 left-2 top-1/2 -translate-y-1/2 bg-white/85 text-gray-700 hover:bg-white p-2 rounded-full shadow"
              aria-label="Previous image"
            >
              <FaChevronLeft />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute z-30 right-2 top-1/2 -translate-y-1/2 bg-white/85 text-gray-700 hover:bg-white p-2 rounded-full shadow"
              aria-label="Next image"
            >
              <FaChevronRight />
            </button>
          </>
        )}

        <div className="absolute z-20 bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {work.images.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-4 rounded-full ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>

        {index === 0 ? (
          <div className="absolute z-20 bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-transparent to-transparent p-6 rounded-b-2xl">
            <p className="text-sm text-gray-200 font-medium mb-1">
              {work.subtitle}
            </p>
            <h3 className="text-lg font-semibold text-white">{work.title}</h3>
          </div>
        ) : (
          <div className="absolute z-20 inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-center p-9 pointer-events-none">
            <p className="text-white text-sm">{currentImage.description}</p>
          </div>
        )}
      </div>
    </button>
  );
};

export default RecentWork;
