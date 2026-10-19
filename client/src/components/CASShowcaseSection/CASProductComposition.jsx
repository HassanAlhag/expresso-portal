import React from "react";
import { CAS_IMAGES } from "../../data/casProduct";

/**
 * Premium overlapping desktop/mobile product shot. Below `lg` (992px) the
 * overlap is dropped in favor of just the mobile capture at a legible size —
 * cramming both images into a narrow viewport would shrink the desktop
 * screenshot's text past readability.
 */
export default function CASProductComposition({ eager = false }) {
  const { doctorsDesktop, doctorsMobile } = CAS_IMAGES;
  const loading = eager ? "eager" : "lazy";
  const fetchPriority = eager ? "high" : undefined;

  return (
    <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
      {/* Mobile-only: single legible mobile capture */}
      <div className="lg:hidden">
        <img
          src={doctorsMobile.src}
          width={doctorsMobile.width}
          height={doctorsMobile.height}
          alt={doctorsMobile.alt}
          loading={loading}
          fetchpriority={fetchPriority}
          className="w-full rounded-2xl border border-neutral-200 object-cover object-top shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
          style={{ aspectRatio: `${doctorsMobile.width} / ${doctorsMobile.height}` }}
        />
      </div>

      {/* lg+: overlapping desktop + mobile composition */}
      <div className="relative hidden lg:block">
        <img
          src={doctorsDesktop.src}
          width={doctorsDesktop.width}
          height={doctorsDesktop.height}
          alt={doctorsDesktop.alt}
          loading={loading}
          fetchpriority={fetchPriority}
          className="w-full rounded-2xl border border-neutral-200 object-cover object-top shadow-[0_24px_70px_rgba(0,0,0,0.14)]"
          style={{ aspectRatio: `${doctorsDesktop.width} / ${doctorsDesktop.height}` }}
        />

        <div className="absolute -bottom-8 -left-8 w-[34%] min-w-[150px]">
          {/* Same mobile capture as above, but framed to a realistic phone
              silhouette for the corner overlay — the tall full-page crop
              would otherwise tower over the desktop screenshot at this size. */}
          <img
            src={doctorsMobile.src}
            width={doctorsMobile.width}
            height={doctorsMobile.height}
            alt=""
            loading={loading}
            className="w-full rounded-xl border-4 border-white object-cover object-top shadow-[0_18px_45px_rgba(0,0,0,0.20)]"
            style={{ aspectRatio: "9 / 18" }}
          />
        </div>
      </div>
    </div>
  );
}
