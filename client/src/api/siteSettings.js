const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

export async function getPublicSiteSettings() {
  const res = await fetch(`${API_BASE}/site-settings/public`, {
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return data.settings || {};
}
