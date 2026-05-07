import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BRAND = "#7F8AD1";
const WAIT_TIME = 2800;

export const ProtfolioHeader = () => {
  return (
    <header className="px-4 pt-10 pb-3 text-center">
      <h2 className="mx-auto max-w-6xl font-black tracking-tight leading-[0.98] text-neutral-950">
        {/* Line 1 */}
        <span
          className="block text-[clamp(26px,3.8vw,52px)]"
          style={{ color: BRAND }}
        >
          Real projects. Real outcomes.
        </span>

        {/* Line 2 (animated) */}
        <span className="block text-[clamp(36px,5.6vw,78px)]">
          <AnimatedText
            phrases={[
              "Websites & Landing Pages",
              "PPC Ads That Convert",
              "Social Content & Reels",
              "Brand Design Systems",
            ]}
          />
        </span>
      </h2>

      {/* Paragraph */}
      <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-neutral-600 sm:text-base">
        Explore a selection of our latest work — from conversion-focused web
        builds to campaign creatives and performance marketing. Each project is
        designed to move people from attention to action.
      </p>
    </header>
  );
};

function AnimatedText({ phrases = [] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!phrases.length) return;
    const t = setInterval(() => {
      setActive((p) => (p + 1) % phrases.length);
    }, WAIT_TIME);
    return () => clearInterval(t);
  }, [phrases]);

  const current = phrases[active] || "";

  return (
    <span className="relative inline-block align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="inline-block"
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
