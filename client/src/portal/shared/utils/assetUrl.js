const API_ORIGIN =
  process.env.REACT_APP_API_ORIGIN || "https://expresso-portal-api.onrender.com";

export function getAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
