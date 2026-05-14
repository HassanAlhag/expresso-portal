import React, { useMemo, useState } from "react";
import { FiPlay, FiX, FiExternalLink } from "react-icons/fi";
import { ArrowUpRight } from "lucide-react";
import HomeSection from "../HomeSection/HomeSection";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";

const BRAND = "#7F8AD1";

const isYouTube = (url = "") =>
  typeof url === "string" &&
  (url.includes("youtube.com") || url.includes("youtu.be"));

const toYouTubeEmbed = (url = "") => {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }

    const id = u.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  } catch (e) {}

  return url;
};

export default function ReelsShowcase({
  title = "Reels that stop the scroll",
  subtitle = "Short-form videos built to hook attention, tell a story fast, and drive inquiries.",
  reels = [],
  ctaText = "Request reels like these",
  onCtaClick,
}) {
  const settings = useSiteSettings();
  const logo = resolveWebsiteImage(settings, "/logo.png");
  const [active, setActive] = useState(null);

  const safeReels = useMemo(() => (Array.isArray(reels) ? reels : []), [reels]);

  const loopedReels = useMemo(() => [...safeReels, ...safeReels], [safeReels]);

  return (
    <HomeSection
      eyebrow="REELS"
      title={title || "Reels that stop"}
      highlight="the scroll"
      subtitle={subtitle}
      align="center"
    >
      <div className="relative overflow-hidden">
        {safeReels.length <= 3 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {safeReels.map((item) => (
              <div key={item.id || item._id || item.src} className="w-full">
                <ReelCard item={item} onOpen={() => setActive(item)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="flex w-max animate-[reelsMarquee_32s_linear_infinite] gap-6 hover:[animation-play-state:paused]">
              {loopedReels.map((item, index) => (
                <div
                  key={`${item.id || item._id || item.src}-${index}`}
                  className="w-[280px] shrink-0 sm:w-[320px] lg:w-[360px]"
                >
                  <ReelCard item={item} onOpen={() => setActive(item)} />
                </div>
              ))}
            </div>
          </div>
        )}

        <style>{`
          @keyframes reelsMarquee {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }
        `}</style>
      </div>

      <div className="relative mt-10 overflow-hidden rounded-[28px] border border-neutral-200 bg-gradient-to-br from-[rgba(127,138,209,0.08)] via-white to-white px-5 py-5 shadow-[0_16px_45px_rgba(0,0,0,0.06)] md:px-6">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl"
          style={{ backgroundColor: BRAND, opacity: 0.15 }}
        />

        <img
          src={logo}
          alt=""
          className="pointer-events-none absolute right-5 top-5 h-14 w-14 object-contain opacity-5"
          draggable={false}
        />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-neutral-700">
              Want reels like these for your brand?{" "}
              <span className="font-semibold text-neutral-900">
                We plan + script + edit + launch.
              </span>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <button
              type="button"
              onClick={onCtaClick}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #7F8AD1 0%, #D9DDFC 130%)",
              }}
            >
              {ctaText}
              <ArrowUpRight size={16} />
            </button>

            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            >
              Talk to Us
            </a>
          </div>
        </div>
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div
            className="relative w-full max-w-[980px] overflow-hidden rounded-[24px] bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/70 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {active.title}
                </p>

                <p className="truncate text-xs text-white/60">
                  {active.client ? `${active.client} • ` : ""}
                  {active.platform || "Reel"}{" "}
                  {active.duration ? `• ${active.duration}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {active.src ? (
                  <a
                    href={active.src}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10"
                  >
                    Open link <FiExternalLink />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 p-2 text-white transition hover:bg-white/10"
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="bg-black">
              <div className="relative aspect-video w-full bg-black">
                {isYouTube(active.src) ? (
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={toYouTubeEmbed(active.src)}
                    title={active.title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    className="absolute inset-0 h-full w-full bg-black object-contain"
                    src={active.src}
                    controls
                    autoPlay
                    playsInline
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </HomeSection>
  );
}

function ReelCard({ item, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "group relative w-full overflow-hidden rounded-[26px] border border-neutral-200 bg-white text-left",
        "shadow-[0_10px_35px_rgba(0,0,0,0.08)]",
        "transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_65px_rgba(0,0,0,0.14)]",
      ].join(" ")}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
        <img
          src={item.poster}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          draggable={false}
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="grid h-14 w-14 place-items-center rounded-full bg-white/90 transition group-hover:scale-105"
            style={{ boxShadow: "0 12px 40px rgba(127,138,209,0.18)" }}
          >
            <FiPlay className="text-neutral-950" />
          </div>
        </div>

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {item.platform ? <Chip>{item.platform}</Chip> : null}
          {item.duration ? <Chip soft>{item.duration}</Chip> : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-sm font-medium text-white/80">
            {item.client || item.category || "Reel"}
          </p>

          <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-white">
            {item.title}
          </h3>
        </div>
      </div>
    </button>
  );
}

function Chip({ children, soft }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold backdrop-blur",
        soft
          ? "border border-white/20 bg-white/15 text-white"
          : "border border-white/25 bg-white/90 text-neutral-950",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
