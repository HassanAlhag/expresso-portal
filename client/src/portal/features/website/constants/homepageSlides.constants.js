// New slides: the second eyebrow is optional and starts blank.
export const EMPTY_HOMEPAGE_SLIDE = {
  eyebrowLeft: "EXPRESSO DIGITAL",
  eyebrowRight: "",
  title: "",
  subtitle: "",
  imageUrl: "",
  thumbImageUrl: "",
  ctaLabel: "Explore Services",
  ctaUrl: "/services",
  secondaryCtaLabel: "Talk to Us",
  secondaryCtaUrl: "/contact-us",
  order: 0,
  isActive: true,
};

// What the website shows for records saved before the eyebrow fields existed
// (field absent). Editing such a record starts from these values, so saving
// it does not silently change the live slide.
export const LEGACY_SLIDE_EYEBROWS = {
  eyebrowLeft: "EXPRESSO DIGITAL",
  eyebrowRight: "GROWTH SYSTEMS",
};
