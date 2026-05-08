const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

export async function listPublicHomepageSlides() {
  const res = await fetch(`${API_BASE}/homepage/slides/public`, {
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.ok === false) {
    throw new Error(data.message || "Failed to load homepage slides");
  }

  return {
    ...data,
    items: Array.isArray(data.items) ? data.items : [],
  };
}
