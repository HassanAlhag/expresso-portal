import React from "react";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { resolveWebsiteImage, toWebsiteImageUrl } from "../utils/websiteImages";

// The full Expresso Digital logo. `variant="onDark"` uses white-logo.png
// (white wordmark) for dark surfaces. CMS overrides in Website Settings
// (branding.logoUrl / logoWhiteUrl) still win. Minimum width 112px.
export default function BrandLogo({ variant = "primary", height = 48, className = "", alt = "Expresso Digital" }) {
  const settings = useSiteSettings();
  const configured =
    variant === "onDark" ? settings?.branding?.logoWhiteUrl : settings?.branding?.logoUrl;
  const fallback = variant === "onDark" ? "/white-logo.png" : "/logo.png";
  const src = configured ? toWebsiteImageUrl(configured) : resolveWebsiteImage(settings, fallback);

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`w-auto object-contain ${className}`}
      style={{ height }}
    />
  );
}
