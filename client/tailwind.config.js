/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      // Expresso brand tokens (approved design direction, Oct 2026).
      // Lotus is sampled from the logo (400 = #8390C8). Use 600+ for text and
      // actions on light backgrounds (WCAG AA); 400 for fills and dark UI.
      // Mirrored as CSS variables in src/index.css (--ex-*).
      colors: {
        textGray: "#5F5F5F",
        textHeader: "#1B1D21",
        lotus: {
          50: "#F4F5FB",
          100: "#E8EAF6",
          200: "#CED3EC",
          300: "#A9B1DD",
          400: "#8390C8",
          500: "#6C79BC",
          600: "#5562A8",
          700: "#444F8A",
          800: "#333B68",
          900: "#22274A",
        },
        espresso: {
          DEFAULT: "#562D0F",
          500: "#7A4A27",
          700: "#562D0F",
          100: "#F1E8E0",
        },
        sand: "#F8F4EF",
        night: {
          DEFAULT: "#15121F",
          800: "#24202F",
          700: "#2E2A3A",
        },
        mist: "#F7F7FA",
        ink: {
          900: "#15121F",
          600: "#4B4757",
          500: "#6B6776",
          400: "#9A97A3",
          200: "#E4E2E8",
          100: "#F0EFF3",
        },
      },
      fontFamily: {
        sans: ["ff-dax-pro", "Barlow", "sans-serif"],
        dax: ["ff-dax-pro", "Barlow", "sans-serif"],
        "dax-compact": ["ff-dax-compact-pro", "ff-dax-pro", "Barlow", "sans-serif"],
        "dax-condensed": ["ff-dax-pro-condensed", "ff-dax-pro", "Barlow", "sans-serif"],
        barlow: ["Barlow", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      screens: {
        xs: "350px",
        "sm-down": { max: "575px" },
        sm: "576px",
        "md-down": { max: "767px" },
        md: "768px",
        "lg-down": { max: "991px" },
        lg: "992px",
        "xl-down": { max: "1199px" },
        xl: "1200px",
      },
    },
  },

  plugins: [],
};
