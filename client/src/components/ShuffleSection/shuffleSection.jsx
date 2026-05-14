import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Lightbox from "../Lightbox/Lightbox";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImages } from "../../utils/websiteImages";

const BRAND = "#7F8AD1";

const DEFAULT_ITEMS = [
  { id: 1, src: "/ultimate1.png", label: "Ultimate" },
  { id: 2, src: "/odeur1.png", label: "Odeur" },
  { id: 3, src: "/expresso1.png", label: "Expresso" },
  { id: 4, src: "/ayur1.png", label: "Ayur" },
  { id: 5, src: "/mih1.png", label: "MIH" },
  { id: 6, src: "/floraison1.png", label: "Floraison" },
  { id: 7, src: "/smile1.png", label: "Smile" },
  { id: 8, src: "/angelic1.png", label: "Angelic" },
];

export default function ShuffleHero({ items: itemsProp }) {
  const navigate = useNavigate();
  const settings = useSiteSettings();
  const [active, setActive] = useState(null);
  const items = (itemsProp && itemsProp.length > 0)
    ? itemsProp
    : resolveWebsiteImages(settings, DEFAULT_ITEMS);
  const looped = useMemo(() => [...items, ...items], [items]);

  return (
    <section className="relative w-full overflow-hidden py-24 md:py-28">
      <div className="absolute inset-0 bg-[#05060A]" />

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(820px circle at 14% 18%, rgba(127,138,209,0.28), transparent 34%),
            radial-gradient(700px circle at 82% 18%, rgba(127,138,209,0.16), transparent 28%),
            radial-gradient(1000px circle at 50% 55%, rgba(127,138,209,0.08), transparent 42%),
            linear-gradient(135deg, rgba(127,138,209,0.06) 0%, transparent 22%, transparent 78%, rgba(127,138,209,0.06) 100%)
          `,
        }}
      />

      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 w-[42%] -translate-x-1/2 blur-3xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(127,138,209,0.12) 0%, rgba(127,138,209,0.04) 45%, rgba(127,138,209,0.10) 100%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(0,0,0,0.34)_100%)]" />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(127,138,209,0.55) 50%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto w-[min(1200px,92vw)]">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-[rgba(127,138,209,0.22)] bg-[rgba(127,138,209,0.08)] px-4 py-2 text-xs font-semibold tracking-[0.22em] text-white/80 backdrop-blur">
            OUR ACCOUNTS
          </div>

          <h2 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
            Brands we helped <span style={{ color: BRAND }}>stand out</span>
          </h2>

          <p className="mt-5 text-base leading-relaxed text-white/[0.82] md:text-lg">
            A moving strip of selected client accounts and creative outputs from
            across our portfolio.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/our-portfolio")}
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #7F8AD1 0%, #D9DDFC 130%)",
                boxShadow: "0 18px 50px rgba(127,138,209,0.22)",
              }}
            >
              View portfolio
              <ArrowUpRight size={16} />
            </button>

            <span className="rounded-2xl border border-[rgba(127,138,209,0.16)] bg-[rgba(127,138,209,0.06)] px-4 py-3 text-sm font-semibold text-white/80 backdrop-blur">
              Websites • Ads • Creatives
            </span>
          </div>
        </div>

        <div className="mt-12 overflow-hidden">
          <div className="flex w-max animate-[marquee_30s_linear_infinite] gap-6">
            {looped.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                onClick={() => setActive(item)}
                className="group relative w-[230px] shrink-0 overflow-hidden rounded-[28px] border border-[rgba(127,138,209,0.22)] bg-[rgba(127,138,209,0.09)] p-2.5 text-left shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-md transition duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:bg-[rgba(127,138,209,0.14)] hover:shadow-[0_28px_80px_rgba(127,138,209,0.14)]"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(127,138,209,0.10) 0%, transparent 28%, transparent 72%, rgba(127,138,209,0.08) 100%)",
                  }}
                />

                <div className="relative overflow-hidden rounded-[20px]">
                  <img
                    src={item.imageUrl || item.src}
                    alt={item.label}
                    className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,10,20,0.26)] via-transparent to-transparent" />
                </div>

                <div className="relative px-2 pb-1 pt-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: BRAND }}
                    />
                    <span className="text-sm font-semibold text-white">
                      {item.label}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      <Lightbox
        open={!!active}
        onClose={() => setActive(null)}
        src={active?.imageUrl || active?.src || ""}
        alt={active?.label || "Portfolio item"}
      />
    </section>
  );
}
