import React from "react";
import { BUSINESS_SUITE_IMAGES } from "../../data/businessSuiteProduct";
import { toWebsiteImageUrl } from "../../utils/websiteImages";

export default function BusinessSuiteVisual({ view = "crm", imageUrl, eager = false, dark = false, focused = false, compact = false }) {
  const asset = BUSINESS_SUITE_IMAGES[view];
  const defaultSrc = compact && asset.compact ? asset.compact : asset.src;
  const custom = imageUrl && imageUrl !== asset.src;
  return (
    <figure className={`m-0 min-w-0 ${compact ? "mx-auto w-full max-w-[480px]" : ""}`}>
      <div className={`overflow-hidden rounded-2xl border shadow-[0_16px_48px_rgba(21,18,31,0.12)] ${dark ? "border-white/20" : "border-ink-200"}`}>
        <div className="flex min-w-0 items-center gap-1.5 border-b border-ink-200 bg-white px-4 py-3" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-ink-200" /><span className="h-2 w-2 rounded-full bg-ink-200" /><span className="h-2 w-2 rounded-full bg-ink-200" />
          <span className="ml-3 truncate text-[11px] font-semibold text-ink-500">Expresso Business Suite</span>
        </div>
        <picture>
          {!custom && !compact ? <source media={focused ? "(max-width: 1023px)" : "(max-width: 639px)"} srcSet={asset.mobile} /> : null}
          <img src={toWebsiteImageUrl(custom ? imageUrl : defaultSrc)} alt={custom ? "Expresso Business Suite product view" : asset.alt} width={compact ? 480 : 1360} height={compact ? 390 : 780} loading={eager ? "eager" : "lazy"} className="block h-auto w-full bg-mist" />
        </picture>
      </div>
      <figcaption className={`mt-3 text-xs leading-relaxed ${dark ? "text-white/60" : "text-ink-500"}`}>{custom ? "Expresso Business Suite" : asset.caption}</figcaption>
    </figure>
  );
}
