const API_ORIGIN =
  process.env.REACT_APP_API_ORIGIN ||
  "https://expresso-portal-api.onrender.com";

export function getAssetUrl(path) {
  if (!path) return "";

  // If database saved a full URL but it points to /uploads,
  // force it to load from the backend API server.
  if (path.startsWith("http")) {
    try {
      const url = new URL(path);

      if (url.pathname.startsWith("/uploads")) {
        return `${API_ORIGIN}${url.pathname}`;
      }

      return path;
    } catch {
      return path;
    }
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (normalized.startsWith("/uploads/")) {
    return `${API_ORIGIN}${normalized}`;
  }

  return normalized;
}
