// Kinds of visual work shown in the public Portfolio (/portfolio).
// The website keeps its own copy of these labels (client/src/data/workTypes.js);
// a client test compares the two lists.
export const WORK_TYPES = Object.freeze([
  Object.freeze({ key: "website", label: "Website" }),
  Object.freeze({ key: "ecommerce", label: "E-commerce" }),
  Object.freeze({ key: "social", label: "Social Media" }),
  Object.freeze({ key: "video", label: "Video" }),
  Object.freeze({ key: "branding", label: "Branding" }),
  Object.freeze({ key: "platform", label: "Digital Platform" }),
  Object.freeze({ key: "other", label: "Other" }),
]);

export const WORK_TYPE_KEYS = Object.freeze(WORK_TYPES.map((t) => t.key));

export const WORK_STATUSES = Object.freeze(["draft", "published", "archived"]);
