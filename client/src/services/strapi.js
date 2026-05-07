// /client/src/services/strapi.js
const API = process.env.REACT_APP_STRAPI_URL || "http://localhost:1337";
const abs = (u) => (!u ? "" : u.startsWith("http") ? u : `${API}${u}`);

// supports: string URL, {url}, or {data:{attributes:{url}}}
const mediaUrl = (m) => {
  if (!m) return "";
  if (typeof m === "string") return abs(m);
  return abs(m.url || m?.data?.attributes?.url);
};

export async function fetchHomeHeroSlides(slug = "home") {
  // ✅ simple endpoint you built in Strapi controller
  const res = await fetch(
    `${API}/api/pages/hero?slug=${encodeURIComponent(slug)}`
  );
  if (!res.ok) throw new Error(`Hero API error ${res.status}`);

  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((s) => ({
    id: s.id,
    heading: s.heading,
    description: s.description,
    mainBg: mediaUrl(s.mainBg),
    thumbImage: mediaUrl(s.thumbImage),
    frameBg: mediaUrl(s.frameBg),
  }));
}
