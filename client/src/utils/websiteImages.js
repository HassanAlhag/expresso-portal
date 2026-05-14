import { WEBSITE_IMAGE_REGISTRY, normalizeImagePath } from "../data/websiteImageRegistry";

const REGISTRY_KEYS = new Set(
  WEBSITE_IMAGE_REGISTRY.map((item) => normalizeImagePath(item.defaultUrl))
);

function shouldUseApiAsset(path) {
  if (!path || typeof path !== "string") return false;
  if (path.startsWith("/uploads") || path.startsWith("uploads/")) return true;

  if (/^https?:\/\//i.test(path)) {
    try {
      return new URL(path).pathname.startsWith("/uploads");
    } catch {
      return false;
    }
  }

  return false;
}

export function toWebsiteImageUrl(path) {
  if (!path || typeof path !== "string") return "";
  const trimmed = path.trim();
  if (!trimmed) return "";

  if (shouldUseApiAsset(trimmed)) {
    const origin =
      process.env.REACT_APP_API_ORIGIN ||
      "https://expresso-portal-api.onrender.com";

    if (/^https?:\/\//i.test(trimmed)) {
      try {
        const url = new URL(trimmed);
        return `${origin}${url.pathname}`;
      } catch {
        return trimmed;
      }
    }

    return `${origin}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  }

  return trimmed;
}

export function getWebsiteImageOverrides(settings = {}) {
  const rows = Array.isArray(settings?.websiteImages?.images)
    ? settings.websiteImages.images
    : [];

  return rows.reduce((acc, item) => {
    const key = normalizeImagePath(item?.key || item?.defaultUrl);
    const url = item?.url || item?.imageUrl || "";
    if (key && url) acc[key] = url;
    return acc;
  }, {});
}

export function resolveWebsiteImage(settings, fallback) {
  if (!fallback || typeof fallback !== "string") return fallback;

  const normalizedFallback = normalizeImagePath(fallback);
  const overrides = getWebsiteImageOverrides(settings);
  const override = overrides[normalizedFallback];

  if (override) return toWebsiteImageUrl(override);
  return shouldUseApiAsset(fallback) ? toWebsiteImageUrl(fallback) : fallback;
}

export function resolveWebsiteImages(settings, value) {
  if (typeof value === "string") {
    const normalized = normalizeImagePath(value);
    return REGISTRY_KEYS.has(normalized)
      ? resolveWebsiteImage(settings, value)
      : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveWebsiteImages(settings, item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, itemValue]) => [
        key,
        resolveWebsiteImages(settings, itemValue),
      ])
    );
  }

  return value;
}
