import React from "react";
import { motion } from "framer-motion";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";

const logos = [
  "godfel-logo.png",
  "floraison-logo.png",
  "alpha-logo.png",
  "baytwaard-logo.png",
  "aroma-logo.png",
  "mih-logo.png",
  "baytwaard-logo.png",
  "aroma-logo.png",
  "godfel-logo.png",
  "floraison-logo.png",
  "alpha-logo.png",
  "baytwaard-logo.png",
  "aroma-logo.png",
  "mih-logo.png",
  "baytwaard-logo.png",
  "aroma-logo.png",
];

const ScrollingLogos = () => {
  const settings = useSiteSettings();
  const items = logos.map((logo) => ({ logo, src: resolveWebsiteImage(settings, `/${logo}`) }));

  return (
    <div className="bg-gray-900 py-10">
      <div className="flex overflow-hidden">
        <TranslateWrapper><LogoItems items={items} /></TranslateWrapper>
        <TranslateWrapper><LogoItems items={items} /></TranslateWrapper>
        <TranslateWrapper><LogoItems items={items} /></TranslateWrapper>
      </div>
    </div>
  );
};

const TranslateWrapper = ({ children, reverse }) => {
  return (
    <motion.div
      initial={{ translateX: reverse ? "-100%" : "0%" }}
      animate={{ translateX: reverse ? "0%" : "-100%" }}
      transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      className="flex gap-10 px-2"
    >
      {children}
    </motion.div>
  );
};

const LogoItem = ({ src, logo }) => (
  <div className="w-20 md:w-28 h-20 md:h-28 flex justify-center items-center hover:bg-gray-800 transition-colors rounded">
    <img src={src} alt={logo} className="max-h-full max-w-full object-contain" loading="lazy" />
  </div>
);

const LogoItems = ({ items }) => (
  <>
    {items.map((item, index) => (
      <LogoItem key={index} src={item.src} logo={item.logo} />
    ))}
  </>
);

export default ScrollingLogos;
