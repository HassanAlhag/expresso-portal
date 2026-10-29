// Kinds of visual work in the public Portfolio. Mirrors WORK_TYPES in
// portal-api/src/modules/portfolio/workItem.constants.js (the API is
// authoritative); src/data/workTypes.test.js keeps the two lists equal.
export const WORK_TYPES = Object.freeze([
  { key: "website", label: "Website", plural: "Websites" },
  { key: "ecommerce", label: "E-commerce", plural: "E-commerce" },
  { key: "social", label: "Social Media", plural: "Social Media" },
  { key: "video", label: "Video", plural: "Video" },
  { key: "branding", label: "Branding", plural: "Branding" },
  { key: "platform", label: "Digital Platform", plural: "Digital Platforms" },
  { key: "other", label: "Other", plural: "Other work" },
]);

const BY_KEY = new Map(WORK_TYPES.map((t) => [t.key, t]));

export function workTypeLabel(key) {
  return BY_KEY.get(key)?.label || "";
}

export function workTypePlural(key) {
  return BY_KEY.get(key)?.plural || workTypeLabel(key);
}

/** Website-like work is shown in a browser frame. */
export const isScreenWork = (key) => key === "website" || key === "ecommerce" || key === "platform";
