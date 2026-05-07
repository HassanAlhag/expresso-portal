import React from "react";
import { Image as ImageIcon } from "lucide-react";

export default function HomepageSlidePreview({ slide }) {
  const mainImage = slide?.imageUrl || "";
  const thumbImage = slide?.thumbImageUrl || slide?.imageUrl || "";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
      <div className="grid gap-0 md:grid-cols-[1.4fr_0.8fr]">
        <div className="relative min-h-[220px] overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage}
              alt={slide?.title || "Slide preview"}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-slate-900 text-white/40">
              <ImageIcon size={28} />
            </div>
          )}

          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="relative z-10 flex min-h-[220px] flex-col justify-end p-5">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-white/80">
              {slide?.eyebrowLeft || "EXPRESSO DIGITAL"}
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              {slide?.eyebrowRight || "GROWTH SYSTEMS"}
            </div>

            <h3 className="max-w-lg text-2xl font-black leading-tight text-white">
              {slide?.title || "Slide title preview"}
            </h3>

            <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-6 text-white/75">
              {slide?.subtitle || "Slide subtitle preview will appear here."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-xl bg-indigo-300 px-4 py-2 text-xs font-black text-black">
                {slide?.ctaLabel || "Explore Services"}
              </span>

              <span className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-black text-white">
                {slide?.secondaryCtaLabel || "Talk to Us"}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/[0.03] p-4 md:border-l md:border-t-0">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
            Thumbnail
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
            {thumbImage ? (
              <img
                src={thumbImage}
                alt="Thumbnail preview"
                className="aspect-[4/3] w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="grid aspect-[4/3] place-items-center text-white/30">
                <ImageIcon size={24} />
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-2 text-xs text-white/60">
            <div>Order: {slide?.order ?? 0}</div>
            <div>Status: {slide?.isActive ? "Active" : "Inactive"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
