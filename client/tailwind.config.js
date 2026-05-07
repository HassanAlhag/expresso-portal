/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        textGray: "#5F5F5F",
        textHeader: "#1B1D21",
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
