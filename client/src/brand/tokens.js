// Expresso brand tokens for inline styles and JS (mirrors tailwind.config.js
// and the --ex-* CSS variables in src/index.css).
export const LOTUS = {
  50: "#F4F5FB",
  100: "#E8EAF6",
  200: "#CED3EC",
  300: "#A9B1DD",
  400: "#8390C8", // logo colour — fills and accents on dark surfaces
  500: "#6C79BC",
  600: "#5562A8", // text, links, actions on light surfaces (AA)
  700: "#444F8A",
  800: "#333B68",
  900: "#22274A",
};

export const ESPRESSO = "#562D0F";
export const SAND = "#F8F4EF";
export const NIGHT = "#15121F";
export const MIST = "#F7F7FA";

/** rgba() helper for the logo lotus colour. */
export const lotusAlpha = (a) => `rgba(131,144,200,${a})`;
