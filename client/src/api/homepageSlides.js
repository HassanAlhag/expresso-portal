export async function listPublicHomepageSlides() {
  const res = await fetch("/api/homepage/slides/public", {
    credentials: "include",
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
